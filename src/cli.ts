#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { browseCommand } from './browse/index.js';
import { qaCommand } from './qa/index.js';
import { shipCommand } from './ship/index.js';
import { ceoReviewCommand } from './ceo-review/index.js';

const program = new Command();

program
  .name('superpowers')
  .description('OpenClaw Superpowers - AI-powered development workflows')
  .version('1.0.0');

program
  .command('browse')
  .description('Browser automation and visual testing')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-W, --width <pixels>', 'Custom viewport width')
  .option('-H, --height <pixels>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .option('-w, --wait-for <selector>', 'Wait for element before screenshot')
  .option('-a, --actions <actions>', 'Comma-separated actions (click:sel,wait:ms,type:sel|text)')
  .option('-t, --timeout <ms>', 'Navigation timeout', '30000')
  .action(browseCommand);

program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-d, --diff <range>', 'Git diff range', 'HEAD~1')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-p, --parallel', 'Run tests in parallel', false)
  .action(qaCommand);

program
  .command('ship')
  .description('One-command release pipeline')
  .requiredOption('-v, --version <type>', 'Version bump: patch, minor, major, or x.y.z')
  .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
  .option('-d, --dry-run', 'Preview changes without executing', false)
  .option('--skip-tests', 'Skip test run before release', false)
  .option('-n, --notes <text>', 'Custom release notes')
  .option('--prerelease', 'Mark as prerelease', false)
  .action(shipCommand);

program
  .command('ceo-review')
  .description('Product strategy review with BAT framework')
  .requiredOption('-f, --feature <name>', 'Feature name')
  .option('-g, --goal <text>', 'Business goal')
  .option('-a, --audience <text>', 'Target audience')
  .option('-c, --competition <text>', 'Competitors')
  .option('-t, --trust <text>', 'Trust assets')
  .option('--brand <score>', 'Brand score (0-5)')
  .option('--attention <score>', 'Attention score (0-5)')
  .option('--trust-score <score>', 'Trust score (0-5)')
  .action(ceoReviewCommand);

program.on('command:*', () => {
  console.error(chalk.red(`Unknown command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('Run `superpowers --help` for available commands'));
  process.exit(1);
});

if (process.argv.length === 2) {
  program.help();
}

program.parse();