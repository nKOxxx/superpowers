/**
 * Ship Skill - Release Pipeline
 * 
 * One-command release pipeline: version bump, changelog generation, 
 * and GitHub release creation.
 * Compatible with Kimi K2.5 - uses straightforward types and clear structure.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// Types
// ============================================================================

export type BumpType = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  bump: BumpType | string;
  dryRun?: boolean;
  skipTests?: boolean;
  skipChangelog?: boolean;
  skipTag?: boolean;
  skipPush?: boolean;
  skipRelease?: boolean;
  cwd?: string;
  message?: string;
}

export interface ShipResult {
  version?: string;
  previousVersion?: string;
  changelog?: string;
  releaseUrl?: string;
  commits: string[];
  tag?: string;
  errors: string[];
}

export interface CommitInfo {
  hash: string;
  message: string;
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
}

export interface SkillResult<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  media?: string[];
  errors?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const CHANGELOG_TYPES: Record<string, { label: string; emoji: string }> = {
  feat: { label: 'Features', emoji: '✨' },
  feature: { label: 'Features', emoji: '✨' },
  fix: { label: 'Bug Fixes', emoji: '🐛' },
  docs: { label: 'Documentation', emoji: '📚' },
  style: { label: 'Styles', emoji: '💎' },
  refactor: { label: 'Code Refactoring', emoji: '♻️' },
  perf: { label: 'Performance', emoji: '🚀' },
  test: { label: 'Tests', emoji: '🧪' },
  build: { label: 'Build System', emoji: '🏗️' },
  ci: { label: 'CI/CD', emoji: '⚙️' },
  chore: { label: 'Chores', emoji: '🧹' },
  revert: { label: 'Reverts', emoji: '⏪' },
  other: { label: 'Other', emoji: '📝' }
};

// ============================================================================
// Git Helpers
// ============================================================================

function execGit(args: string[], cwd: string): string {
  try {
    return execSync(`git ${args.join(' ')}`, { cwd, encoding: 'utf-8' });
  } catch (error: any) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

function isGitRepo(cwd: string): boolean {
  try {
    execGit(['rev-parse', '--git-dir'], cwd);
    return true;
  } catch {
    return false;
  }
}

function getGitStatus(cwd: string): { isClean: boolean; branch: string } {
  const status = execGit(['status', '--porcelain'], cwd);
  const branch = execGit(['branch', '--show-current'], cwd).trim();
  return { isClean: status.trim() === '', branch };
}

function getLatestTag(cwd: string): string | undefined {
  try {
    return execGit(['describe', '--tags', '--abbrev=0'], cwd).trim();
  } catch {
    return undefined;
  }
}

function getCommitsSince(cwd: string, since?: string): string[] {
  try {
    const range = since ? `${since}..HEAD` : 'HEAD';
    const output = execGit(['log', range, '--pretty=format:%s'], cwd);
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function getRecentCommits(cwd: string, count: number = 50): CommitInfo[] {
  try {
    const output = execGit(['log', `-${count}`, '--pretty=format:%H|%s'], cwd);
    const commits: CommitInfo[] = [];
    
    for (const line of output.trim().split('\n')) {
      const [hash, ...messageParts] = line.split('|');
      const message = messageParts.join('|');
      if (!hash || !message) continue;
      
      commits.push(parseCommit(hash, message));
    }
    
    return commits;
  } catch {
    return [];
  }
}

function hasRemote(cwd: string): boolean {
  try {
    const remotes = execGit(['remote'], cwd);
    return remotes.trim().length > 0;
  } catch {
    return false;
  }
}

function createCommit(cwd: string, message: string, files: string[]): void {
  for (const file of files) {
    if (existsSync(resolve(cwd, file))) {
      execGit(['add', file], cwd);
    }
  }
  execGit(['commit', '-m', message], cwd);
}

function createTag(cwd: string, tagName: string, message: string): void {
  execGit(['tag', '-a', tagName, '-m', message], cwd);
}

function pushToRemote(cwd: string, withTags: boolean = false): void {
  execGit(['push'], cwd);
  if (withTags) {
    execGit(['push', '--tags'], cwd);
  }
}

function getRemoteUrl(cwd: string): { owner: string; repo: string } | undefined {
  try {
    const output = execGit(['remote', 'get-url', 'origin'], cwd).trim();
    const match = output.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  } catch {
    // Ignore
  }
  return undefined;
}

function parseCommit(hash: string, message: string): CommitInfo {
  const conventionalMatch = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  
  if (conventionalMatch) {
    return {
      hash,
      message,
      type: conventionalMatch[1].toLowerCase(),
      scope: conventionalMatch[2],
      subject: conventionalMatch[4],
      breaking: conventionalMatch[3] === '!' || message.includes('BREAKING CHANGE')
    };
  }

  return {
    hash,
    message,
    type: 'other',
    subject: message.split('\n')[0],
    breaking: message.includes('BREAKING CHANGE')
  };
}

// ============================================================================
// Package.json Helpers
// ============================================================================

function readPackageJson(cwd: string): { name: string; version: string } | null {
  try {
    const pkgPath = resolve(cwd, 'package.json');
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    return { name: pkg.name || 'unknown', version: pkg.version || '0.0.0' };
  } catch {
    return null;
  }
}

function writePackageJson(cwd: string, version: string): void {
  const pkgPath = resolve(cwd, 'package.json');
  const content = readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(content);
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

// ============================================================================
// Semver Helpers
// ============================================================================

function incrementVersion(current: string, bump: BumpType): string {
  const parts = current.split('.');
  const major = parseInt(parts[0], 10) || 0;
  const minor = parseInt(parts[1], 10) || 0;
  const patch = parseInt(parts[2], 10) || 0;

  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+/.test(version);
}

// ============================================================================
// Changelog
// ============================================================================

function generateChangelogEntry(version: string, commits: CommitInfo[]): string {
  const date = new Date().toISOString().split('T')[0];
  let entry = `## [${version}] - ${date}\n\n`;

  // Group commits by type
  const grouped: Record<string, CommitInfo[]> = {};
  
  for (const commit of commits) {
    const type = CHANGELOG_TYPES[commit.type] ? commit.type : 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(commit);
  }

  // Sort types by importance (features first, then fixes, etc.)
  const typeOrder = ['feat', 'feature', 'fix', 'docs', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert', 'other'];
  
  for (const type of typeOrder) {
    const groupCommits = grouped[type];
    if (!groupCommits || groupCommits.length === 0) continue;

    const typeInfo = CHANGELOG_TYPES[type];
    entry += `### ${typeInfo.emoji} ${typeInfo.label}\n\n`;
    
    for (const commit of groupCommits) {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      const breaking = commit.breaking ? ' [BREAKING]' : '';
      entry += `- ${scope}${commit.subject}${breaking}\n`;
    }
    
    entry += '\n';
  }

  return entry;
}

function updateChangelog(cwd: string, entry: string, changelogFile: string = 'CHANGELOG.md'): void {
  const changelogPath = resolve(cwd, changelogFile);
  const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  
  let existing = '';
  if (existsSync(changelogPath)) {
    existing = readFileSync(changelogPath, 'utf-8');
    existing = existing.replace(header, '').trim();
  }

  const newContent = header + entry + existing;
  writeFileSync(changelogPath, newContent);
}

// ============================================================================
// GitHub Release
// ============================================================================

function createGitHubRelease(
  cwd: string,
  version: string,
  changelog: string
): string | undefined {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    return undefined;
  }

  const remote = getRemoteUrl(cwd);
  if (!remote) {
    return undefined;
  }

  const tagName = `v${version}`;
  const releaseBody = changelog
    .replace(/#{1,3}\s/g, '')
    .slice(0, 5000);

  try {
    // Try using gh CLI
    execSync('gh --version', { stdio: 'pipe' });
    
    const args = [
      'release', 'create', tagName,
      '--title', `Release ${version}`,
      '--notes', releaseBody
    ];

    execSync(`GH_TOKEN=${token} gh ${args.join(' ')}`, { cwd, stdio: 'pipe' });
    
    return `https://github.com/${remote.owner}/${remote.repo}/releases/tag/${tagName}`;
  } catch {
    return undefined;
  }
}

// ============================================================================
// Main Ship Function
// ============================================================================

/**
 * Ship - Release pipeline: version bump, changelog, tag, push, release
 */
