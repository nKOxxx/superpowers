#!/usr/bin/env node

import { program } from 'commander';
import { qaCommand } from './dist/index.js';

program
  .name('qa')
  .description('Systematic testing as QA Lead')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('-u, --update', 'Update snapshots', false)
  .option('--since <ref>', 'Git ref to compare against for targeted mode', 'HEAD~1')
  .action(qaCommand);

program.parse();
