#!/usr/bin/env node
import { Command } from 'commander';
import { browseCommand } from './index.js';

const program = new Command();

program
  .name('superpowers-browse')
  .description('Browser automation with Playwright')
  .argument('<url>', 'URL to browse')
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-e, --element <selector>', 'Capture specific element')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile|tablet|desktop)', 'desktop')
  .option('-w, --width <pixels>', 'Custom viewport width')
  .option('--height <pixels>', 'Custom viewport height')
  .option('-o, --output <path>', 'Output file path')
  .option('--base64', 'Output as base64 for Telegram')
  .option('--actions <json>', 'Action sequence JSON')
  .action(browseCommand);

program.parse();
