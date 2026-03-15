#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');

const browse = require('./dist/browse');
const qa = require('./dist/qa');
const ship = require('./dist/ship');
const planCeoReview = require('./dist/plan-ceo-review');

program
  .name('superpowers')
  .description('OpenClaw superpowers - Browser, QA, Ship, and Product Strategy')
  .version('1.0.0');

// Browse command
program
  .command('browse <url>')
  .description('Browser automation with Playwright')
  .option('-v, --viewport <name>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-W, --width <pixels>', 'Custom viewport width', parseInt)
  .option('-H, --height <pixels>', 'Custom viewport height', parseInt)
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .option('-w, --wait-for <selector>', 'Wait for element before screenshot')
  .option('-a, --actions <actions>', 'Comma-separated actions (click:sel,wait:ms,type:sel|text)')
  .option('-t, --timeout <ms>', 'Navigation timeout', parseInt, 30000)
  .action(async (url, options) => {
    try {
      await browse.run(url, options);
    } catch (err) {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    }
  });

// QA command
program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-d, --diff <range>', 'Git diff range', 'HEAD~1')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-p, --parallel', 'Run tests in parallel', false)
  .action(async (options) => {
    try {
      await qa.run(options);
    } catch (err) {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    }
  });

// Ship command
program
  .command('ship')
  .description('One-command release pipeline')
  .requiredOption('-v, --version <type>', 'Version bump: patch, minor, major, or explicit')
  .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
  .option('-n, --dry-run', 'Preview changes without executing', false)
  .option('--skip-tests', 'Skip test run before release', false)
  .option('--notes <text>', 'Custom release notes')
  .option('--prerelease', 'Mark as prerelease', false)
  .action(async (options) => {
    try {
      await ship.run(options);
    } catch (err) {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    }
  });

// Plan CEO Review command
program
  .command('ceo-review')
  .description('Product strategy review using BAT framework')
  .requiredOption('-f, --feature <name>', 'Feature name to evaluate')
  .option('-g, --goal <text>', 'Business goal')
  .option('-a, --audience <text>', 'Target audience')
  .option('--brand <score>', 'Brand score (0-5)', parseFloat)
  .option('--attention <score>', 'Attention score (0-5)', parseFloat)
  .option('--trust <score>', 'Trust score (0-5)', parseFloat)
  .action(async (options) => {
    try {
      await planCeoReview.run(options);
    } catch (err) {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    }
  });

program.parse();
