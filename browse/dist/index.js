import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
};
export async function browse(options) {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({
            viewport: getViewport(options)
        });
        const page = await context.newPage();
        // Navigate to URL
        await page.goto(options.url, { waitUntil: 'networkidle' });
        const actionsPerformed = [];
        // Execute actions if provided
        if (options.actions) {
            const actions = parseActions(options.actions);
            for (const action of actions) {
                await executeAction(page, action);
                actionsPerformed.push(`${action.type}:${action.selector || action.value}`);
            }
        }
        // Generate output path
        const outputPath = options.output || generateOutputPath(options.url);
        // Take screenshot
        if (options.selector) {
            const element = await page.locator(options.selector).first();
            await element.screenshot({ path: outputPath });
        }
        else {
            await page.screenshot({
                path: outputPath,
                fullPage: options.fullPage || false
            });
        }
        // Read and encode to base64
        const imageBuffer = fs.readFileSync(outputPath);
        const base64Image = imageBuffer.toString('base64');
        return {
            screenshotPath: outputPath,
            base64Image,
            url: options.url,
            viewport: getViewport(options),
            actionsPerformed
        };
    }
    finally {
        await browser.close();
    }
}
function getViewport(options) {
    if (options.width && options.height) {
        return { width: options.width, height: options.height };
    }
    if (options.viewport && viewports[options.viewport]) {
        return viewports[options.viewport];
    }
    return viewports.desktop;
}
function parseActions(actionsString) {
    return actionsString.split(',').map(actionStr => {
        const parts = actionStr.trim().split(':');
        const type = parts[0];
        switch (type) {
            case 'click':
            case 'scroll':
            case 'hover':
                return { type, selector: parts[1] };
            case 'type':
                return { type, selector: parts[1], value: parts[2] };
            case 'wait':
                return { type, value: parts[1] };
            default:
                throw new Error(`Unknown action type: ${type}`);
        }
    });
}
async function executeAction(page, action) {
    switch (action.type) {
        case 'click':
            if (action.selector) {
                await page.click(action.selector);
            }
            break;
        case 'type':
            if (action.selector && action.value) {
                await page.fill(action.selector, action.value);
            }
            break;
        case 'wait':
            if (action.value) {
                await page.waitForTimeout(parseInt(action.value, 10));
            }
            break;
        case 'scroll':
            if (action.selector) {
                await page.locator(action.selector).scrollIntoViewIfNeeded();
            }
            break;
        case 'hover':
            if (action.selector) {
                await page.hover(action.selector);
            }
            break;
    }
}
function generateOutputPath(url) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hostname = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(process.cwd(), `screenshot-${hostname}-${timestamp}.png`);
}
//# sourceMappingURL=index.js.map