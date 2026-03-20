#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { BrowseController } from './browse-controller';
import { BrowseOptions, ViewportSize } from './types';

const program = new Command();

program
  .name('browse')
  .description('Browser automation with Playwright for OpenClaw')
  .version('1.0.0');

program
  .argument('<url>', 'URL to navigate to')
  .option('-s, --screenshot', 'Capture full-page screenshot', false)
  .option('-v, --viewport <size>', 'Viewport size (WxH)', '1280x720')
  .option('-a, --audit', 'Run accessibility audit', false)
  .option('-w, --wait-for <selector>', 'Wait for element before capturing')
  .option('-t, --timeout <ms>', 'Navigation timeout', '30000')
  .option('-c, --compare <path>', 'Compare against baseline image')
  .option('-m, --mobile', 'Emulate mobile device', false)
  .option('-d, --dark-mode', 'Enable dark mode', false)
  .option('-o, --output <path>', 'Output directory for screenshots')
  .option('--full-page', 'Capture full page screenshot', true)
  .option('--viewport-only', 'Capture viewport only')
  .option('--telegram', 'Send results to Telegram', false)
  .option('--silent', 'Silent mode (no console output)', false)
  .action(async (url: string, options: any) => {
    try {
      const browseOptions = parseOptions(url, options);
      const controller = new BrowseController(browseOptions);
      
      if (!options.silent) {
        console.log(chalk.blue('🔍 Browse:'), chalk.white(url));
      }
      
      const result = await controller.execute();
      
      if (!options.silent) {
        printResults(result);
      }
      
      // Exit with error code if there were issues
      if (result.errors.length > 0 || (result.comparison && !result.comparison.matches)) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function parseOptions(url: string, options: any): BrowseOptions {
  const [width, height] = options.viewport.split('x').map(Number);
  
  return {
    url,
    screenshot: options.screenshot,
    viewport: { width, height },
    audit: options.audit,
    waitFor: options.waitFor,
    timeout: parseInt(options.timeout, 10),
    compare: options.compare,
    mobile: options.mobile,
    darkMode: options.darkMode,
    output: options.output,
    fullPage: options.viewportOnly ? false : options.fullPage,
    telegram: options.telegram,
    silent: options.silent
  };
}

function printResults(result: any) {
  console.log('');
  
  if (result.screenshot) {
    console.log(chalk.green('✓ Screenshot:'), result.screenshot);
  }
  
  if (result.audit) {
    const { violations } = result.audit;
    const severity = violations.length === 0 
      ? chalk.green('✓ No issues')
      : violations.length < 5 
        ? chalk.yellow(`⚠ ${violations.length} issues`)
        : chalk.red(`✗ ${violations.length} issues`);
    console.log(chalk.blue('♿ Accessibility:'), severity);
    
    if (violations.length > 0) {
      violations.slice(0, 5).forEach((v: any) => {
        console.log(chalk.gray(`  - ${v.help} (${v.impact})`));
      });
    }
  }
  
  if (result.comparison) {
    const { matches, diffPercentage } = result.comparison;
    const icon = matches ? chalk.green('✓') : chalk.red('✗');
    console.log(icon, chalk.blue('Visual diff:'), matches 
      ? chalk.green('No changes detected')
      : chalk.red(`${diffPercentage.toFixed(2)}% difference`)
    );
  }
  
  if (result.metrics) {
    console.log(chalk.blue('📊 Metrics:'));
    console.log(chalk.gray(`  Load: ${result.metrics.loadTime}ms`));
    console.log(chalk.gray(`  DOM: ${result.metrics.domContentLoaded}ms`));
    console.log(chalk.gray(`  Render: ${result.metrics.paint}ms`));
  }
  
  if (result.errors.length > 0) {
    console.log('');
    console.log(chalk.red('Errors:'));
    result.errors.forEach((err: string) => console.log(chalk.gray(`  - ${err}`)));
  }
}

program.parse();
