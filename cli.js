#!/usr/bin/env node

import { program } from 'commander';
import { browseCommand } from './dist/browse/index.js';
import { qaCommand } from './dist/qa/index.js';
import { shipCommand } from './dist/ship/index.js';
import { ceoReviewCommand } from './dist/plan-ceo-review/index.js';

program
  .name('superpowers')
  .description('OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions')
  .version('1.0.0');

program.addCommand(browseCommand);
program.addCommand(qaCommand);
program.addCommand(shipCommand);
program.addCommand(ceoReviewCommand);

program.parse();
