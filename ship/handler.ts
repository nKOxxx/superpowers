import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Types
type VersionType = 'patch' | 'minor' | 'major';
type ChangeType = 'added' | 'fixed' | 'changed' | 'deprecated' | 'removed' | 'security' | 'docs' | 'other';

interface ShipOptions {
  version: VersionType | string;
  repo?: string;
  dryRun: boolean;
  push: boolean;
  release: boolean;
  changelogOnly: boolean;
  prerelease?: string;
}

interface ParsedCommit {
  type: ChangeType | 'other';
  scope?: string;
  message: string;
  sha: string;
}

interface Changes {
  added: string[];
  fixed: string[];
  changed: string[];
  deprecated: string[];
  removed: string[];
  security: string[];
  docs: string[];
  other: string[];
}

interface ReleaseResult {
  version: string;
  previousVersion: string;
  tag: string;
  changes: Changes;
  commits: number;
  filesChanged: number;
  releaseUrl?: string;
}

interface SkillContext {
  args: string[];
  options: Record<string, string | boolean>;
  cwd?: string;
}

interface SkillResult {
  success: boolean;
  message: string;
  data?: ReleaseResult;
  error?: string;
}

// Parse command line arguments
function parseArgs(args: string[]): ShipOptions {
  const options: ShipOptions = {
    version: 'patch',
    dryRun: false,
    push: true,
    release: true,
    changelogOnly: false
  };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      
      switch (key) {
        case 'version':
          options.version = value || 'patch';
          break;
        case 'repo':
          options.repo = value;
          break;
        case 'dry-run':
          options.dryRun = true;
          break;
        case 'no-push':
          options.push = false;
          break;
        case 'no-release':
          options.release = false;
          break;
        case 'changelog-only':
          options.changelogOnly = true;
          break;
        case 'prerelease':
          options.prerelease = value;
          break;
      }
    }
  }

  return options;
}

// Execute git command
function git(command: string, cwd: string): string {
  return execSync(`git ${command}`, { cwd, encoding: 'utf-8' }).trim();
}

// Get current version from package.json
function getCurrentVersion(cwd: string): string {
  const packagePath = path.join(cwd, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return pkg.version || '0.0.0';
  }
  return '0.0.0';
}

// Bump version
function bumpVersion(current: string, type: VersionType | string, prerelease?: string): string {
  const [major, minor, patch] = current.split('.').map(n => parseInt(n, 10));
  
  let newVersion: string;
  
  if (type === 'major') {
    newVersion = `${major + 1}.0.0`;
  } else if (type === 'minor') {
    newVersion = `${major}.${minor + 1}.0`;
  } else if (type === 'patch') {
    newVersion = `${major}.${minor}.${patch + 1}`;
  } else if (/^\d+\.\d+\.\d+/.test(type)) {
    // Specific version provided
    newVersion = type;
  } else {
    newVersion = `${major}.${minor}.${patch + 1}`;
  }
  
  if (prerelease) {
    newVersion += `-${prerelease}.1`;
  }
  
  return newVersion;
}

// Parse conventional commits
function parseCommits(log: string): ParsedCommit[] {
  const commits: ParsedCommit[] = [];
  const lines = log.split('\n');
  
  const typeMap: Record<string, ChangeType> = {
    'feat': 'added',
    'fix': 'fixed',
    'docs': 'docs',
    'style': 'other',
    'refactor': 'changed',
    'perf': 'changed',
    'test': 'other',
    'chore': 'other',
    'revert': 'fixed',
    'security': 'security',
    'deprecate': 'deprecated',
    'remove': 'removed'
  };
  
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]+)\s+(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
    if (match) {
      const [, sha, type, scope, message] = match;
      commits.push({
        type: typeMap[type] || 'other',
        scope,
        message,
        sha
      });
    }
  }
  
  return commits;
}

