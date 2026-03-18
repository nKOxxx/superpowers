#!/usr/bin/env node
/**
 * ship.ts - One-command release pipeline
 * 
 * Features:
 * - Semantic version bumping
 * - Changelog generation from conventional commits
 * - GitHub release creation
 * - Telegram notifications
 * - Dry-run mode
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync, spawn } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import simpleGit from 'simple-git';
import semver from 'semver';

const program = new Command();
const git = simpleGit();

interface ShipOptions {
  dryRun?: boolean;
  skipChangelog?: boolean;
  skipGit?: boolean;
  skipGithub?: boolean;
  message?: string;
  tagPrefix?: string;
  branch?: string;
  telegram?: boolean;
  verbose?: boolean;
}

program
  .name('ship')
  .description('One-command release pipeline')
  .argument('<bump>', 'version bump: major, minor, patch, or version number')
  .option('--dry-run', 'preview changes without applying')
  .option('--skip-changelog', 'skip changelog generation')
  .option('--skip-git', 'skip git operations')
  .option('--skip-github', 'skip GitHub release')
  .option('-m, --message <msg>', 'custom release message')
  .option('--tag-prefix <prefix>', 'git tag prefix', 'v')
  .option('--branch <name>', 'release branch', 'main')
  .option('--telegram', 'send notification to Telegram')
  .option('-v, --verbose', 'verbose output')
  .action(async (bump: string, options: ShipOptions) => {
    const spinner = ora('Initializing release pipeline...').start();

    try {
      // Validate git repo
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        throw new Error('Not a git repository');
      }

      // Check clean working directory
      const status = await git.status();
      if (!options.skipGit && status.files.length > 0) {
        throw new Error('Working directory not clean. Commit or stash changes first.');
      }

      // Check branch
      const currentBranch = status.current;
      if (currentBranch !== options.branch) {
        spinner.warn(`Not on ${options.branch} branch (currently on ${currentBranch})`);
        if (!options.dryRun) {
          const proceed = await confirm('Continue anyway?');
          if (!proceed) return;
        }
      }

      // Get current version
      const packagePath = './package.json';
      let currentVersion = '0.0.0';
      if (existsSync(packagePath)) {
        const pkg = JSON.parse(await readFile(packagePath, 'utf-8'));
        currentVersion = pkg.version || '0.0.0';
      }
      spinner.info(`Current version: ${chalk.cyan(currentVersion)}`);

      // Determine new version
      let newVersion: string;
      if (['major', 'minor', 'patch'].includes(bump)) {
        newVersion = semver.inc(currentVersion, bump as semver.ReleaseType) || currentVersion;
      } else if (semver.valid(bump)) {
        newVersion = bump;
      } else {
        throw new Error(`Invalid bump: ${bump}. Use major, minor, patch, or semantic version.`);
      }

      spinner.info(`New version: ${chalk.green(newVersion)}`);

      if (options.dryRun) {
        spinner.succeed(chalk.yellow('Dry run - no changes made'));
        console.log(chalk.blue('\nPlanned changes:'));
        console.log(`  • Bump version: ${currentVersion} → ${newVersion}`);
        if (!options.skipChangelog) console.log('  • Update CHANGELOG.md');
        if (!options.skipGit) console.log(`  • Create git tag: ${options.tagPrefix}${newVersion}`);
        if (!options.skipGithub) console.log('  • Create GitHub release');
        return;
      }

      // Generate changelog
      let changelog = '';
      if (!options.skipChangelog) {
        spinner.text = 'Generating changelog...';
        changelog = await generateChangelog(currentVersion, newVersion);
        
        const changelogPath = './CHANGELOG.md';
        let existingChangelog = '';
        if (existsSync(changelogPath)) {
          existingChangelog = await readFile(changelogPath, 'utf-8');
        }
        
        const newChangelog = `# Changelog\n\n## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n${changelog}\n${existingChangelog.replace('# Changelog\n\n', '')}`;
        await writeFile(changelogPath, newChangelog);
        spinner.succeed('Changelog updated');
      }

      // Update package.json
      if (existsSync(packagePath)) {
        spinner.text = 'Updating package.json...';
        const pkg = JSON.parse(await readFile(packagePath, 'utf-8'));
        pkg.version = newVersion;
        await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');
        spinner.succeed('package.json updated');
      }

      // Git operations
      if (!options.skipGit) {
        spinner.text = 'Creating commit...';
        const commitMessage = options.message || `chore(release): ${options.tagPrefix}${newVersion}`;
        await git.add(['package.json', 'CHANGELOG.md']);
        await git.commit(commitMessage);
        spinner.succeed('Commit created');

        spinner.text = 'Creating tag...';
        const tagName = `${options.tagPrefix}${newVersion}`;
        const tagMessage = options.message || `Release ${newVersion}`;
        await git.addTag(tagName);
        spinner.succeed(`Tag created: ${tagName}`);

        spinner.text = 'Pushing to remote...';
        await git.push('origin', currentBranch || 'main');
        await git.pushTags('origin');
        spinner.succeed('Pushed to remote');
      }

      // GitHub release
      if (!options.skipGithub) {
        spinner.text = 'Creating GitHub release...';
        await createGitHubRelease(newVersion, changelog, options);
        spinner.succeed('GitHub release created');
      }

      // Telegram notification
      if (options.telegram) {
        await sendTelegramNotification(newVersion, changelog, options);
      }

      spinner.succeed(chalk.green(`🚀 Released ${options.tagPrefix}${newVersion}!`));
      console.log(chalk.blue('\nNext steps:'));
      console.log('  • Verify the release on GitHub');
      console.log('  • Deploy to production if needed');

    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

// Generate changelog from commits
async function generateChangelog(fromVersion: string, toVersion: string): Promise<string> {
  try {
    const log = await git.log({
      from: `${fromVersion}..HEAD`,
      format: { hash: '%H', message: '%s', body: '%b' }
    });

    const sections: Record<string, string[]> = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      chore: [],
      other: []
    };

    for (const commit of log.all) {
      const match = commit.message.match(/^(\w+)(?:\(.+\))?!?:\s*(.+)$/);
      if (match) {
        const [, type, msg] = match;
        const section = sections[type] ? type : 'other';
        sections[section].push(`- ${msg} (${commit.hash.slice(0, 7)})`);
      } else {
        sections.other.push(`- ${commit.message} (${commit.hash.slice(0, 7)})`);
      }
    }

    let changelog = '';
    const sectionNames: Record<string, string> = {
      feat: '### ✨ Features',
      fix: '### 🐛 Bug Fixes',
      docs: '### 📚 Documentation',
      style: '### 💄 Styling',
      refactor: '### ♻️ Refactoring',
      perf: '### ⚡ Performance',
      test: '### ✅ Tests',
      chore: '### 🔧 Chores',
      other: '### 📝 Other'
    };

    for (const [key, items] of Object.entries(sections)) {
      if (items.length > 0) {
        changelog += `${sectionNames[key]}\n${items.join('\n')}\n\n`;
      }
    }

    return changelog.trim();
  } catch {
    return `Release ${toVersion}`;
  }
}

// Create GitHub release
async function createGitHubRelease(version: string, changelog: string, options: ShipOptions): Promise<void> {
  const tagName = `${options.tagPrefix}${version}`;
  const releaseNotes = options.message || changelog || `Release ${version}`;
  
  try {
    // Check if gh CLI is available
    execSync('gh --version', { stdio: 'pipe' });
    
    execSync(
      `gh release create "${tagName}" --title "${tagName}" --notes "${releaseNotes.replace(/"/g, '\\"')}"`,
      { stdio: options.verbose ? 'inherit' : 'pipe' }
    );
  } catch (error) {
    console.log(chalk.yellow('GitHub CLI not available or release failed'));
    console.log(chalk.gray('Create release manually:'));
    console.log(chalk.gray(`  https://github.com/<owner>/<repo>/releases/new?tag=${tagName}`));
  }
}

// Send Telegram notification
async function sendTelegramNotification(version: string, changelog: string, options: ShipOptions): Promise<void> {
  try {
    const tagName = `${options.tagPrefix}${version}`;
    const message = `
🚀 New Release: ${tagName}

${options.message || `Version ${version} has been released!`}

${changelog ? changelog.slice(0, 500) + (changelog.length > 500 ? '...' : '') : ''}
    `.trim();

    execSync(`openclaw message send --channel telegram --message "${message}"`, {
      stdio: 'pipe'
    });
  } catch (error) {
    console.log(chalk.yellow('Failed to send Telegram notification'));
  }
}

// Confirm prompt
async function confirm(message: string): Promise<boolean> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

program.parse();
