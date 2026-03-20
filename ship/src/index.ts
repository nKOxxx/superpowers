/**
 * Ship Skill - Release Pipeline
 * 
 * Provides: semantic versioning, changelog generation, GitHub releases, publishing
 * Compatible with: Kimi K2.5, Node.js 18+, OpenClaw
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import semver from 'semver';

export type BumpType = 'patch' | 'minor' | 'major' | 'prerelease';

export interface ShipOptions {
  bump?: BumpType;
  version?: string;
  auto?: boolean;
  dryRun?: boolean;
  ci?: boolean;
  yes?: boolean;
  skipChecks?: boolean;
  githubRelease?: boolean;
  generateNotes?: boolean;
  prerelease?: string;
  publish?: boolean;
  registry?: string;
  changelog?: string;
  links?: boolean;
  exclude?: string[];
  workspaces?: boolean;
  githubToken?: string;
  message?: string;
}

export interface ShipResult {
  success: boolean;
  version: string;
  previousVersion: string;
  tag: string;
  changelogUpdated: boolean;
  githubReleaseUrl?: string;
  published: boolean;
  commits: CommitInfo[];
}

export interface CommitInfo {
  hash: string;
  message: string;
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
}

export interface PackageInfo {
  name: string;
  version: string;
  path: string;
  type: 'npm' | 'python' | 'rust' | 'go' | 'unknown';
}

/**
 * Detect package type and info
 */
export function detectPackage(projectPath: string = '.'): PackageInfo {
  // Check for package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return {
      name: pkg.name || 'unknown',
      version: pkg.version || '0.0.0',
      path: packageJsonPath,
      type: 'npm'
    };
  }

  // Check for Python
  const pyprojectPath = path.join(projectPath, 'pyproject.toml');
  if (fs.existsSync(pyprojectPath)) {
    const content = fs.readFileSync(pyprojectPath, 'utf8');
    const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
    const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
    return {
      name: nameMatch?.[1] || 'unknown',
      version: versionMatch?.[1] || '0.0.0',
      path: pyprojectPath,
      type: 'python'
    };
  }

  // Check for Cargo
  const cargoPath = path.join(projectPath, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    const content = fs.readFileSync(cargoPath, 'utf8');
    const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
    const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
    return {
      name: nameMatch?.[1] || 'unknown',
      version: versionMatch?.[1] || '0.0.0',
      path: cargoPath,
      type: 'rust'
    };
  }

  // Check for Go
  const goModPath = path.join(projectPath, 'go.mod');
  if (fs.existsSync(goModPath)) {
    const content = fs.readFileSync(goModPath, 'utf8');
    const moduleMatch = content.match(/module\s+(\S+)/);
    return {
      name: moduleMatch?.[1]?.split('/').pop() || 'unknown',
      version: '0.0.0',
      path: goModPath,
      type: 'go'
    };
  }

  return {
    name: 'unknown',
    version: '0.0.0',
    path: projectPath,
    type: 'unknown'
  };
}

/**
 * Get current git branch
 */
export function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Check if working directory is clean
 */
export function isWorkingDirectoryClean(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length === 0;
  } catch {
    return false;
  }
}

/**
 * Get latest tag
 */