// Group commits by type
function groupCommits(commits: ParsedCommit[]): Changes {
  const changes: Changes = {
    added: [],
    fixed: [],
    changed: [],
    deprecated: [],
    removed: [],
    security: [],
    docs: [],
    other: []
  };
  
  for (const commit of commits) {
    if (commit.type === 'other') continue;
    
    const entry = commit.scope 
      ? `**${commit.scope}:** ${commit.message}`
      : commit.message;
    
    changes[commit.type].push(entry);
  }
  
  return changes;
}

// Generate changelog entry
function generateChangelogEntry(version: string, changes: Changes, date: string): string {
  let entry = `## [${version}] - ${date}\n\n`;
  
  if (changes.added.length > 0) {
    entry += '### Added\n';
    for (const item of changes.added) {
      entry += `- ${item}\n`;
    }
    entry += '\n';
  }
  
  if (changes.fixed.length > 0) {
    entry += '### Fixed\n';
    for (const item of changes.fixed) {
      entry += `- ${item}\n`;
    }
    entry += '\n';
  }
  
  if (changes.changed.length > 0) {
    entry += '### Changed\n';
    for (const item of changes.changed) {
      entry += `- ${item}\n`;
    }
    entry += '\n';
  }
  
  if (changes.deprecated.length > 0) {
    entry += '### Deprecated\n';
    for (const item of changes.deprecated) {
      entry += `- ${item}\n`;
    }
    entry += '\n';
  }
  
  if (changes.removed.length > 0) {
    entry += '### Removed\n';
    for (const item of changes.removed) {
      entry += `- ${item}\n`;
    }
    entry += '\n';
  }
  
  if (changes.security.length > 0) {
    entry += '### Security\n';
    for (const item of changes.security) {
      entry += `- ${item}\n`;
    }
    entry += '\n';
  }
  
  if (changes.docs.length > 0) {
    entry += '### Documentation\n';
    for (const item of changes.docs) {
      entry += `- ${item}\n`;
    }
    entry += '\n';
  }
  
  return entry;
}

// Update changelog file
function updateChangelog(cwd: string, entry: string, dryRun: boolean): void {
  const changelogPath = path.join(cwd, process.env.SHIP_CHANGELOG_FILE || 'CHANGELOG.md');
  
  let content = '';
  if (fs.existsSync(changelogPath)) {
    content = fs.readFileSync(changelogPath, 'utf-8');
  } else {
    content = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }
  
  // Insert after header
  const headerEnd = content.indexOf('\n\n') + 2;
  const newContent = content.slice(0, headerEnd) + entry + content.slice(headerEnd);
  
  if (!dryRun) {
    fs.writeFileSync(changelogPath, newContent);
  }
}

// Update package.json version
function updatePackageVersion(cwd: string, version: string, dryRun: boolean): void {
  const packagePath = path.join(cwd, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    pkg.version = version;
    if (!dryRun) {
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    }
  }
}

// Get repository info from git
function getRepoInfo(cwd: string): { owner: string; repo: string } | null {
  try {
    const remote = git('remote get-url origin', cwd);
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  } catch {
    // Ignore
  }
  return null;
}

