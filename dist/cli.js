#!/usr/bin/env node
"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const browse_js_1 = require("./skills/browse.js");
const qa_js_1 = require("./skills/qa.js");
const ship_js_1 = require("./skills/ship.js");
const plan_ceo_review_js_1 = require("./skills/plan-ceo-review.js");
const format = __importStar(require("./lib/format.js"));
const program = new commander_1.Command();
program
    .name('superpowers')
    .description('OpenClaw superpowers - opinionated workflow skills for AI agents')
    .version('1.0.0');
// Browse command
program
    .command('browse')
    .description('Browser automation for visual testing and QA')
    .argument('<url>', 'URL to browse')
    .option('-v, --viewport <name>', 'Viewport preset (mobile, tablet, desktop)')
    .option('-W, --width <pixels>', 'Custom viewport width', parseInt)
    .option('-H, --height <pixels>', 'Custom viewport height', parseInt)
    .option('-f, --full-page', 'Capture full page screenshot')
    .option('-w, --wait <selector>', 'Wait for element before screenshot')
    .option('-a, --actions <actions>', 'Comma-separated actions (click:sel,type:sel|text,wait:ms)')
    .option('-o, --output <path>', 'Output path for screenshot')
    .option('-t, --timeout <ms>', 'Page load timeout', parseInt)
    .action(async (url, options) => {
    try {
        const browseOptions = {
            url,
            viewport: options.viewport,
            width: options.width,
            height: options.height,
            fullPage: options.fullPage,
            wait: options.wait,
            actions: options.actions,
            output: options.output,
            timeout: options.timeout
        };
        await (0, browse_js_1.browse)(browseOptions);
        process.exit(0);
    }
    catch (error) {
        format.error(`Browse failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
// QA command
program
    .command('qa')
    .description('Systematic testing as QA Lead')
    .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
    .option('-d, --diff <ref>', 'Git diff reference for targeted mode', 'HEAD~1')
    .option('--notify-telegram', 'Send Telegram notification with results')
    .action(async (options) => {
    try {
        const qaOptions = {
            mode: options.mode,
            diff: options.diff,
            notifyTelegram: options.notifyTelegram
        };
        const result = await (0, qa_js_1.qa)(qaOptions);
        process.exit(result.failed > 0 ? 1 : 0);
    }
    catch (error) {
        format.error(`QA failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
// Ship command
program
    .command('ship')
    .description('One-command release pipeline')
    .requiredOption('-r, --repo <repo>', 'Repository (owner/repo)')
    .requiredOption('-v, --version <version>', 'Version (patch, minor, major, or explicit)')
    .option('--dry-run', 'Preview changes without executing')
    .option('--skip-tests', 'Skip running tests before release')
    .option('--force', 'Override dirty working directory check')
    .option('-n, --notes <notes>', 'Custom release notes')
    .action(async (options) => {
    try {
        const shipOptions = {
            repo: options.repo,
            version: options.version,
            dryRun: options.dryRun,
            skipTests: options.skipTests,
            force: options.force,
            notes: options.notes
        };
        await (0, ship_js_1.ship)(shipOptions);
        process.exit(0);
    }
    catch (error) {
        format.error(`Ship failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
// CEO Review command
program
    .command('ceo-review')
    .description('Product strategy review using BAT framework')
    .argument('<question>', 'Feature question to evaluate')
    .option('-g, --goal <goal>', 'Business goal for this feature')
    .option('-m, --market <market>', 'Target market/segment')
    .option('--brand-score <score>', 'Brand score (0-5)', parseFloat)
    .option('--attention-score <score>', 'Attention score (0-5)', parseFloat)
    .option('--trust-score <score>', 'Trust score (0-5)', parseFloat)
    .action(async (question, options) => {
    try {
        const reviewOptions = {
            feature: question,
            goal: options.goal,
            market: options.market,
            brandScore: options.brandScore,
            attentionScore: options.attentionScore,
            trustScore: options.trustScore
        };
        await (0, plan_ceo_review_js_1.planCEOReview)(reviewOptions);
        process.exit(0);
    }
    catch (error) {
        format.error(`CEO Review failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map