#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { browse, parseViewport, parseActions, screenshotToBase64 } from './index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package version
let version = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
  version = pkg.version;
} catch { /* ignore */ }

const program = new Command();

program
  .name('browse')
  .description('Browser automation with Playwright')
  .version(version)
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <viewport>', 'Viewport preset (mobile, tablet, desktop) or custom WxH', 'desktop')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-s, --selector <selector>', 'CSS selector to screenshot specific element')
  .option('-a, --actions <actions>', 'Comma-separated actions (click:#btn,type:#input:value,wait:1000)')
  .option('-o, --output <output>', 'Output path for screenshot file')
  .option('--base64', 'Output base64 string to stdout', false)
  .action(async (url: string, options) => {
    try {
      const viewport = parseViewport(options.viewport);
      const actions = parseActions(options.actions || '');
      
      const result = await browse({
        url,
        viewport,
        fullPage: options.fullPage,
        selector: options.selector,
        actions,
        output: options.output ? 'file' : options.base64 ? 'base64' : 'buffer',
        outputPath: options.output
      });
      
      if (options.base64) {
        console.log(screenshotToBase64(result.screenshot));
      } else if (!options.output) {
        // Default: save with timestamp
        const fs = await import('fs');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot-${timestamp}.png`;
        fs.writeFileSync(filename, result.screenshot);
        console.log(chalk.green(`📸 Screenshot saved: ${filename}`));
      }
      
      process.exit(0);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();