export function getLatestTag(): string | null {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Get commits since last tag
 */
export function getCommitsSinceTag(tag: string | null): CommitInfo[] {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  
  try {
    const output = execSync(
      `git log ${range} --pretty=format:"%H|%s|%b---END---"`,
      { encoding: 'utf8' }
    );

    return output
      .split('---END---')
      .filter(entry => entry.trim())
      .map(entry => {
        const [hash, subject, body] = entry.split('|');
        const parsed = parseCommitMessage(subject);
        
        return {
          hash: hash.trim(),
          message: subject.trim(),
          ...parsed,
          breaking: parsed.breaking || body?.includes('BREAKING CHANGE:') || false
        };
      });
  } catch {
    return [];
  }
}

/**
 * Parse conventional commit message
 */
function parseCommitMessage(message: string): { type: string; scope?: string; subject: string; breaking: boolean } {
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  
  if (match) {
    return {
      type: match[1],
      scope: match[2],
      breaking: !!match[3],
      subject: match[4]
    };
  }

  return {
    type: 'chore',
    subject: message,
    breaking: false
  };
}

/**
 * Determine bump type from commits
 */
export function determineBumpType(commits: CommitInfo[]): BumpType {
  let hasBreaking = false;
  let hasFeature = false;
  let hasFix = false;

  for (const commit of commits) {
    if (commit.breaking) {
      hasBreaking = true;
    } else if (commit.type === 'feat') {
      hasFeature = true;
    } else if (commit.type === 'fix') {
      hasFix = true;
    }
  }

  if (hasBreaking) return 'major';
  if (hasFeature) return 'minor';
  if (hasFix) return 'patch';
  
  return 'patch'; // Default to patch
}

/**
 * Calculate new version
 */
export function calculateNewVersion(
  currentVersion: string,
  bumpType: BumpType,
  prereleaseId?: string
): string {
  if (prereleaseId) {
    return semver.inc(currentVersion, 'prerelease', prereleaseId) || currentVersion;
  }
  return semver.inc(currentVersion, bumpType) || currentVersion;
}

/**
 * Update version in package files
 */
export function updateVersion(packageInfo: PackageInfo, newVersion: string): void {
  if (packageInfo.type === 'npm') {
    const pkg = JSON.parse(fs.readFileSync(packageInfo.path, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(packageInfo.path, JSON.stringify(pkg, null, 2) + '\n');
  } else if (packageInfo.type === 'python') {
    let content = fs.readFileSync(packageInfo.path, 'utf8');
    content = content.replace(/version\s*=\s*"[^"]+"/, `version = "${newVersion}"`);
    fs.writeFileSync(packageInfo.path, content);
  } else if (packageInfo.type === 'rust') {
    let content = fs.readFileSync(packageInfo.path, 'utf8');
    content = content.replace(/version\s*=\s*"[^"]+"/, `version = "${newVersion}"`);
    fs.writeFileSync(packageInfo.path, content);
  }
}

/**
 * Generate changelog entry
 */
export function generateChangelog(
  version: string,
  commits: CommitInfo[],
  options: ShipOptions
): string {
  const date = new Date().toISOString().split('T')[0];
  let changelog = `## [${version}] - ${date}\n\n`;

  const sections: Record<string, CommitInfo[]> = {
    'Breaking Changes': [],
    'Features': [],
    'Bug Fixes': [],
    'Other': []
  };

  for (const commit of commits) {
    if (options.exclude?.includes(commit.type)) continue;

    if (commit.breaking) {
      sections['Breaking Changes'].push(commit);
    } else if (commit.type === 'feat') {
      sections['Features'].push(commit);
    } else if (commit.type === 'fix') {
      sections['Bug Fixes'].push(commit);
    } else {
      sections['Other'].push(commit);
    }
  }

  for (const [section, items] of Object.entries(sections)) {
    if (items.length === 0) continue;

    changelog += `### ${section}\n\n`;
    for (const item of items) {
      const scope = item.scope ? `**${item.scope}:** ` : '';
      const hash = options.links ? ` ([${item.hash.slice(0, 7)}])` : '';
      changelog += `- ${scope}${item.subject}${hash}\n`;
    }
    changelog += '\n';
  }

  return changelog;
}

/**
 * Update CHANGELOG.md file
 */
export function updateChangelogFile(
  changelogEntry: string,
  changelogPath: string = 'CHANGELOG.md'
): void {
  const fullPath = path.resolve(changelogPath);
  
  if (fs.existsSync(fullPath)) {
    const existing = fs.readFileSync(fullPath, 'utf8');
    // Insert after the header
    const lines = existing.split('\n');
    const headerEnd = lines.findIndex(line => line.startsWith('## '));
    
    if (headerEnd === -1) {
      fs.writeFileSync(fullPath, existing + '\n' + changelogEntry);
    } else {
      const before = lines.slice(0, headerEnd).join('\n');
      const after = lines.slice(headerEnd).join('\n');
      fs.writeFileSync(fullPath, before + '\n' + changelogEntry + after);
    }
  } else {
    const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    fs.writeFileSync(fullPath, header + changelogEntry);
  }
}

/**
 * Run safety checks
 */
export function runSafetyChecks(options: ShipOptions): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (options.skipChecks) {
    return { passed: true, errors };
  }

  // Check working directory
  if (!isWorkingDirectoryClean()) {
    errors.push('Working directory is not clean. Commit or stash changes first.');
  }

  // Check branch
  const branch = getCurrentBranch();
  if (branch !== 'main' && branch !== 'master') {
    errors.push(`Not on main/master branch (currently on ${branch}).`);
  }

  // Check if version already tagged
  const latestTag = getLatestTag();
  if (latestTag) {
    try {
      const commits = getCommitsSinceTag(latestTag);
      if (commits.length === 0) {
        errors.push('No new commits since last tag.');
      }
    } catch {
      // Ignore
    }
  }

  return { passed: errors.length === 0, errors };
}

/**
 * Create GitHub release
 */
export async function createGitHubRelease(
  tag: string,
  notes: string,
  options: ShipOptions
): Promise<string | undefined> {
  const token = options.githubToken || process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.warn('   ⚠️  No GitHub token provided');
    return undefined;
  }

  const repo = getGitHubRepo();
  if (!repo) {
    console.warn('   ⚠️  Could not detect GitHub repository');
    return undefined;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: tag,
        name: options.prerelease ? `${tag} (Pre-release)` : tag,
        body: notes,
        prerelease: !!options.prerelease,
        draft: false
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data.html_url;
  } catch (error) {
    console.warn('   ⚠️  Failed to create GitHub release:', error);
    return undefined;
  }
}

/**
 * Get GitHub repo from git remote
 */
function getGitHubRepo(): string | null {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Publish to npm
 */
export async function publishNpm(options: ShipOptions): Promise<boolean> {
  try {
    const args = ['publish'];
    
    if (options.prerelease) {
      args.push('--tag', options.prerelease);
    }
    
    if (options.registry) {
      args.push('--registry', options.registry);
    }

    execSync(`npm ${args.join(' ')}`, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Main ship function
 */
export async function ship(options: ShipOptions = {}, projectPath: string = '.'): Promise<ShipResult> {
  console.log('\n🚀 Ship - Release Pipeline\n');

  // Detect package
  const packageInfo = detectPackage(projectPath);
  console.log(`   Package: ${packageInfo.name} (${packageInfo.type})`);
  console.log(`   Current version: ${packageInfo.version}`);

  // Run safety checks
  if (!options.skipChecks && !options.dryRun) {
    const checks = runSafetyChecks(options);
    if (!checks.passed) {
      console.error('\n   ❌ Safety checks failed:');
      for (const error of checks.errors) {
        console.error(`      - ${error}`);
      }
      if (!options.ci) {
        console.log('\n   Use --skip-checks to bypass (not recommended)');
      }
      throw new Error('Safety checks failed');
    }
    console.log('   ✅ Safety checks passed');
  }

  // Determine bump type
  let bumpType: BumpType = options.bump || 'patch';
  
  if (options.auto) {
    const latestTag = getLatestTag();
    const commits = getCommitsSinceTag(latestTag);
    bumpType = determineBumpType(commits);
    console.log(`   Auto-detected bump: ${bumpType}`);
  }

  // Calculate new version
  let newVersion: string;
  if (options.version) {
    newVersion = options.version;
  } else {
    newVersion = calculateNewVersion(packageInfo.version, bumpType, options.prerelease);
  }
  
  console.log(`   New version: ${newVersion}`);

  // Get commits
  const latestTag = getLatestTag();
  const commits = getCommitsSinceTag(latestTag);
  console.log(`   Commits since ${latestTag || 'start'}: ${commits.length}`);

  // Dry run
  if (options.dryRun) {
    console.log('\n   📝 Dry run - no changes made');
    console.log('\n   Would:');
    console.log(`      - Update version to ${newVersion}`);
    console.log(`      - Update CHANGELOG.md`);
    console.log(`      - Create git tag v${newVersion}`);
    if (options.githubRelease) {
      console.log(`      - Create GitHub release`);
    }
    if (options.publish) {
      console.log(`      - Publish to registry`);
    }
    
    return {
      success: true,
      version: newVersion,
      previousVersion: packageInfo.version,
      tag: `v${newVersion}`,
      changelogUpdated: false,
      published: false,
      commits
    };
  }

  // Confirm if not CI
  if (!options.ci && !options.yes) {
    // In non-interactive mode, proceed
    console.log('\n   Proceeding with release...');
  }

  // Update version
  updateVersion(packageInfo, newVersion);
  console.log('   ✅ Version updated');

  // Generate changelog
  const changelogEntry = generateChangelog(newVersion, commits, options);
  updateChangelogFile(changelogEntry, options.changelog);
  console.log('   ✅ Changelog updated');

  // Git commit
  const message = options.message || `chore(release): ${newVersion}`;
  execSync('git add -A');
  execSync(`git commit -m "${message}"`);
  console.log('   ✅ Changes committed');

  // Git tag
  const tag = `v${newVersion}`;
  execSync(`git tag -a ${tag} -m "Release ${newVersion}"`);
  console.log(`   ✅ Tag created: ${tag}`);

  // Push
  execSync('git push');
  execSync('git push --tags');
  console.log('   ✅ Pushed to remote');

  // GitHub release
  let githubReleaseUrl: string | undefined;
  if (options.githubRelease) {
    githubReleaseUrl = await createGitHubRelease(tag, changelogEntry, options);
    if (githubReleaseUrl) {
      console.log(`   ✅ GitHub release created: ${githubReleaseUrl}`);
    }
  }

  // Publish
  let published = false;
  if (options.publish && packageInfo.type === 'npm') {
    published = await publishNpm(options);
    if (published) {
      console.log('   ✅ Published to npm');
    } else {
      console.warn('   ⚠️  Publish failed');
    }
  }

  console.log('\n🎉 Release complete!');
  console.log(`   Version ${newVersion} is now live`);

  return {
    success: true,
    version: newVersion,
    previousVersion: packageInfo.version,
    tag,
    changelogUpdated: true,
    githubReleaseUrl,
    published,
    commits
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  // Parse positional arg (bump type)
  const bumpTypes: BumpType[] = ['patch', 'minor', 'major'];
  const bumpArg = args.find(arg => bumpTypes.includes(arg as BumpType));
  
  const options: ShipOptions = {
    bump: bumpArg as BumpType,
    dryRun: args.includes('--dry-run') || args.includes('-n'),
    ci: args.includes('--ci'),
    yes: args.includes('--yes') || args.includes('-y'),
    skipChecks: args.includes('--skip-checks'),
    githubRelease: args.includes('--github-release') || args.includes('-g'),
    generateNotes: args.includes('--generate-notes'),
    publish: args.includes('--publish') || args.includes('-p'),
    links: args.includes('--links') || args.includes('-l'),
    auto: args.includes('--auto') || args.includes('-a'),
    workspaces: args.includes('--workspaces') || args.includes('-w')
  };

  // Parse prerelease
  const prereleaseIndex = args.findIndex(arg => arg === '--prerelease');
  if (prereleaseIndex !== -1 && args[prereleaseIndex + 1]) {
    options.prerelease = args[prereleaseIndex + 1];
  }

  // Parse version
  const versionIndex = args.findIndex(arg => arg === '--version' || arg === '-v');
  if (versionIndex !== -1 && args[versionIndex + 1]) {
    options.version = args[versionIndex + 1];
  }

  // Parse message
  const messageIndex = args.findIndex(arg => arg === '--message' || arg === '-m');
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    options.message = args[messageIndex + 1];
  }

  // Parse changelog
  const changelogIndex = args.findIndex(arg => arg === '--changelog');
  if (changelogIndex !== -1 && args[changelogIndex + 1]) {
    options.changelog = args[changelogIndex + 1];
  }

  // Parse exclude
  const excludeIndex = args.findIndex(arg => arg === '--exclude');
  if (excludeIndex !== -1 && args[excludeIndex + 1]) {
    options.exclude = args[excludeIndex + 1].split(',');
  }

  // Parse registry
  const registryIndex = args.findIndex(arg => arg === '--registry');
  if (registryIndex !== -1 && args[registryIndex + 1]) {
    options.registry = args[registryIndex + 1];
  }

  ship(options).catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
}

export default ship;
