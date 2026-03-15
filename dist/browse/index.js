"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.browseCommand = browseCommand;
const playwright_1 = require("playwright");
const picocolors_1 = __importDefault(require("picocolors"));
const ora_1 = __importDefault(require("ora"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const VIEWPORT_PRESETS = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 }
};
function parseActions(actionsStr) {
    const actions = [];
    const parts = actionsStr.split(',');
    for (const part of parts) {
        const [type, ...params] = part.split(':');
        const trimmedType = type.trim();
        switch (trimmedType) {
            case 'click':
                actions.push({ type: 'click', selector: params.join(':') });
                break;
            case 'type': {
                const typeParams = params.join(':').split('|');
                actions.push({ type: 'type', selector: typeParams[0], text: typeParams[1] || '' });
                break;
            }
            case 'wait':
                actions.push({ type: 'wait', delay: parseInt(params[0], 10) || 1000 });
                break;
            case 'scroll':
                actions.push({ type: 'scroll' });
                break;
            case 'hover':
                actions.push({ type: 'hover', selector: params.join(':') });
                break;
            case 'screenshot':
                actions.push({ type: 'screenshot' });
                break;
        }
    }
    return actions;
}
async function loadConfig() {
    try {
        const configPath = path_1.default.resolve(process.cwd(), 'superpowers.config.json');
        const content = await promises_1.default.readFile(configPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return {};
    }
}
async function browseCommand(url, options) {
    const spinner = (0, ora_1.default)('Launching browser...').start();
    let browser;
    try {
        // Ensure output directory exists
        await promises_1.default.mkdir(options.output, { recursive: true });
        // Load config for flows if specified
        const config = await loadConfig();
        const browserConfig = (config.browser || {});
        // Determine viewport
        let viewport;
        if (options.width && options.height) {
            viewport = {
                width: parseInt(options.width, 10),
                height: parseInt(options.height, 10)
            };
        }
        else {
            viewport = VIEWPORT_PRESETS[options.viewport] || VIEWPORT_PRESETS.desktop;
        }
        // Launch browser
        browser = await playwright_1.chromium.launch({
            headless: process.env.BROWSE_HEADLESS !== 'false'
        });
        const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height }
        });
        const page = await context.newPage();
        // Handle flows if specified
        if (options.flows) {
            const flows = (browserConfig.flows || {});
            const flowNames = options.flows.split(',').map(f => f.trim());
            for (const flowName of flowNames) {
                const flow = flows[flowName];
                if (!flow) {
                    spinner.warn(`Flow "${flowName}" not found in config`);
                    continue;
                }
                for (const step of flow) {
                    spinner.text = `Flow "${flowName}": ${step.name}...`;
                    const stepUrl = step.url.startsWith('http') ? step.url : new URL(step.url, url).toString();
                    await page.goto(stepUrl, { waitUntil: 'networkidle', timeout: parseInt(options.timeout, 10) });
                    if (step.actions) {
                        await executeActions(page, step.actions, spinner);
                    }
                    await captureScreenshot(page, options, flowName, step.name, viewport);
                }
            }
        }
        else {
            // Single page navigation
            spinner.text = `Navigating to ${url}...`;
            await page.goto(url, { waitUntil: 'networkidle', timeout: parseInt(options.timeout, 10) });
            // Wait for element if specified
            if (options.waitFor) {
                spinner.text = `Waiting for ${options.waitFor}...`;
                await page.waitForSelector(options.waitFor, { timeout: parseInt(options.timeout, 10) });
            }
            // Execute custom actions if specified
            if (options.actions) {
                const actions = parseActions(options.actions);
                await executeActions(page, actions, spinner);
            }
            // Capture screenshot
            await captureScreenshot(page, options, null, null, viewport);
        }
        spinner.succeed(picocolors_1.default.green('Browser automation complete'));
    }
    catch (error) {
        spinner.fail(picocolors_1.default.red(`Browser automation failed: ${error instanceof Error ? error.message : String(error)}`));
        throw error;
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
async function executeActions(page, actions, spinner) {
    for (const action of actions) {
        switch (action.type) {
            case 'click':
                if (action.selector) {
                    spinner.text = `Clicking ${action.selector}...`;
                    await page.click(action.selector);
                }
                break;
            case 'type':
                if (action.selector && action.text !== undefined) {
                    spinner.text = `Typing into ${action.selector}...`;
                    await page.fill(action.selector, action.text);
                }
                break;
            case 'wait':
                spinner.text = `Waiting ${action.delay}ms...`;
                await page.waitForTimeout(action.delay || 1000);
                break;
            case 'scroll':
                spinner.text = 'Scrolling...';
                await page.mouse.wheel(0, 600);
                await page.waitForTimeout(500);
                break;
            case 'hover':
                if (action.selector) {
                    spinner.text = `Hovering over ${action.selector}...`;
                    await page.hover(action.selector);
                }
                break;
            case 'screenshot':
                // Screenshot is handled separately
                break;
        }
    }
}
async function captureScreenshot(page, options, flowName, stepName, viewport) {
    const hostname = new URL(page.url()).hostname.replace(/[^a-z0-9]/gi, '-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const viewportName = `${viewport.width}x${viewport.height}`;
    let filename;
    if (flowName && stepName) {
        filename = `${hostname}_${flowName}_${stepName.replace(/\s+/g, '_')}_${viewportName}_${timestamp}.png`;
    }
    else {
        filename = `${hostname}_${viewportName}_${timestamp}.png`;
    }
    const filepath = path_1.default.join(options.output, filename);
    await page.screenshot({
        path: filepath,
        fullPage: options.fullPage
    });
    console.log(picocolors_1.default.green(`✓ Screenshot saved: ${filepath}`));
    return filepath;
}
//# sourceMappingURL=index.js.map