#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ship, getCurrentVersion, bumpVersion, generateChangelog } from './dist/index.js';

const program = new Command();

program
  .name('ship')
  .description('One-command release pipeline')
  .requiredOption('--version <type>', 'Version bump: patch, minor, major, or x.x.x')
  .option('--dry-run', 'Preview changes without applying')
  .option('--no-push', 'Skip git push')
  .option('--no-release', 'Skip GitHub release creation')
  .action(async (options) => {
    try {
      const currentVersion = getCurrentVersion();
      const newVersion = bumpVersion(currentVersion, options.version);
      
      console.log(chalk.blue('🚀 Ship Release'));
      console.log(chalk.gray('Current version:'), currentVersion);
      console.log(chalk.gray('New version:'), newVersion);
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n📋 DRY RUN - No changes will be applied\n'));
      }
      
      // Preview changelog
      const changelog = generateChangelog(newVersion);
      console.log(chalk.blue('\n📝 Changelog Preview:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(changelog);
      console.log(chalk.gray('─'.repeat(50)));
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n✓ Dry run complete'));
        return;
      }
      
      // Execute release
      console.log(chalk.blue('\n▶️ Creating release...\n'));
      
      const result = ship({
        version: options.version,
        dryRun: options.dryRun,
        noPush: !options.push,
        noRelease: !options.release
      });
      
      console.log(chalk.green('✅ Release created!'));
      console.log(chalk.gray('Version:'), `${result.oldVersion} → ${result.newVersion}`);
      console.log(chalk.gray('Tag created:'), result.tagCreated ? '✓' : '✗');
      console.log(chalk.gray('Pushed:'), result.pushed ? '✓' : '✗');
      
      if (result.released && result.releaseUrl) {
        console.log(chalk.gray('GitHub release:'), result.releaseUrl);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();