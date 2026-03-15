#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';

program
  .name('superpowers')
  .description('OpenClaw superpowers - AI-powered development workflows')
  .version('1.0.0');

program
  .command('browse <url>')
  .description('Browser automation with Playwright')
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-e, --element <selector>', 'Capture specific element')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile|tablet|desktop)', 'desktop')
  .option('-w, --width <pixels>', 'Custom viewport width')
  .option('-h, --height <pixels>', 'Custom viewport height')
  .option('-o, --output <path>', 'Output file path')
  .option('--base64', 'Output as base64 for Telegram')
  .option('--actions <json>', 'Action sequence JSON')
  .action(async (url, options) => {
    const { browseCommand } = await import('./dist/browse/index.js');
    await browseCommand(url, options);
  });

program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted|smoke|full)', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-w, --watch', 'Watch mode')
  .action(async (options) => {
    const { qaCommand } = await import('./dist/qa/index.js');
    await qaCommand(options);
  });

program
  .command('ship')
  .description('One-command release pipeline')
  .option('-v, --version <type>', 'Version bump (patch|minor|major|<semver>)', 'patch')
  .option('-d, --dry-run', 'Preview changes without applying')
  .option('--skip-push', 'Skip git push')
  .option('--skip-release', 'Skip GitHub release')
  .action(async (options) => {
    const { shipCommand } = await import('./dist/ship/index.js');
    await shipCommand(options);
  });

program
  .command('plan-ceo-review <feature>')
  .description('Product strategy review with BAT framework')
  .option('-b, --brand <score>', 'Brand score (0-5)', '3')
  .option('-a, --attention <score>', 'Attention score (0-5)', '3')
  .option('-t, --trust <score>', 'Trust score (0-5)', '3')
  .option('--auto', 'Auto-calculate scores from feature description')
  .action(async (feature, options) => {
    const { planCeoReviewCommand } = await import('./dist/plan-ceo-review/index.js');
    await planCeoReviewCommand(feature, options);
  });

program.parse();
