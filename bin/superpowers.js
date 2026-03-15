#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { browseCommand } from '../dist/browse/index.js';
import { qaCommand } from '../dist/qa/index.js';
import { shipCommand } from '../dist/ship/index.js';
import { ceoReviewCommand } from '../dist/plan-ceo-review/index.js';

const program = new Command();

program
  .name('superpowers')
  .description('AI-powered workflows for OpenClaw')
  .version('1.0.0');

// Browse command
program
  .command('browse')
  .description('Browser automation and visual testing with Playwright')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <name>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-w, --width <pixels>', 'Custom viewport width')
  .option('-h, --height <pixels>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-o, --output <dir>', 'Output directory for screenshots', './screenshots')
  .option('--flows <names>', 'Comma-separated flow names')
  .option('--wait-for <selector>', 'Wait for element before screenshot')
  .option('--actions <actions>', 'Comma-separated actions (click:sel,wait:ms,type:sel|text)')
  .option('-t, --timeout <ms>', 'Navigation timeout', '30000')
  .action(async (url, options) => {
    try {
      await browseCommand(url, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// QA command
program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-d, --diff <range>', 'Git diff range for targeted mode', 'HEAD~1')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-p, --parallel', 'Run tests in parallel', false)
  .action(async (options) => {
    try {
      await qaCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Ship command
program
  .command('ship')
  .description('One-command release pipeline')
  .requiredOption('--version <type>', 'Version bump (patch, minor, major, or x.y.z)')
  .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
  .option('--dry-run', 'Preview changes without executing', false)
  .option('--skip-tests', 'Skip test run before release', false)
  .option('-n, --notes <text>', 'Custom release notes')
  .option('--prerelease', 'Mark as prerelease', false)
  .action(async (options) => {
    try {
      await shipCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// CEO Review command
program
  .command('ceo-review')
  .description('Product strategy review using BAT framework')
  .requiredOption('--feature <name>', 'Feature name to evaluate')
  .option('--goal <text>', 'Business goal')
  .option('--audience <text>', 'Target audience')
  .option('--competition <text>', 'Competitors')
  .option('--trust <text>', 'Trust assets you have')
  .action(async (options) => {
    try {
      await ceoReviewCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
