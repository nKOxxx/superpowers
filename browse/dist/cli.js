#!/usr/bin/env node

import { program } from 'commander';
import { browseCommand } from './index.js';
// Note: This file gets copied to dist/ folder during build

program
  .name('browse')
  .description('Browser automation for visual testing and QA')
  .version('1.0.0');

program
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

program.parse();
