#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';

import { browseCommand } from './commands/browse.js';
import { qaCommand } from './commands/qa.js';
import { shipCommand } from './commands/ship.js';
import { ceoReviewCommand } from './commands/ceo-review.js';

// Read package.json for version - use process.cwd() for ESM compatibility
const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
);

const program = new Command()
  .name('superpowers')
  .description('OpenClaw superpowers - Browser automation, QA testing, release pipeline, and product strategy')
  .version(packageJson.version);

// Add commands
program.addCommand(browseCommand);
program.addCommand(qaCommand);
program.addCommand(shipCommand);
program.addCommand(ceoReviewCommand);

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