// Create GitHub release
async function createGitHubRelease(
  owner: string,
  repo: string,
  tag: string,
  name: string,
  body: string,
  prerelease: boolean,
  token: string
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      tag_name: tag,
      name,
      body,
      draft: false,
      prerelease
    });
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/releases`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'OpenClaw-Ship-Skill'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          if (json.html_url) {
            resolve(json.html_url);
          } else {
            reject(new Error(json.message || 'Failed to create release'));
          }
        } catch {
          reject(new Error('Invalid response from GitHub'));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main handler function
export async function handler(context: SkillContext): Promise<SkillResult> {
  const cwd = context.cwd || process.cwd();
  
  try {
    // Parse arguments
    const options = parseArgs(context.args);
    
    // Check git status
    const status = git('status --porcelain', cwd);
    if (status && !options.dryRun) {
      return {
        success: false,
        message: 'Working directory is not clean. Commit or stash changes first.',
        error: 'Dirty working directory'
      };
    }
    
    // Get current version
    const currentVersion = getCurrentVersion(cwd);
    const newVersion = bumpVersion(currentVersion, options.version as VersionType, options.prerelease);
    const tagPrefix = process.env.SHIP_TAG_PREFIX || 'v';
    const tag = `${tagPrefix}${newVersion}`;
    
    // Get commits since last tag
    let commits: ParsedCommit[] = [];
    try {
      const lastTag = git('describe --tags --abbrev=0', cwd);
      const log = git(`log ${lastTag}..HEAD --pretty=format:"%h %s"`, cwd);
      commits = parseCommits(log);
    } catch {
      // No previous tag, get all commits
      const log = git('log --pretty=format:"%h %s"', cwd);
      commits = parseCommits(log);
    }
    
    const changes = groupCommits(commits);
    const date = new Date().toISOString().split('T')[0];
    const changelogEntry = generateChangelogEntry(newVersion, changes, date);
    
    // Count files changed
    let filesChanged = 0;
    try {
      const diffStat = git('diff --stat HEAD', cwd);
      const match = diffStat.match(/(\d+) files? changed/);
      if (match) filesChanged = parseInt(match[1], 10);
    } catch {
      // Ignore
    }
    
    // Dry run output
    if (options.dryRun) {
      const result: ReleaseResult = {
        version: newVersion,
        previousVersion: currentVersion,
        tag,
        changes,
        commits: commits.length,
        filesChanged
      };
      
      return {
        success: true,
        message: `[DRY RUN] Would release ${newVersion}\n\n${changelogEntry}`,
        data: result
      };
    }
    
    // Update files
    if (!options.changelogOnly) {
      updatePackageVersion(cwd, newVersion, false);
    }
    updateChangelog(cwd, changelogEntry, false);
    
    if (options.changelogOnly) {
      return {
        success: true,
        message: `Changelog updated for ${newVersion}`,
        data: {
          version: newVersion,
          previousVersion: currentVersion,
          tag,
          changes,
          commits: commits.length,
          filesChanged
        }
      };
    }
    
    // Git operations
    git('add -A', cwd);
    git(`commit -m "chore(release): ${tag}"`, cwd);
    git(`tag -a ${tag} -m "Release ${newVersion}"`, cwd);
    
    if (options.push) {
      const defaultBranch = process.env.SHIP_DEFAULT_BRANCH || 'main';
      git(`push origin ${defaultBranch}`, cwd);
      git(`push origin ${tag}`, cwd);
    }
    
    // Create GitHub release
    let releaseUrl: string | undefined;
    if (options.release && options.push) {
      const token = process.env.GITHUB_TOKEN;
      const repoInfo = options.repo 
        ? { owner: options.repo.split('/')[0], repo: options.repo.split('/')[1] }
        : getRepoInfo(cwd);
      
      if (token && repoInfo) {
        try {
          releaseUrl = await createGitHubRelease(
            repoInfo.owner,
            repoInfo.repo,
            tag,
            `Release ${newVersion}`,
            changelogEntry,
            !!options.prerelease,
            token
          );
        } catch (err) {
          console.error('Failed to create GitHub release:', err);
        }
      }
    }
    
    const result: ReleaseResult = {
      version: newVersion,
      previousVersion: currentVersion,
      tag,
      changes,
      commits: commits.length,
      filesChanged,
      releaseUrl
    };
    
    return {
      success: true,
      message: `🚀 Released ${tag}\n\n${changelogEntry}${releaseUrl ? `\nRelease: ${releaseUrl}` : ''}`,
      data: result
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Release failed: ${errorMessage}`,
      error: errorMessage
    };
  }
}

// CLI entry point
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (import.meta.url === `file://${__filename}`) {
  const args = process.argv.slice(2);
  const context: SkillContext = {
    args,
    options: {},
    cwd: process.cwd()
  };
  
  handler(context).then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}
