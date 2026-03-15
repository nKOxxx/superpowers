#!/usr/bin/env node
import { program } from 'commander';
import { browseCommand } from './dist/commands/browse.js';
import { qaCommand } from './dist/commands/qa.js';
import { shipCommand } from './dist/commands/ship.js';
import { ceoReviewCommand } from './dist/commands/ceo-review.js';

program
  .name('superpowers')
  .description('OpenClaw superpowers - AI-powered development workflows')
  .version('1.0.0');

program
  .command('browse')
  .description('Browser automation for visual testing')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <name>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-W, --width <pixels>', 'Custom viewport width')
  .option('-H, --height <pixels>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .option('-w, --wait-for <selector>', 'Wait for element before screenshot')
  .option('-a, --actions <actions>', 'Comma-separated actions')
  .option('-t, --timeout <ms>', 'Navigation timeout', '30000')
  .option('--base64', 'Output base64 encoded image for Telegram', false)
  .action(browseCommand);

program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-d, --diff <range>', 'Git diff range', 'HEAD~1')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-p, --parallel', 'Run tests in parallel', false)
  .action(qaCommand);

program
  .command('ship')
  .description('One-command release pipeline')
  .requiredOption('-v, --version <type>', 'Version type (patch, minor, major, or explicit)')
  .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
  .option('-d, --dry-run', 'Preview changes without executing', false)
  .option('--skip-tests', 'Skip test run before release', false)
  .option('-n, --notes <text>', 'Custom release notes')
  .option('--prerelease', 'Mark as prerelease', false)
  .action(shipCommand);

program
  .command('ceo-review')
  .description('Product strategy review using BAT framework')
  .requiredOption('-f, --feature <name>', 'Feature name')
  .option('-g, --goal <text>', 'Business goal')
  .option('-a, --audience <text>', 'Target audience')
  .option('-c, --competition <text>', 'Competitors')
  .option('-t, --trust <text>', 'Trust assets')
  .option('--brand <score>', 'Brand score (0-5)')
  .option('--attention <score>', 'Attention score (0-5)')
  .option('--trust-score <score>', 'Trust score (0-5)')
  .action(ceoReviewCommand);

program.parse();
