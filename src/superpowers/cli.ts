#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program
  .name('superpowers')
  .description('4 TypeScript skills for AI-powered development workflows')
  .version(pkg.version);

program
  .command('browse <url>', 'Browser automation with Playwright')
  .command('qa', 'Systematic testing as QA Lead')
  .command('ship', 'One-command release pipeline')
  .command('plan-ceo-review <feature>', 'BAT framework for product strategy');

program.parse();