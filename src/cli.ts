#!/usr/bin/env node
import { Command } from 'commander';
import { program as browseProgram } from './browse/index.js';
import { program as qaProgram } from './qa/index.js';
import { program as shipProgram } from './ship/index.js';
import { program as ceoProgram } from './plan-ceo-review/index.js';

const program = new Command();

program
  .name('superpowers')
  .description('OpenClaw superpowers - Browser automation, QA testing, releases, and product strategy')
  .version('1.0.0');

// Add subcommands
program.addCommand(browseProgram);
program.addCommand(qaProgram);
program.addCommand(shipProgram);
program.addCommand(ceoProgram);

program.parse();
