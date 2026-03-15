#!/usr/bin/env node

import { program } from 'commander';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

program
  .name('superpowers')
  .description('AI-powered workflows for development, testing, and product decisions')
  .version(pkg.version);

// Browse command
program
  .command('browse')
  .description('Browser automation with Playwright')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <viewport>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-s, --selector <selector>', 'CSS selector to capture specific element')
  .option('-o, --output <path>', 'Output file path (default: base64 to stdout)')
  .option('-w, --wait <ms>', 'Wait time in ms after page load', '1000')
  .action(async (url, options) => {
    const { browse } = await import('./skills/browse/dist/index.js');
    await browse({ url, ...options });
  });

// QA command
program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('--framework <framework>', 'Test framework (auto, vitest, jest, mocha)')
  .action(async (options) => {
    const { qa } = await import('./skills/qa/dist/index.js');
    await qa(options);
  });

// Ship command
program
  .command('ship')
  .description('One-command release pipeline')
  .requiredOption('--version <type>', 'Version bump type (patch, minor, major) or explicit version')
  .option('-d, --dry-run', 'Preview changes without applying', false)
  .option('--no-tag', 'Skip git tag creation')
  .option('--no-release', 'Skip GitHub release creation')
  .option('--message <msg>', 'Custom release message')
  .action(async (options) => {
    const { ship } = await import('./skills/ship/dist/index.js');
    await ship(options);
  });

// CEO Review command
program
  .command('ceo-review')
  .description('BAT framework for product decisions')
  .requiredOption('-f, --feature <name>', 'Feature name and description')
  .option('--brand <score>', 'Brand score (0-5)', parseFloat)
  .option('--attention <score>', 'Attention score (0-5)', parseFloat)
  .option('--trust <score>', 'Trust score (0-5)', parseFloat)
  .option('--goal <goal>', 'Business goal context')
  .option('--interactive', 'Interactive scoring mode', false)
  .action(async (options) => {
    const { ceoReview } = await import('./skills/plan-ceo-review/dist/index.js');
    await ceoReview(options);
  });

// Flow command for browse (advanced flows)
program
  .command('flow')
  .description('Execute browser automation flows')
  .argument('<url>', 'Starting URL')
  .requiredOption('-a, --actions <json>', 'JSON array of actions (click, type, wait, scroll, hover)')
  .option('-v, --viewport <viewport>', 'Viewport preset', 'desktop')
  .option('-o, --output <path>', 'Output screenshot path')
  .action(async (url, options) => {
    const { flow } = await import('./skills/browse/dist/index.js');
    const actions = JSON.parse(options.actions);
    await flow({ url, actions, viewport: options.viewport, output: options.output });
  });

program.parse();
