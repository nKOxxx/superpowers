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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const playwright_1 = require("playwright");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    wide: { width: 1920, height: 1080 },
};
function parseActions(actionsStr) {
    return actionsStr.split(',').map(action => {
        const [type, ...params] = action.split(':');
        return { type: type.trim(), params: params.join(':').split('|') };
    });
}
function generateFilename(url, viewport) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${hostname}_${viewport}_${timestamp}.png`;
}
async function run(url, options) {
    console.log(chalk_1.default.cyan('══════════════════════════════════════════════════'));
    console.log(chalk_1.default.cyan('Browser Automation'));
    console.log(chalk_1.default.cyan('══════════════════════════════════════════════════\n'));
    // Determine viewport
    let viewport;
    if (options.width && options.height) {
        viewport = { width: options.width, height: options.height };
    }
    else {
        viewport = viewports[options.viewport] || viewports.desktop;
    }
    console.log(chalk_1.default.gray(`URL: ${url}`));
    console.log(chalk_1.default.gray(`Viewport: ${viewport.width}x${viewport.height} (${options.viewport})`));
    console.log(chalk_1.default.gray(`Full page: ${options.fullPage ? 'yes' : 'no'}\n`));
    let browser;
    try {
        // Launch browser
        browser = await playwright_1.chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        // Navigate
        console.log(chalk_1.default.blue('ℹ Navigating...'));
        await page.goto(url, { timeout: options.timeout, waitUntil: 'networkidle' });
        console.log(chalk_1.default.green('✓ Page loaded\n'));
        // Execute actions if provided
        if (options.actions) {
            const actions = parseActions(options.actions);
            console.log(chalk_1.default.blue('ℹ Executing actions...'));
            for (const action of actions) {
                switch (action.type) {
                    case 'click':
                        await page.click(action.params[0]);
                        console.log(chalk_1.default.gray(`  Clicked: ${action.params[0]}`));
                        break;
                    case 'type':
                        await page.fill(action.params[0], action.params[1] || '');
                        console.log(chalk_1.default.gray(`  Typed into: ${action.params[0]}`));
                        break;
                    case 'wait':
                        await page.waitForTimeout(parseInt(action.params[0]) || 1000);
                        console.log(chalk_1.default.gray(`  Waited: ${action.params[0]}ms`));
                        break;
                    case 'scroll':
                        await page.evaluate('window.scrollBy(0, window.innerHeight)');
                        console.log(chalk_1.default.gray('  Scrolled down'));
                        break;
                    case 'hover':
                        await page.hover(action.params[0]);
                        console.log(chalk_1.default.gray(`  Hovered: ${action.params[0]}`));
                        break;
                }
            }
            console.log(chalk_1.default.green('✓ Actions completed\n'));
        }
        // Wait for element if specified
        if (options.waitFor) {
            console.log(chalk_1.default.blue(`ℹ Waiting for element: ${options.waitFor}...`));
            await page.waitForSelector(options.waitFor, { timeout: options.timeout });
            console.log(chalk_1.default.green('✓ Element found\n'));
        }
        // Ensure output directory exists
        if (!fs.existsSync(options.output)) {
            fs.mkdirSync(options.output, { recursive: true });
        }
        // Take screenshot
        const filename = generateFilename(url, options.viewport);
        const filepath = path.join(options.output, filename);
        console.log(chalk_1.default.blue('ℹ Capturing screenshot...'));
        await page.screenshot({
            path: filepath,
            fullPage: options.fullPage
        });
        console.log(chalk_1.default.green(`✓ Screenshot saved: ${filepath}\n`));
        console.log(chalk_1.default.cyan('══════════════════════════════════════════════════'));
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ Error: ${error.message}`));
        throw error;
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
//# sourceMappingURL=index.js.map