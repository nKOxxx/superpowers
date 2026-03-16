#!/usr/bin/env node
import { Command } from 'commander';
import { ShipSkill } from './index.js';
import chalk from 'chalk';

const program = new Command();
const skill = new ShipSkill();

program
  .name('ship')
  .description('One-command release pipeline')
  .version('1.0.0');

program
  .command('release')
  .description('Create a new release')
  .argument('[bump]', 'Version bump type', 'patch')
  .option('-t, --tag <tag>', 'Prerelease tag (e.g., alpha, beta)')
  .option('--skip-changelog', 'Skip changelog generation')
  .option('--skip-github', 'Skip GitHub release creation')
  .option('--skip-npm', 'Skip npm publishing')
  .option('--skip-git-checks', 'Skip git branch/working directory checks')
  .option('--skip-tests', 'Skip running tests')
  .option('-n, --dry-run', 'Preview changes without making them')
  .option('-f, --force', 'Force release even with warnings')
  .option('-v, --version <version>', 'Custom version (overrides bump)')
  .action(async (bump, options) => {
    try {
      await skill.loadConfig();
      
      const releaseType = ['major', 'minor', 'patch', 'prerelease'].includes(bump) 
        ? bump as 'major' | 'minor' | 'patch' | 'prerelease'
        : 'patch';
      
      if (options.dryRun) {
        console.log(chalk.blue('🔍 Dry run mode - no changes will be made\n'));
      } else {
        console.log(chalk.blue('🚀 Starting release...\n'));
      }
      
      const result = await skill.release(releaseType, {
        tag: options.tag,
        skipChangelog: options.skipChangelog,
        skipGithub: options.skipGithub,
        skipNpm: options.skipNpm,
        skipGitChecks: options.skipGitChecks,
        skipTests: options.skipTests,
        dryRun: options.dryRun,
        force: options.force,
        version: options.version
      });

      if (result.success) {
        console.log(chalk.green(`✓ ${result.message}`));
        process.exit(0);
      } else {
        console.error(chalk.red(`✗ ${result.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current release status')
  .action(async () => {
    try {
      await skill.loadConfig();
      
      const status = await skill.getStatus();
      
      console.log(chalk.blue('📊 Release Status\n'));
      
      console.log(chalk.bold('Current State:'));
      console.log(`  Version: ${chalk.cyan(status.currentVersion)}`);
      console.log(`  Branch: ${chalk.cyan(status.currentBranch)}`);
      console.log(`  Working dir: ${status.isClean ? chalk.green('clean') : chalk.yellow('dirty')}`);
      console.log(`  Last tag: ${chalk.cyan(status.lastTag)}`);
      
      console.log(chalk.bold('\nCommits:'));
      console.log(`  Since last tag: ${chalk.cyan(status.commitsSinceTag)}`);
      console.log(`  Recommended bump: ${chalk.cyan(status.recommendedBump)}`);
      
      console.log(chalk.bold('\nConfiguration:'));
      console.log(`  GH_TOKEN: ${status.hasGhToken ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`  NPM_TOKEN: ${status.hasNpmToken ? chalk.green('✓') : chalk.red('✗')}`);
      
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('preview')
  .description('Preview what would be included in the next release')
  .argument('[bump]', 'Version bump type', 'patch')
  .action(async (bump) => {
    try {
      await skill.loadConfig();
      
      const releaseType = ['major', 'minor', 'patch', 'prerelease'].includes(bump) 
        ? bump as 'major' | 'minor' | 'patch' | 'prerelease'
        : 'patch';
      
      const preview = await skill.preview(releaseType);
      
      console.log(chalk.blue('📋 Release Preview\n'));
      console.log(`Current: ${chalk.cyan(preview.currentVersion)}`);
      console.log(`New: ${chalk.green(preview.newVersion)}\n`);
      
      console.log(chalk.bold('Changelog:'));
      console.log(preview.changelog);
      
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize Ship configuration')
  .option('--default-bump <type>', 'Set default bump type')
  .option('--changelog-path <path>', 'Set changelog file path')
  .option('--release-branch <branch>', 'Set release branch name')
  .action(async (options) => {
    try {
      await skill.initConfig();
      
      if (options.defaultBump) {
        // Update config with default bump
      }
      if (options.changelogPath) {
        // Update config with changelog path
      }
      if (options.releaseBranch) {
        // Update config with release branch
      }
      
      console.log(chalk.green('✓ Created .ship.config.json'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();
