"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.browseCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const browser_js_1 = require("../lib/browser.js");
// Default flows
const DEFAULT_FLOWS = {
    critical: [
        { name: 'Homepage', url: '/' },
        { name: 'About', url: '/about' },
        { name: 'Contact', url: '/contact' },
    ],
    auth: [
        { name: 'Login', url: '/login' },
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Profile', url: '/profile' },
    ],
    checkout: [
        { name: 'Cart', url: '/cart' },
        { name: 'Checkout', url: '/checkout' },
        { name: 'Payment', url: '/payment' },
    ],
};
exports.browseCommand = new commander_1.Command('browse')
    .description('Browser automation with Playwright')
    .argument('<url>', 'URL to screenshot')
    .option('-v, --viewport <name>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
    .option('-W, --width <pixels>', 'Custom viewport width', parseInt)
    .option('-H, --height <pixels>', 'Custom viewport height', parseInt)
    .option('-f, --full-page', 'Capture full page screenshot')
    .option('-o, --output <dir>', 'Output directory', './screenshots')
    .option('--flows <names>', 'Comma-separated flow names')
    .option('-w, --wait-for <selector>', 'Wait for element before screenshot')
    .option('-a, --actions <actions>', 'Comma-separated actions (click:selector,type:selector|text,wait:ms,scroll,hover:selector,screenshot)')
    .option('-t, --timeout <ms>', 'Navigation timeout', parseInt)
    .action(async (url, options) => {
    console.log(chalk_1.default.blue('══════════════════════════════════════════════════'));
    console.log(chalk_1.default.blue('Browser Automation'));
    console.log(chalk_1.default.blue('══════════════════════════════════════════════════\n'));
    try {
        // Validate URL
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        const viewport = (0, browser_js_1.getViewport)(options);
        console.log(chalk_1.default.gray(`URL: ${url}`));
        console.log(chalk_1.default.gray(`Viewport: ${viewport.width}x${viewport.height}`));
        console.log(chalk_1.default.gray(`Output: ${options.output || './screenshots'}`));
        if (options.flows) {
            // Run flows
            const flowNames = options.flows.split(',').map(f => f.trim());
            console.log(chalk_1.default.gray(`Flows: ${flowNames.join(', ')}\n`));
            for (const flowName of flowNames) {
                const flow = DEFAULT_FLOWS[flowName];
                if (!flow) {
                    console.log(chalk_1.default.yellow(`⚠ Flow "${flowName}" not found, skipping`));
                    continue;
                }
                console.log(chalk_1.default.blue(`\nRunning flow: ${flowName}`));
                const screenshots = await (0, browser_js_1.runFlow)(flow, options, url);
                for (const filepath of screenshots) {
                    console.log(chalk_1.default.green(`✓ Screenshot: ${filepath}`));
                }
            }
        }
        else {
            // Single screenshot
            console.log('');
            const filepath = await (0, browser_js_1.takeScreenshot)(url, options);
            console.log(chalk_1.default.green(`✓ Screenshot saved: ${filepath}`));
        }
        console.log(chalk_1.default.blue('\n══════════════════════════════════════════════════'));
        console.log(chalk_1.default.green('Done!'));
        console.log(chalk_1.default.blue('══════════════════════════════════════════════════'));
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
//# sourceMappingURL=browse.js.map