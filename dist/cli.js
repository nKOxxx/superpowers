#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { browseCommand } from './commands/browse.js';
import { qaCommand } from './commands/qa.js';
import { shipCommand } from './commands/ship.js';
import { ceoReviewCommand } from './commands/ceo-review.js';
const program = new Command();
program
    .name('superpowers')
    .description('AI-powered workflows for OpenClaw - Browser automation, QA testing, release pipeline, and product strategy')
    .version('1.0.0');
// Register all commands
browseCommand(program);
qaCommand(program);
shipCommand(program);
ceoReviewCommand(program);
// Handle unknown commands
program.on('command:*', (operands) => {
    console.error(pc.red(`Unknown command: ${operands[0]}`));
    console.log(pc.yellow('Run "superpowers --help" for available commands'));
    process.exit(1);
});
// Parse command line arguments
program.parse();
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
