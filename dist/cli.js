#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const browse_js_1 = require("./commands/browse.js");
const qa_js_1 = require("./commands/qa.js");
const ship_js_1 = require("./commands/ship.js");
const ceo_review_js_1 = require("./commands/ceo-review.js");
// Read package.json for version - use process.cwd() for ESM compatibility
const packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(process.cwd(), 'package.json'), 'utf-8'));
const program = new commander_1.Command()
    .name('superpowers')
    .description('OpenClaw superpowers - Browser automation, QA testing, release pipeline, and product strategy')
    .version(packageJson.version);
// Add commands
program.addCommand(browse_js_1.browseCommand);
program.addCommand(qa_js_1.qaCommand);
program.addCommand(ship_js_1.shipCommand);
program.addCommand(ceo_review_js_1.ceoReviewCommand);
// Parse arguments
program.parse();
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=cli.js.map