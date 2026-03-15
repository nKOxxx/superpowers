#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ship, ShipOptions } from './index.js';

const program = new Command();

program
  .name('superpowers-ship')
  .description('One-command release pipeline with semantic versioning')
  .version('1.0.0');

program
  .argument('[version]', 'Version bump type (patch|minor|major) or explicit version', 'patch')
  .option('-d, --dry-run', 'Preview changes without applying', false)
  .option('--no-tag', 'Skip git tag creation')
  .option('--no-release', 'Skip GitHub release creation')
  .option('-m, --message <text>', 'Custom release message')
  .action(async (version: string, options: any) => {
    const shipOptions: ShipOptions = {
      version,
      dryRun: options.dryRun,
      tag: options.tag,
      release: options.release,
      message: options.message
    };
    
    try {
      const success = await ship(shipOptions);
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();
