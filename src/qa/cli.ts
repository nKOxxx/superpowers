#!/usr/bin/env node

import { Command } from 'commander';
import { runTests, type TestMode } from './index.js';
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
  .name('qa')
  .description('Systematic testing as QA Lead')
  .version(version)
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, or full', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('-p, --pattern <pattern>', 'Test file pattern')
  .action(async (options) => {
    try {
      const mode = options.mode as TestMode;
      
      if (!['targeted', 'smoke', 'full'].includes(mode)) {
        console.error(`Invalid mode: ${mode}. Use: targeted, smoke, or full`);
        process.exit(1);
      }
      
      await runTests({
        mode,
        coverage: options.coverage,
        watch: options.watch,
        testPathPattern: options.pattern
      });
      
      process.exit(0);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();