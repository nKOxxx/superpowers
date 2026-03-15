"use strict";
/**
 * Superpowers - OpenClaw AI-driven development workflows
 * Main entry point
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCEOReview = exports.CEOReviewSkill = exports.runShip = exports.ShipSkill = exports.runQA = exports.QASkill = exports.runBrowse = exports.BrowseSkill = void 0;
var index_js_1 = require("./browse/index.js");
Object.defineProperty(exports, "BrowseSkill", { enumerable: true, get: function () { return index_js_1.BrowseSkill; } });
Object.defineProperty(exports, "runBrowse", { enumerable: true, get: function () { return index_js_1.run; } });
var index_js_2 = require("./qa/index.js");
Object.defineProperty(exports, "QASkill", { enumerable: true, get: function () { return index_js_2.QASkill; } });
Object.defineProperty(exports, "runQA", { enumerable: true, get: function () { return index_js_2.run; } });
var index_js_3 = require("./ship/index.js");
Object.defineProperty(exports, "ShipSkill", { enumerable: true, get: function () { return index_js_3.ShipSkill; } });
Object.defineProperty(exports, "runShip", { enumerable: true, get: function () { return index_js_3.run; } });
var index_js_4 = require("./plan-ceo-review/index.js");
Object.defineProperty(exports, "CEOReviewSkill", { enumerable: true, get: function () { return index_js_4.CEOReviewSkill; } });
Object.defineProperty(exports, "runCEOReview", { enumerable: true, get: function () { return index_js_4.run; } });
__exportStar(require("./types.js"), exports);
__exportStar(require("./utils.js"), exports);
// CLI dispatcher
const index_js_5 = require("./browse/index.js");
const index_js_6 = require("./qa/index.js");
const index_js_7 = require("./ship/index.js");
const index_js_8 = require("./plan-ceo-review/index.js");
const COMMANDS = {
    browse: index_js_5.run,
    qa: (args) => (0, index_js_6.run)(args, process.cwd()),
    ship: (args) => (0, index_js_7.run)(args, process.cwd()),
    'plan-ceo-review': index_js_8.run,
    'ceo-review': index_js_8.run
};
async function main() {
    const [, , command, ...args] = process.argv;
    if (!command || command === '--help' || command === '-h') {
        console.log(`
Superpowers - OpenClaw AI-driven development workflows

Usage: npx @nko/superpowers <command> [options]

Commands:
  browse <url>           Browser automation with Playwright
    --viewport=mobile|tablet|desktop
    --full-page
    --wait-for=<selector|ms>

  qa [--mode=targeted]   Systematic testing
    --mode=targeted|smoke|full
    --coverage
    --pattern=<glob>

  ship [--version=patch] Release pipeline
    --version=patch|minor|major|<semver>
    --dry-run
    --skip-tests
    --skip-changelog

  plan-ceo-review "desc" Product strategy (BAT framework)
    --brand=0-5
    --attention=0-5
    --trust=0-5

Options:
  -h, --help             Show this help message
  -v, --version          Show version
`);
        process.exit(0);
    }
    if (command === '--version' || command === '-v') {
        console.log('1.0.0');
        process.exit(0);
    }
    const handler = COMMANDS[command];
    if (!handler) {
        console.error(`Unknown command: ${command}`);
        console.error('Run with --help for usage information');
        process.exit(1);
    }
    try {
        const result = await handler(args);
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
// Run if called directly
main();
//# sourceMappingURL=index.js.map