import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import semver from 'semver';

interface ShipOptions {
  version: string;
  dryRun?: boolean;
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
  style: { emoji: '💎', section: 'Styles' },
  refactor: { emoji: '♻️', section: 'Code Refactoring' },
  perf: { emoji: '🚀', section: 'Performance' },
  test: { emoji: '🧪', section: 'Tests' },
  chore: { emoji: '🔧', section: 'Chores' },
  ci: { emoji: '🔨', section: 'CI/CD' },
  build: { emoji: '📦', section: 'Build' },
  revert: { emoji: '⏪', section: 'Reverts' }
};

function parseCommitMessage(message: string): Commit {
  const lines = message.split('\n');
  const firstLine = lines[0];
  
  // Parse conventional commit format: type(scope): subject
  const match = firstLine.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  
  if (match) {
    return {
      hash: '',
      message: firstLine,
      type: match[1],
      scope: match[2],
      subject: match[3]
    };
  }
  
  return {
    hash: '',
    message: firstLine,
    type: 'other',
    subject: firstLine
  };
}

function getCommitsSinceLastTag(): Commit[] {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD~20';
    
    const output = execSync(`git log ${range} --pretty=format:"%H|%s"`, { encoding: 'utf-8' });
    
    return output
      .trim()
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => {
        const [hash, ...messageParts] = line.split('|');
        const message = messageParts.join('|');
        const parsed = parseCommitMessage(message);
        return { ...parsed, hash: hash.slice(0, 7) };
      });
  } catch {
    return [];
  }
}

function generateChangelog(commits: Commit[], version: string): string {
  const date = new Date().toISOString().split('T')[0];
  let changelog = `## [${version}] - ${date}\n\n`;
  
  // Group commits by type
  const grouped: Record<string, Commit[]> = {};
  
  for (const commit of commits) {
    const type = conventionalTypes[commit.type] ? commit.type : 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(commit);
  }
  
  // Generate sections
  for (const [type, typeCommits] of Object.entries(grouped)) {
    const config = conventionalTypes[type] || { emoji: '📝', section: 'Other' };
    changelog += `### ${config.emoji} ${config.section}\n\n`;
    
    for (const commit of typeCommits) {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      changelog += `- ${scope}${commit.subject} (${commit.hash})\n`;
    }
    
    changelog += '\n';
  }
  
  return changelog;
}

function bumpVersion(currentVersion: string, bumpType: string): string {
  if (semver.valid(bumpType)) {
    return bumpType;
  }
  
  const newVersion = semver.inc(currentVersion, bumpType as semver.ReleaseType);
  if (!newVersion) {
    throw new Error(`Invalid version bump: ${bumpType}`);
  }
  
  return newVersion;
}

function updatePackageJsonVersion(newVersion: string): void {
  const packagePath = join(process.cwd(), 'package.json');
  if (!existsSync(packagePath)) return;
  
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  packageJson.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
}

function updateChangelog(changelog: string): void {
  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  
  let existingContent = '';
  if (existsSync(changelogPath)) {
    existingContent = readFileSync(changelogPath, 'utf-8');
  }
  
  const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  const newContent = header + changelog + existingContent.replace(header, '');
  
  writeFileSync(changelogPath, newContent);
}

async function createGitHubRelease(version: string, changelog: string, dryRun: boolean): Promise<void> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log(chalk.yellow('No GH_TOKEN found. Skipping GitHub release.'));
    return;
  }
  
  const repoUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
  const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/]+)\.git?/);
  
  if (!match) {
    console.log(chalk.yellow('Could not determine GitHub repo. Skipping release.'));
    return;
  }
  
  const [, owner, repo] = match;
  const releaseNotes = changelog.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  
  const command = `curl -s -X POST \
    -H "Authorization: token ${token}" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/${owner}/${repo}/releases \
    -d '{"tag_name":"${version}","name":"${version}","body":"${releaseNotes}"}'`;
  
  if (dryRun) {
    console.log(chalk.blue(`[DRY RUN] Would create GitHub release: ${version}`));
    return;
  }
  
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(chalk.green(`GitHub release created: ${version}`));
  } catch (error) {
    console.log(chalk.yellow('Failed to create GitHub release'));
  }
}

export const shipCommand = new Command('ship')
  .description('One-command release pipeline - version bump, changelog, tag, release')
  .requiredOption('-v, --version <type>', 'Version bump: patch, minor, major, or explicit version')
  .option('-d, --dry-run', 'Preview changes without executing')
  .action(async (options: ShipOptions) => {
    const spinner = ora('Preparing release...').start();
    
    try {
      // Check git status
      try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      } catch {
        spinner.fail(chalk.red('Not a git repository'));
        process.exit(1);
      }
      
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (status.trim() && !options.dryRun) {
        spinner.fail(chalk.red('Working directory not clean. Commit changes first.'));
        process.exit(1);
      }
      
      // Get current version
      const packagePath = join(process.cwd(), 'package.json');
      let currentVersion = '0.0.0';
      if (existsSync(packagePath)) {
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
        currentVersion = packageJson.version || '0.0.0';
      }
      
      // Calculate new version
      const newVersion = bumpVersion(currentVersion, options.version);
      spinner.text = `Bumping version: ${currentVersion} → ${newVersion}`;
      
      // Get commits and generate changelog
      const commits = getCommitsSinceLastTag();
      if (commits.length === 0) {
        spinner.warn(chalk.yellow('No commits since last tag'));
      }
      
      const changelog = generateChangelog(commits, newVersion);
      
      if (options.dryRun) {
        spinner.succeed(chalk.green('[DRY RUN] Release preview:'));
        console.log(chalk.blue(`\nVersion: ${currentVersion} → ${newVersion}`));
        console.log(chalk.blue('\nChangelog:'));
        console.log(changelog);
        return;
      }
      
      // Update package.json
      updatePackageJsonVersion(newVersion);
      spinner.text = 'Updated package.json';
      
      // Update changelog
      updateChangelog(changelog);
      spinner.text = 'Updated CHANGELOG.md';
      
      // Git add
      execSync('git add package.json CHANGELOG.md');
      spinner.text = 'Staged changes';
      
      // Git commit
      execSync(`git commit -m "chore(release): ${newVersion}"`);
      spinner.text = 'Created release commit';
      
      // Git tag
      execSync(`git tag -a ${newVersion} -m "Release ${newVersion}"`);
      spinner.text = 'Created tag';
      
      // Git push
      execSync('git push origin HEAD');
      execSync(`git push origin ${newVersion}`);
      spinner.text = 'Pushed to origin';
      
      spinner.succeed(chalk.green(`Released ${newVersion}!`));
      
      // Create GitHub release
      await createGitHubRelease(newVersion, changelog, options.dryRun || false);
      
      console.log(chalk.blue('\nChangelog:'));
      console.log(changelog);
      
    } catch (error) {
      spinner.fail(chalk.red(`Release failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
