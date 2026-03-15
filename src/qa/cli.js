#!/usr/bin/env node
import { Command } from 'commander';
import { qaCommand } from './index.js';

const program = new Command();

program
  .name('superpowers-qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted|smoke|full)', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-w, --watch', 'Watch mode')
  .action(qaCommand);

program.parse();
