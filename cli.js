#!/usr/bin/env node

import { program } from 'commander';
import { browseCommand } from './browse/dist/index.js';
import { qaCommand } from './qa/dist/index.js';
import { shipCommand } from './ship/dist/index.js';
import { reviewCommand } from './plan-ceo-review/dist/index.js';

// Create subcommands for each skill
const browseCmd = program
  .command('browse <url>')
  .description('Browser automation for visual testing and QA')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-W, --width <number>', 'Custom viewport width')
  .option('-H, --height <number>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-s, --selector <selector>', 'CSS selector to capture specific element')
  .option('-o, --output <path>', 'Output file path (default: base64 to stdout)')
  .option('-w, --wait <ms>', 'Wait time in ms after load', '1000')
  .option('--actions <json>', 'JSON array of actions to perform before screenshot')
  .action(browseCommand);

const qaCmd = program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('-u, --update', 'Update snapshots', false)
  .option('--since <ref>', 'Git ref to compare against', 'HEAD~1')
  .action(() => {
    const opts = qaCmd.opts();
    qaCommand({
      mode: opts.mode,
      coverage: opts.coverage,
      watch: opts.watch,
      update: opts.update,
      since: opts.since
    });
  });

const shipCmd = program
  .command('ship')
  .description('One-command release pipeline')
  .requiredOption('-v, --version <type>', 'Version bump (patch, minor, major) or explicit version')
  .option('-d, --dry-run', 'Preview changes without applying', false)
  .option('--skip-tag', 'Skip git tag creation', false)
  .option('--skip-push', 'Skip git push', false)
  .option('--skip-release', 'Skip GitHub release', false)
  .option('--no-changelog', 'Skip changelog generation', false)
  .action(() => {
    const opts = shipCmd.opts();
    shipCommand({
      version: opts.version,
      dryRun: opts.dryRun,
      skipTag: opts.skipTag,
      skipPush: opts.skipPush,
      skipRelease: opts.skipRelease,
      changelog: opts.changelog
    });
  });

const ceoReviewCmd = program
  .command('plan-ceo-review <feature>')
  .description('Product strategy review using BAT framework')
  .option('-b, --brand <score>', 'Brand score (0-5)', parseFloat)
  .option('-a, --attention <score>', 'Attention score (0-5)', parseFloat)
  .option('-t, --trust <score>', 'Trust score (0-5)', parseFloat)
  .option('--auto', 'Auto-calculate scores from description', true)
  .option('--json', 'Output as JSON', false)
  .action((feature) => {
    const opts = ceoReviewCmd.opts();
    reviewCommand(feature, {
      brand: opts.brand,
      attention: opts.attention,
      trust: opts.trust,
      auto: opts.auto,
      json: opts.json
    });
  });

program
  .name('superpowers')
  .description('OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions')
  .version('1.0.0');

program.parse();
