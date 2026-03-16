#!/usr/bin/env node
import { Command } from 'commander';
import { qa } from './index.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('qa')
  .description('Systematic testing as QA Lead - smart test selection')
  .version('1.0.0')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-d, --diff <ref>', 'Git ref to compare changes', 'HEAD~1')
  .option('-c, --coverage', 'Run with coverage report', false)
  .option('-t, --threshold <n>', 'Coverage threshold %', parseInt)
  .option('-w, --watch', 'Watch mode', false)
  .option('-C, --config <path>', 'Config file path')
  .option('--telegram', 'Send Telegram notification', false)
  .action(async (options) => {
    try {
      await qa({
        mode: options.mode,
        diff: options.diff,
        coverage: options.coverage,
        threshold: options.threshold,
        watch: options.watch,
        configPath: options.config,
        telegram: options.telegram
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
