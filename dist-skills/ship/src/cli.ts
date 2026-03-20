#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ShipController } from './ship-controller';
import { ShipOptions, VersionType } from './types';

const program = new Command();

program
  .name('ship')
  .description('One-command release pipeline for versioning, changelogs, and publishing')
  .version('1.0.0');

program
  .argument('<version>', 'Version type: patch, minor, major, or specific version (e.g., 1.2.3)')
  .option('-d, --dry-run', 'Preview changes without applying', false)
  .option('--no-publish', 'Skip npm publish')
  .option('--no-github-release', 'Skip GitHub release')
  .option('-b, --branch <name>', 'Target branch', 'main')
  .option('-m, --message <msg>', 'Custom release message')
  .option('--prerelease <tag>', 'Create prerelease (e.g., alpha, beta)')
  .option('--skip-tests', 'Skip running tests', false)
  .option('--skip-build', 'Skip build step', false)
  .option('--skip-changelog', 'Skip changelog generation', false)
  .option('--force', 'Force release even with uncommitted changes', false)
  .option('--silent', 'Silent mode', false)
  .action(async (version: string, options: any) => {
    try {
      const shipOptions: ShipOptions = {
        version: version as VersionType,
        dryRun: options.dryRun,
        publish: options.publish,
        githubRelease: options.githubRelease,
        branch: options.branch,
        message: options.message,
        prerelease: options.prerelease,
        skipTests: options.skipTests,
        skipBuild: options.skipBuild,
        skipChangelog: options.skipChangelog,
        force: options.force,
        silent: options.silent
      };

      const controller = new ShipController(shipOptions);

      if (!options.silent) {
        console.log(chalk.blue('🚀 Ship:'), chalk.white(`Preparing ${version} release...`));
        if (options.dryRun) {
          console.log(chalk.yellow('⚠️  Dry run mode - no changes will be applied'));
        }
      }

      const result = await controller.execute();

      if (!options.silent) {
        printResults(result);
      }

      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function printResults(result: any) {
  console.log('');
  
  const statusIcon = result.success ? chalk.green('✓') : chalk.red('✗');
  const statusText = result.success ? chalk.green('RELEASED') : chalk.red('FAILED');
  console.log(statusIcon, chalk.blue('Status:'), statusText);

  if (result.version) {
    console.log(chalk.blue('📦 Version:'), chalk.green(`v${result.version}`));
  }

  if (result.previousVersion) {
    console.log(chalk.gray(`   Previous: v${result.previousVersion}`));
  }

  if (result.changelog) {
    console.log(chalk.blue('📝 Changelog:'), result.changelog.generated ? chalk.green('Generated') : chalk.gray('Skipped'));
    if (result.changelog.entries && result.changelog.entries.length > 0) {
      console.log(chalk.gray(`   Entries: ${result.changelog.entries.length}`));
    }
  }

  if (result.git) {
    console.log(chalk.blue('🔀 Git:'));
    if (result.git.commit) console.log(chalk.gray(`   Commit: ${result.git.commit}`));
    if (result.git.tag) console.log(chalk.gray(`   Tag: ${result.git.tag}`));
  }

  if (result.github) {
    console.log(chalk.blue('🐙 GitHub:'), result.github.released ? chalk.green('Released') : chalk.gray('Skipped'));
    if (result.github.url) console.log(chalk.gray(`   URL: ${result.github.url}`));
  }

  if (result.npm) {
    console.log(chalk.blue('📦 npm:'), result.npm.published ? chalk.green('Published') : chalk.gray('Skipped'));
  }

  if (result.warnings && result.warnings.length > 0) {
    console.log('');
    console.log(chalk.yellow('Warnings:'));
    result.warnings.forEach((w: string) => console.log(chalk.gray(`  ⚠️  ${w}`)));
  }

  if (result.errors && result.errors.length > 0) {
    console.log('');
    console.log(chalk.red('Errors:'));
    result.errors.forEach((e: string) => console.log(chalk.gray(`  ✗ ${e}`)));
  }
}

program.parse();
