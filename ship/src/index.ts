import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import semver from 'semver';

interface ShipOptions {
  version: string;
  dryRun: boolean;
  skipTag: boolean;
  skipPush: boolean;
  skipRelease: boolean;
  changelog: boolean;
}

interface Commit {
  hash: string;
  message: string;
  type: string;
  scope?: string;
  subject: string;
}

const conventionalTypes: Record<string, { emoji: string; section: string }> = {
  feat: { emoji: '✨', section: 'Features' },
  fix: { emoji: '🐛', section: 'Bug Fixes' },
  docs: { emoji: '📚', section: 'Documentation' },
  style: { emoji: '💄', section: 'Styles' },
  refactor: { emoji: '♻️', section: 'Code Refactoring' },
  perf: { emoji: '⚡', section: 'Performance Improvements' },
  test: { emoji: '✅', section: 'Tests' },
  build: { emoji: '📦', section: 'Build System' },
  ci: { emoji: '🔧', section: 'CI/CD' },
  chore: { emoji: '🔨', section: 'Chores' },
};

export async function ship(options: ShipOptions): Promise<void> {
  return shipCommand(options);
}

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
    
    // Generate changelog
    let changelogEntry = '';
    if (options.changelog) {
      changelogEntry = generateChangelog(commits, newVersion);
      console.log(chalk.blue('\n📝 Changelog entry:'));
      console.log(chalk.gray(changelogEntry.split('\n').slice(0, 10).join('\n')));
      if (changelogEntry.split('\n').length > 10) {
        console.log(chalk.gray('...'));
      }
    }
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n✅ Dry run complete'));
      return;
    }
    
    // Confirm with user
    console.log(chalk.yellow(`\n⚠️ About to release v${newVersion}`));
    
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
      await createGitHubRelease(newVersion, changelogEntry);
      console.log(chalk.green('✅ Created GitHub release'));
    }
    
    console.log(chalk.green(`\n🎉 Successfully shipped v${newVersion}!`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Release failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

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

function getCurrentVersion(): string {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version || '0.0.0';
}

function calculateNewVersion(current: string, bumpType: string): string {
  // If explicit version provided
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
    
    // Get commits
    const format = '%H|%s';
    const output = execSync(`git log ${sinceRef}..HEAD --pretty=format:"${format}"`, {
      encoding: 'utf-8',
    });
    
    if (!output.trim()) return [];
    
    return output.trim().split('\n').map(line => {
      const [hash, message] = line.split('|');
      return parseCommit(hash, message);
    });
  } catch {
    return [];
  }
}

function parseCommit(hash: string, message: string): Commit {
  // Parse conventional commit format
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  
  if (match) {
    return {
      hash: hash.slice(0, 7),
      message,
      type: match[1],
      scope: match[2],
      subject: match[3],
    };
  }
  
  return {
    hash: hash.slice(0, 7),
    message,
    type: 'other',
    subject: message,
  };
}

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
  
  // Generate sections
  for (const [type, typeCommits] of Object.entries(groups)) {
    if (type === 'other' && !conventionalTypes[type]) continue;
    
    const config = conventionalTypes[type] || { emoji: '📝', section: 'Other Changes' };
    entry += `### ${config.emoji} ${config.section}\n\n`;
    
    for (const commit of typeCommits) {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      entry += `- ${scope}${commit.subject} (${commit.hash})\n`;
    }
    
    entry += '\n';
  }
  
  return entry;
}

function updateVersion(version: string): void {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = version;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

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
  const headerEnd = lines.findIndex(line => line.startsWith('## '));
  
  if (headerEnd === -1) {
    content = content.trim() + '\n\n' + newEntry;
  } else {
    const before = lines.slice(0, headerEnd).join('\n');
    const after = lines.slice(headerEnd).join('\n');
    content = before + '\n\n' + newEntry + after;
  }
  
  writeFileSync(changelogPath, content);
}

async function createGitHubRelease(version: string, changelog: string): Promise<void> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log(chalk.yellow('⚠️ No GH_TOKEN found, skipping GitHub release'));
    return;
  }
  
  // Check if gh CLI is available
  try {
    execSync('which gh', { stdio: 'ignore' });
    
    // Create release using gh CLI
    const notes = changelog.replace(/### /g, '## ').replace(/## \[.+\] - .+\n\n/, '');
    execSync(
      `gh release create "v${version}" --title "v${version}" --notes "${notes.replace(/"/g, '\\"')}"`,
      { stdio: 'ignore' }
    );
  } catch {
    console.log(chalk.yellow('⚠️ GitHub CLI not available, skipping GitHub release'));
  }
}
