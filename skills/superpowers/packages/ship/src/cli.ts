#!/usr/bin/env node
import { Command } from 'commander';
import { ship } from './index.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('ship')
  .description('One-command release pipeline')
  .version('1.0.0')
  .requiredOption('-v, --version <bump>', 'Version bump (patch/minor/major/x.y.z)')
  .option('-r, --repo <repo>', 'Repository (owner/repo)', )
  .option('-d, --dry-run', 'Preview without making changes', false)
  .option('--skip-tests', 'Skip test execution', false)
  .option('-n, --notes <notes>', 'Custom release notes')
  .option('-f, --force', 'Force even with dirty working directory', false)
  .option('-c, --config <path>', 'Config file path')
  .option('--telegram', 'Send Telegram notification', false)
  .action(async (options) => {
    try {
      await ship({
        version: options.version,
        repo: options.repo,
        dryRun: options.dryRun,
        skipTests: options.skipTests,
        notes: options.notes,
        force: options.force,
        configPath: options.config,
        telegram: options.telegram
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
