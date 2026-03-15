#!/usr/bin/env node

import { program, Command } from 'commander';
import { browseCommand } from './browse/dist/index.js';
import { qaCommand } from './qa/dist/index.js';
import { shipCommand } from './ship/dist/index.js';
import { reviewCommand } from './plan-ceo-review/dist/index.js';

program
  .name('superpowers')
  .description('OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions')
  .version('1.0.0');

// Browse command
const browseCmd = new Command('browse')
  .description('Browser automation for visual testing and QA')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-W, --width <number>', 'Custom viewport width')
  .option('-H, --height <number>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-s, --selector <selector>', 'CSS selector to capture specific element')
  .option('-o, --output <path>', 'Output file path (default: base64 to stdout)')
  .option('-w, --wait <ms>', 'Wait time in ms after load', '1000')
  .option('--actions <json>', 'JSON array of actions to perform before screenshot')
  .action(browseCommand);

// QA command
const qaCmd = new Command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('-u, --update', 'Update snapshots', false)
  .option('--since <ref>', 'Git ref to compare against for targeted mode', 'HEAD~1')
  .action(qaCommand);

// Ship command
const shipCmd = new Command('ship')
  .description('One-command release pipeline')
  .option('-b, --bump <type>', 'Version bump type (patch, minor, major) or explicit version', 'patch')
  .option('-d, --dry-run', 'Preview changes without applying', false)
  .option('--skip-tag', 'Skip git tag creation', false)
  .option('--skip-push', 'Skip git push', false)
  .option('--skip-release', 'Skip GitHub release', false)
  .option('--no-changelog', 'Skip changelog generation', false)
  .action((options) => shipCommand({ ...options, version: options.bump }));

// CEO Review command
const reviewCmd = new Command('plan-ceo-review')
  .description('Product strategy review using BAT framework')
  .argument('<description>', 'Feature/product description (e.g., "Feature Name: Description")')
  .option('-b, --brand <score>', 'Brand score (0-5)', parseFloat)
  .option('-a, --attention <score>', 'Attention score (0-5)', parseFloat)
  .option('-t, --trust <score>', 'Trust score (0-5)', parseFloat)
  .option('--auto', 'Auto-calculate scores based on description', false)
  .option('--json', 'Output as JSON', false)
  .action(reviewCommand);

// Add subcommands
program.addCommand(browseCmd);
program.addCommand(qaCmd);
program.addCommand(shipCmd);
program.addCommand(reviewCmd);

program.parse();
