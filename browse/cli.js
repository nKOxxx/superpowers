#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { browse } from './dist/index.js';

const program = new Command();

program
  .name('browse')
  .description('Browser automation with Playwright')
  .argument('<url>', 'URL to browse')
  .option('--viewport <preset>', 'Viewport preset: mobile, tablet, desktop')
  .option('--width <number>', 'Custom viewport width', parseInt)
  .option('--height <number>', 'Custom viewport height', parseInt)
  .option('--full-page', 'Capture full scrollable page')
  .option('--selector <css>', 'Screenshot specific element')
  .option('--actions <actions>', 'Action sequence (click:sel,type:sel:text,wait:ms)')
  .option('--output <path>', 'Output file path')
  .action(async (url, options) => {
    try {
      console.log(chalk.blue('🌐 Browsing:'), url);
      
      const result = await browse({
        url,
        viewport: options.viewport,
        width: options.width,
        height: options.height,
        fullPage: options.fullPage,
        selector: options.selector,
        actions: options.actions,
        output: options.output
      });
      
      console.log(chalk.green('✅ Screenshot saved:'), result.screenshotPath);
      console.log(chalk.gray('Viewport:'), `${result.viewport.width}x${result.viewport.height}`);
      
      if (result.actionsPerformed.length > 0) {
        console.log(chalk.gray('Actions performed:'), result.actionsPerformed.join(', '));
      }
      
      // Output base64 for Telegram integration
      console.log('\n---BASE64---');
      console.log(result.base64Image);
      console.log('---END---');
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();