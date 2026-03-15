#!/usr/bin/env node
import { browse } from './dist/index.js';
import { program } from 'commander';
import chalk from 'chalk';

program
  .name('browse')
  .description('Browser automation with Playwright')
  .version('1.0.0')
  .argument('<url>', 'URL to browse')
  .option('-b, --browser <type>', 'Browser: chromium, firefox, webkit', 'chromium')
  .option('-v, --viewport <preset>', 'Viewport preset: mobile, tablet, desktop, mobile-xl', 'desktop')
  .option('-W, --width <px>', 'Viewport width', parseInt)
  .option('-H, --height <px>', 'Viewport height', parseInt)
  .option('-f, --full-page', 'Capture full page', false)
  .option('-s, --selector <sel>', 'Capture specific element')
  .option('-o, --output <path>', 'Save to file')
  .option('--base64', 'Output base64 to stdout', false)
  .option('-a, --actions <actions>', 'Actions: click:selector,type:sel=text,wait:ms,scroll:x,y,hover:sel,press:key')
  .option('-t, --timeout <sec>', 'Navigation timeout', parseInt, 30)
  .option('-w, --wait-for <selector>', 'Wait for selector before capture')
  .action(async (url, opts) => {
    const result = await browse({ url, ...opts });
    if (!result.success) process.exit(1);
    if (opts.base64 && result.base64) console.log(result.base64);
  });

program.parse();