export async function ship(options: ShipOptions): Promise<SkillResult<ShipResult>> {
  const cwd = options.cwd || process.cwd();
  const errors: string[] = [];
  const commits: string[] = [];
  
  try {
    // Verify git repo
    if (!isGitRepo(cwd)) {
      throw new Error('Not a git repository');
    }

    // Verify package.json
    const pkg = readPackageJson(cwd);
    if (!pkg) {
      throw new Error('No package.json found');
    }

    const previousVersion = pkg.version;

    // Calculate new version
    let newVersion: string;
    if (options.bump === 'patch' || options.bump === 'minor' || options.bump === 'major') {
      newVersion = incrementVersion(previousVersion, options.bump);
    } else {
      if (!isValidVersion(options.bump)) {
        throw new Error(`Invalid version: ${options.bump}`);
      }
      newVersion = options.bump;
    }

    // Check working directory
    const status = getGitStatus(cwd);
    if (!options.dryRun && !status.isClean) {
      throw new Error('Working directory not clean. Commit or stash changes first.');
    }

    // Run tests if not skipped
    if (!options.skipTests && !options.dryRun) {
      try {
        execSync('npm test', { cwd, stdio: 'pipe' });
      } catch {
        throw new Error('Tests failed. Fix tests or use skipTests to bypass.');
      }
    }

    // Get commits for changelog
    const latestTag = getLatestTag(cwd);
    const commitHistory = getRecentCommits(cwd, 50);
    commits.push(...commitHistory.map(c => c.message));

    // Generate changelog
    let changelogEntry = '';
    if (!options.skipChangelog) {
      // Filter commits since last tag
      const relevantCommits = latestTag 
        ? commitHistory.filter(c => {
            try {
              execSync(`git merge-base --is-ancestor ${c.hash} HEAD`, { cwd });
              execSync(`git merge-base --is-ancestor ${latestTag} ${c.hash}`, { cwd });
              return true;
            } catch {
              return false;
            }
          })
        : commitHistory;
      
      changelogEntry = generateChangelogEntry(newVersion, relevantCommits);
    }

    // Dry run - show preview
    if (options.dryRun) {
      const message = `🔍 Dry Run Preview\n\n` +
        `Version: ${previousVersion} → ${newVersion}\n` +
        `Branch: ${status.branch}\n` +
        `Commits: ${commits.length}\n\n` +
        `${options.skipChangelog ? '' : 'Changelog Preview:\n---\n' + changelogEntry + '\n---'}`;

      return {
        success: true,
        data: {
          previousVersion,
          version: newVersion,
          commits,
          changelog: changelogEntry,
          errors
        },
        message
      };
    }

    // Update package.json
    writePackageJson(cwd, newVersion);

    // Update CHANGELOG.md
    if (!options.skipChangelog) {
      updateChangelog(cwd, changelogEntry);
    }

    // Git commit
    const commitMessage = options.message?.replace('{{version}}', newVersion) || 
      `chore(release): ${newVersion}`;
    createCommit(cwd, commitMessage, ['package.json', 'CHANGELOG.md']);

    // Create git tag
    const tagName = `v${newVersion}`;
    if (!options.skipTag) {
      createTag(cwd, tagName, `Release ${newVersion}`);
    }

    // Push to origin
    if (!options.skipPush && hasRemote(cwd)) {
      pushToRemote(cwd, !options.skipTag);
    }

    // Create GitHub release
    let releaseUrl: string | undefined;
    if (!options.skipRelease && (process.env.GITHUB_TOKEN || process.env.GH_TOKEN)) {
      releaseUrl = createGitHubRelease(cwd, newVersion, changelogEntry);
    }

    const message = `🚀 Release Complete!\n\n` +
      `Package: ${pkg.name}\n` +
      `Version: ${previousVersion} → ${newVersion}\n` +
      `Tag: ${tagName}\n` +
      `${releaseUrl ? `Release: ${releaseUrl}\n` : ''}` +
      `\n✅ Successfully shipped!`;

    return {
      success: true,
      data: {
        version: newVersion,
        previousVersion,
        changelog: changelogEntry,
        tag: tagName,
        releaseUrl,
        commits,
        errors
      },
      message
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);
    
    return {
      success: false,
      data: { commits, errors },
      message: `❌ Release failed: ${errorMessage}`,
      errors
    };
  }
}

// ============================================================================
// Additional Exports
// ============================================================================

export { ship as release, ship as publish };
export default ship;
