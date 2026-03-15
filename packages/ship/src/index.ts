import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import semver from 'semver';

/**
 * Ship command options
 */
export interface ShipOptions {
  version: string;
  dryRun: boolean;
  skipTag: boolean;
  skipPush: boolean;
  skipRelease: boolean;
  changelog: boolean;
}

/**
 * Git commit structure
 */
interface Commit {
  hash: string;
  message: string;
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
}

/**
 * Conventional commit types
 */
const conventionalTypes: Record<string, { emoji: string; section: string; bump: 'major' | 'minor' | 'patch' | null }> = {
  feat: { emoji: '✨', section: 'Features', bump: 'minor' },
  fix: { emoji: '🐛', section: 'Bug Fixes', bump: 'patch' },
  docs: { emoji: '📚', section: 'Documentation', bump: null },
  style: { emoji: '💄', section: 'Styles', bump: null },
  refactor: { emoji: '♻️', section: 'Code Refactoring', bump: null },
  perf: { emoji: '⚡', section: 'Performance Improvements', bump: 'patch' },
  test: { emoji: '✅', section: 'Tests', bump: null },
  build: { emoji: '📦', section: 'Build System', bump: null },
  ci: { emoji: '🔧', section: 'CI/CD', bump: null },
  chore: { emoji: '🔨', section: 'Chores', bump: null },
  revert: { emoji: '⏪', section: 'Reverts', bump: 'patch' },
};

/**
 * Main ship command
 */
