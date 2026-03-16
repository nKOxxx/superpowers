#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('superpowers')
  .description('OpenClaw Superpowers - Opinionated workflow skills for AI agents')
  .version('1.0.0');

program
  .command('browse', 'Browser automation for visual testing', {
    executableFile: './browse/dist/cli.js'
  })
  .command('qa', 'Systematic testing as QA Lead', {
    executableFile: './qa/dist/cli.js'
  })
  .command('ship', 'One-command release pipeline', {
    executableFile: './ship/dist/cli.js'
  })
  .command('plan-ceo-review', 'Product strategy with BAT framework', {
    executableFile: './plan-ceo-review/dist/cli.js'
  });

program.parse();
