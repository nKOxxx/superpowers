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
exports.handler = handler;
const playwright_1 = require("playwright");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// Viewport presets
const VIEWPORT_PRESETS = {
    mobile: {
        width: 375,
        height: 812,
        deviceScaleFactor: 3,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    },
    tablet: {
        width: 768,
        height: 1024,
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    },
    desktop: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};
// Parse command line arguments
function parseArgs(args) {
    const options = {
        url: '',
        viewport: 'desktop',
        timeout: 30000
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            switch (key) {
                case 'viewport':
                    options.viewport = value || 'desktop';
                    break;
                case 'full-page':
                    options.fullPage = true;
                    break;
                case 'selector':
                    options.selector = value;
                    break;
                case 'flow':
                    try {
                        options.flow = JSON.parse(value || '[]');
                    }
                    catch (e) {
                        throw new Error(`Invalid flow JSON: ${e}`);
                    }
                    break;
                case 'wait-for':
                    options.waitFor = value;
                    break;
                case 'timeout':
                    options.timeout = parseInt(value || '30000', 10);
                    break;
                case 'output':
                    options.outputPath = value;
                    break;
            }
        }
        else if (!arg.startsWith('-') && !options.url) {
            options.url = arg;
        }
    }
    if (!options.url) {
        throw new Error('URL is required. Usage: /browse <url> [options]');
    }
    // Ensure URL has protocol
    if (!options.url.startsWith('http://') && !options.url.startsWith('https://')) {
        options.url = 'https://' + options.url;
    }
    return options;
}
// Execute flow actions
async function executeFlow(page, actions, timeout) {
    let executed = 0;
    for (const action of actions) {
        switch (action.action) {
            case 'click':
                if (!action.selector)
                    throw new Error('Click action requires selector');
                await page.click(action.selector, { timeout });
                break;
            case 'type':
                if (!action.selector || !action.text) {
                    throw new Error('Type action requires selector and text');
                }
                await page.fill(action.selector, action.text, { timeout });
                break;
            case 'wait':
                await page.waitForTimeout(action.ms || 1000);
                break;
            case 'scroll':
                if (action.selector) {
                    await page.evaluate((sel) => {
                        const el = document.querySelector(sel);
                        if (el)
                            el.scrollIntoView({ behavior: 'smooth' });
                    }, action.selector);
                }
                else {
                    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
                }
                await page.waitForTimeout(500);
                break;
            case 'hover':
                if (!action.selector)
                    throw new Error('Hover action requires selector');
                await page.hover(action.selector, { timeout });
                break;
            case 'waitForSelector':
                if (!action.selector)
                    throw new Error('waitForSelector action requires selector');
                await page.waitForSelector(action.selector, { timeout });
                break;
            case 'screenshot':
                // Handled separately
                break;
        }
        executed++;
    }
    return executed;
}
// Main handler function
async function handler(context) {
    const startTime = Date.now();
    let browser = null;
    let context_ = null;
    let page = null;
    try {
        // Parse arguments
        const options = parseArgs(context.args);
        // Get viewport preset
        const viewport = VIEWPORT_PRESETS[options.viewport || 'desktop'] || VIEWPORT_PRESETS.desktop;
        // Launch browser
        const headless = process.env.BROWSE_HEADLESS !== 'false';
        browser = await playwright_1.chromium.launch({
            headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        // Create context with viewport
        context_ = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            deviceScaleFactor: viewport.deviceScaleFactor,
            userAgent: viewport.userAgent
        });
        page = await context_.newPage();
        // Set default timeout
        page.setDefaultTimeout(options.timeout || 30000);
        // Navigate to URL
        await page.goto(options.url, { waitUntil: 'networkidle' });
        // Wait for specific selector if provided
        if (options.waitFor) {
            await page.waitForSelector(options.waitFor, { timeout: options.timeout });
        }
        // Execute flow actions if provided
        let actionsExecuted = 0;
        if (options.flow && options.flow.length > 0) {
            actionsExecuted = await executeFlow(page, options.flow, options.timeout || 30000);
        }
        // Generate output path
        const outputDir = options.outputPath || os.tmpdir();
        const timestamp = Date.now();
        const screenshotPath = path.join(outputDir, `browse-${timestamp}.png`);
        // Take screenshot
        if (options.selector) {
            // Screenshot specific element
            const element = await page.locator(options.selector).first();
            await element.screenshot({ path: screenshotPath });
        }
        else {
            // Screenshot page
            await page.screenshot({
                path: screenshotPath,
                fullPage: options.fullPage || false
            });
        }
        const duration = Date.now() - startTime;
        return {
            success: true,
            message: `Screenshot captured: ${screenshotPath}`,
            data: {
                screenshotPath,
                url: options.url,
                viewport: options.viewport,
                duration,
                actionsExecuted
            }
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            message: `Browse failed: ${errorMessage}`,
            error: errorMessage
        };
    }
    finally {
        if (context_)
            await context_.close();
        if (browser)
            await browser.close();
    }
}
// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    const context = {
        args,
        options: {}
    };
    handler(context).then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    });
}
