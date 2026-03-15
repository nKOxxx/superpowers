#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const picocolors_1 = __importDefault(require("picocolors"));
const browse_js_1 = require("./commands/browse.js");
const qa_js_1 = require("./commands/qa.js");
const ship_js_1 = require("./commands/ship.js");
const ceo_review_js_1 = require("./commands/ceo-review.js");
const program = new commander_1.Command();
program
    .name('superpowers')
    .description('AI-powered workflows for OpenClaw - Browser automation, QA testing, release pipeline, and product strategy')
    .version('1.0.0');
// Register all commands
(0, browse_js_1.browseCommand)(program);
(0, qa_js_1.qaCommand)(program);
(0, ship_js_1.shipCommand)(program);
(0, ceo_review_js_1.ceoReviewCommand)(program);
// Handle unknown commands
program.on('command:*', (operands) => {
    console.error(picocolors_1.default.red(`Unknown command: ${operands[0]}`));
    console.log(picocolors_1.default.yellow('Run "superpowers --help" for available commands'));
    process.exit(1);
});
// Parse command line arguments
program.parse();
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=cli.js.map