export async function shipCommand(options: ShipOptions): Promise<void> {
  console.log(chalk.blue('🚢 Ship - Release Pipeline\n'));
  
  try {
    // Validate git state
    validateGitState();
    
    // Get current version
    const currentVersion = getCurrentVersion();
    console.log(chalk.gray(`Current version: ${currentVersion}`));
    
    // Calculate new version
    const newVersion = calculateNewVersion(currentVersion, options.version);
    console.log(chalk.gray(`New version: ${newVersion}`));
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 DRY RUN - No changes will be applied\n'));
    }
    
    // Get commits since last tag
    const commits = getCommitsSinceLastTag();
    console.log(chalk.gray(`Commits since last tag: ${commits.length}`));
    
    if (commits.length === 0) {
      console.log(chalk.yellow('\n⚠️ No commits since last tag. Nothing to release.'));
      return;
    }
    
    // Detect bump type from commits
    const detectedBump = detectBumpType(commits);
    if (detectedBump) {
      console.log(chalk.gray(`Detected bump type from commits: ${detectedBump}`));
    }
    
    // Show commit summary
    const commitTypes = new Map<string, number>();
    for (const commit of commits) {
      commitTypes.set(commit.type, (commitTypes.get(commit.type) || 0) + 1);
    }
    console.log(chalk.blue('\n📊 Commit summary:'));
    for (const [type, count] of commitTypes) {
      const config = conventionalTypes[type];
      const emoji = config?.emoji || '📝';
      console.log(chalk.gray(`  ${emoji} ${type}: ${count}`));
    }
    
    // Generate changelog
    let changelogEntry = '';
    if (options.changelog) {
      changelogEntry = generateChangelog(commits, newVersion);
      console.log(chalk.blue('\n📝 Changelog entry:'));
      const preview = changelogEntry.split('\n').slice(0, 15).join('\n');
      console.log(chalk.gray(preview));
      if (changelogEntry.split('\n').length > 15) {
        console.log(chalk.gray('...'));
      }
    }
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n✅ Dry run complete'));
      return;
    }
    
    // Confirm with user
    console.log(chalk.yellow(`\n⚠️ About to release v${newVersion}`));
    console.log(chalk.gray('Press Ctrl+C to cancel, continuing in 3 seconds...'));
    await sleep(3000);
    
    // Update package.json version
    updateVersion(newVersion);
    console.log(chalk.green('✅ Updated package.json'));
    
    // Update changelog
    if (options.changelog) {
      updateChangelogFile(changelogEntry);
      console.log(chalk.green('✅ Updated CHANGELOG.md'));
    }
    
    // Git commit
    execSync('git add package.json CHANGELOG.md 2>/dev/null || git add package.json', { stdio: 'ignore' });
    execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'ignore' });
    console.log(chalk.green('✅ Created release commit'));
    
    // Git tag
    if (!options.skipTag) {
      execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'ignore' });
      console.log(chalk.green(`✅ Created tag v${newVersion}`));
    }
    
    // Git push
    if (!options.skipPush) {
      execSync('git push', { stdio: 'ignore' });
      if (!options.skipTag) {
        execSync('git push --tags', { stdio: 'ignore' });
      }
      console.log(chalk.green('✅ Pushed to remote'));
    }
    
    // GitHub release
    if (!options.skipRelease && !options.skipTag) {
      const released = await createGitHubRelease(newVersion, changelogEntry);
      if (released) {
        console.log(chalk.green('✅ Created GitHub release'));
      }
    }
    
    console.log(chalk.green(`\n🎉 Successfully shipped v${newVersion}!`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Release failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Validate git repository state
 */
function validateGitState(): void {
  try {
    // Check if git repo
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      throw new Error('Uncommitted changes detected. Commit or stash them first.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Uncommitted')) {
      throw error;
    }
    throw new Error('Not a git repository');
  }
}

/**
 * Get current version from package.json
 */
function getCurrentVersion(): string {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version || '0.0.0';
}

/**
 * Calculate new version based on bump type
 */
function calculateNewVersion(current: string, bumpType: string): string {
  // If explicit version provided (e.g., "1.2.3")
  if (bumpType.match(/^\d+\.\d+\.\d+/)) {
    return bumpType;
  }
  
  // Otherwise treat as semver bump
  const newVersion = semver.inc(current, bumpType as semver.ReleaseType);
  if (!newVersion) {
    throw new Error(`Invalid version bump type: ${bumpType}`);
  }
  
  return newVersion;
}

/**
 * Get commits since last tag
 */
function getCommitsSinceLastTag(): Commit[] {
  try {
    // Get the latest tag
    let sinceRef = '';
    try {
      sinceRef = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    } catch {
      // No tags yet, get all commits
      sinceRef = '--max-parents=0 HEAD';
    }
    
    // Get commits with body for breaking change detection
    const format = '%H|%s|%b';
    const output = execSync(`git log ${sinceRef}..HEAD --pretty=format:"${format}" --`, {
      encoding: 'utf-8',
    });
    
    if (!output.trim()) return [];
    
    // Split by commit separator (triple newline from %b)
    const commits = output.trim().split('\n').filter(line => line.includes('|'));
    
    return commits.map(line => {
      const parts = line.split('|');
      const hash = parts[0];
      const message = parts[1];
      const body = parts.slice(2).join('|');
      return parseCommit(hash, message, body);
    });
  } catch {
    return [];
  }
}

/**
 * Parse a git commit
 */
function parseCommit(hash: string, message: string, body: string = ''): Commit {
  // Parse conventional commit format
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  
  const breaking = message.includes('!:') || body.includes('BREAKING CHANGE:');
  
  if (match) {
    return {
      hash: hash.slice(0, 7),
      message,
      type: match[1],
      scope: match[2],
      subject: match[3],
      breaking,
    };
  }
  
  return {
    hash: hash.slice(0, 7),
    message,
    type: 'other',
    subject: message,
    breaking,
  };
}

/**
 * Detect bump type from commits
 */
function detectBumpType(commits: Commit[]): 'major' | 'minor' | 'patch' | null {
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
  return null;
}

/**
 * Generate changelog entry
 */
function generateChangelog(commits: Commit[], version: string): string {
  const date = new Date().toISOString().split('T')[0];
  let entry = `## [${version}] - ${date}\n\n`;
  
  // Group commits by type
  const groups: Record<string, Commit[]> = {};
  
  for (const commit of commits) {
    const type = conventionalTypes[commit.type] ? commit.type : 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(commit);
  }
  
  // Breaking changes first
  const breakingCommits = commits.filter(c => c.breaking);
  if (breakingCommits.length > 0) {
    entry += `### 🚨 Breaking Changes\n\n`;
    for (const commit of breakingCommits) {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      entry += `- ${scope}${commit.subject} (${commit.hash})\n`;
    }
    entry += '\n';
  }
  
  // Generate sections for conventional types
  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore'];
  
  for (const type of typeOrder) {
    const typeCommits = groups[type];
    if (!typeCommits || typeCommits.length === 0) continue;
    
    const config = conventionalTypes[type];
    if (!config) continue;
    
    entry += `### ${config.emoji} ${config.section}\n\n`;
    
    for (const commit of typeCommits) {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      entry += `- ${scope}${commit.subject} (${commit.hash})\n`;
    }
    
    entry += '\n';
  }
  
  // Other commits
  if (groups['other'] && groups['other'].length > 0) {
    entry += `### 📝 Other Changes\n\n`;
    for (const commit of groups['other']) {
      entry += `- ${commit.subject} (${commit.hash})\n`;
    }
    entry += '\n';
  }
  
  return entry;
}

/**
 * Update package.json version
 */
function updateVersion(version: string): void {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = version;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

/**
 * Update CHANGELOG.md file
 */
function updateChangelogFile(newEntry: string): void {
  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
  
  let content = '';
  if (existsSync(changelogPath)) {
    content = readFileSync(changelogPath, 'utf-8');
  } else {
    content = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }
  
  // Insert new entry after the header
  const lines = content.split('\n');
  const headerEnd = lines.findIndex(line => line.startsWith('## ['));
  
  if (headerEnd === -1) {
    content = content.trim() + '\n\n' + newEntry;
  } else {
    const before = lines.slice(0, headerEnd).join('\n');
    const after = lines.slice(headerEnd).join('\n');
    content = before + '\n\n' + newEntry + after;
  }
  
  writeFileSync(changelogPath, content);
}

/**
 * Create GitHub release
 */
async function createGitHubRelease(version: string, changelog: string): Promise<boolean> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log(chalk.yellow('⚠️ No GH_TOKEN found, skipping GitHub release'));
    console.log(chalk.gray('Set GH_TOKEN or GITHUB_TOKEN environment variable to auto-create releases'));
    return false;
  }
  
  // Check if gh CLI is available
  try {
    execSync('which gh', { stdio: 'ignore' });
    
    // Create release using gh CLI
    const notes = changelog
      .replace(/### /g, '## ')
      .replace(/## \[.+\] - .+\n\n/, '')
      .trim();
    
    execSync(
      `gh release create "v${version}" --title "v${version}" --notes "${notes.replace(/"/g, '\\"')}"`,
      { stdio: 'ignore' }
    );
    return true;
  } catch {
    console.log(chalk.yellow('⚠️ GitHub CLI not available or release failed'));
    return false;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get recommended version bump from commits
 */
export function getRecommendedBump(commits: Commit[]): 'major' | 'minor' | 'patch' | null {
  return detectBumpType(commits);
}
