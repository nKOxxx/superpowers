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
exports.browse = browse;
const playwright_1 = require("playwright");
const config_js_1 = require("../lib/config.js");
const format = __importStar(require("../lib/format.js"));
const fs_1 = require("fs");
const path_1 = require("path");
async function browse(options) {
    const config = await (0, config_js_1.loadConfig)();
    const browserConfig = config.browser;
    const viewport = getViewport(options, browserConfig);
    const screenshotDir = process.env.SCREENSHOT_DIR || browserConfig.screenshotDir || './screenshots';
    const timeout = options.timeout || browserConfig.timeout || 30000;
    let browser;
    try {
        format.step(`Launching browser with viewport ${viewport.width}x${viewport.height}...`);
        browser = await playwright_1.chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        format.step(`Navigating to ${options.url}...`);
        await page.goto(options.url, { waitUntil: 'networkidle', timeout });
        // Wait for specific element if requested
        if (options.wait) {
            format.step(`Waiting for element: ${options.wait}...`);
            await page.waitForSelector(options.wait, { timeout });
        }
        // Execute actions if provided
        if (options.actions) {
            await executeActions(page, options.actions);
        }
        // Take screenshot
        const outputPath = options.output || getDefaultOutputPath(screenshotDir, options.url, viewport);
        await ensureDir((0, path_1.join)(outputPath, '..'));
        format.step(`Capturing screenshot to ${outputPath}...`);
        await page.screenshot({
            path: outputPath,
            fullPage: options.fullPage || false
        });
        format.success(`Screenshot saved: ${outputPath}`);
    }
    catch (error) {
        format.error(`Browser automation failed: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
function getViewport(options, config) {
    if (options.width && options.height) {
        return { width: options.width, height: options.height };
    }
    const viewportName = options.viewport || config.defaultViewport || 'desktop';
    const viewports = config.viewports || {
        mobile: { width: 375, height: 667 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1280, height: 720 }
    };
    return viewports[viewportName] || viewports.desktop;
}
async function executeActions(page, actions) {
    const actionList = actions.split(',');
    for (const action of actionList) {
        const [type, ...params] = action.split(':');
        switch (type.trim()) {
            case 'click': {
                const selector = params.join(':');
                format.step(`Clicking: ${selector}...`);
                await page.click(selector);
                break;
            }
            case 'type': {
                const [selector, text] = params.join(':').split('|');
                format.step(`Typing into ${selector}...`);
                await page.fill(selector, text);
                break;
            }
            case 'wait': {
                const ms = parseInt(params[0], 10);
                format.step(`Waiting ${ms}ms...`);
                await page.waitForTimeout(ms);
                break;
            }
            case 'scroll': {
                format.step('Scrolling down...');
                await page.evaluate('window.scrollBy(0, window.innerHeight)');
                break;
            }
            case 'hover': {
                const selector = params.join(':');
                format.step(`Hovering over ${selector}...`);
                await page.hover(selector);
                break;
            }
            default:
                format.warning(`Unknown action: ${type}`);
        }
    }
}
function getDefaultOutputPath(screenshotDir, url, viewport) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '_');
    const pathname = urlObj.pathname.replace(/\//g, '_') || '_';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const viewportName = `${viewport.width}x${viewport.height}`;
    return (0, path_1.join)(screenshotDir, `${hostname}${pathname}_${viewportName}_${timestamp}.png`);
}
async function ensureDir(dir) {
    try {
        await fs_1.promises.mkdir(dir, { recursive: true });
    }
    catch {
        // Directory already exists or error handled elsewhere
    }
}
//# sourceMappingURL=browse.js.map