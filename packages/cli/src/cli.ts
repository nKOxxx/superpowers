#!/usr/bin/env node
import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('superpowers')
  .description('OpenClaw Superpowers - Opinionated workflow skills for AI agents')
  .version('1.0.0');

// Get the packages directory (parent of cli directory - go up from dist to packages)
const packagesDir = join(__dirname, '..', '..');

program
  .command('browse', 'Browser automation for visual testing', {
    executableFile: join(packagesDir, 'browse', 'dist', 'cli.js')
  })
  .command('qa', 'Systematic testing as QA Lead', {
    executableFile: join(packagesDir, 'qa', 'dist', 'cli.js')
  })
  .command('ship', 'One-command release pipeline', {
    executableFile: join(packagesDir, 'ship', 'dist', 'cli.js')
  })
  .command('plan-ceo-review', 'Product strategy with BAT framework', {
    executableFile: join(packagesDir, 'plan-ceo-review', 'dist', 'cli.js')
  });

program.parse();
