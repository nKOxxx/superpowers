#!/usr/bin/env node

import { Command } from 'commander';
import { browseCommand } from './dist/commands/browse.js';
import { qaCommand } from './dist/commands/qa.js';
import { shipCommand } from './dist/commands/ship.js';
import { ceoReviewCommand } from './dist/commands/ceo-review.js';

const program = new Command();

program
  .name('superpowers')
  .description('AI-powered workflows for development, testing, and product decisions')
  .version('1.0.0');

program.addCommand(browseCommand);
program.addCommand(qaCommand);
program.addCommand(shipCommand);
program.addCommand(ceoReviewCommand);

program.parse();
