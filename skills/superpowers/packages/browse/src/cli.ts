#!/usr/bin/env node
import { Command } from 'commander';
import { browse } from './index.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('browse')
  .description('Browser automation for visual testing and UI flows')
  .version('1.0.0')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <viewport>', 'Viewport preset (mobile, tablet, desktop, 1440p, 4k)', 'desktop')
  .option('-V, --viewports <viewports>', 'Multiple viewports (comma-separated)', (val) => val.split(','))
  .option('-f, --flows <flows>', 'Flow names to run (comma-separated)', (val) => val.split(','))
  .option('-s, --selector <selector>', 'CSS selector for element screenshot')
  .option('-F, --full-page', 'Capture full page', true)
  .option('-P, --no-full-page', 'Capture viewport only')
  .option('-w, --wait <ms>', 'Wait time after load (ms)', parseInt)
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .option('-c, --config <path>', 'Config file path')
  .option('-t, --telegram', 'Send Telegram notification', false)
  .action(async (url, options) => {
    try {
      console.log(chalk.bold('🌐 Browse - Browser Automation\n'));
      
      await browse({
        url,
        viewport: options.viewport,
        viewports: options.viewports,
        flows: options.flows,
        selector: options.selector,
        fullPage: options.fullPage,
        wait: options.wait,
        outputDir: options.output,
        configPath: options.config,
        telegram: options.telegram
      });
      
      console.log(chalk.green('\n✨ Done!'));
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
