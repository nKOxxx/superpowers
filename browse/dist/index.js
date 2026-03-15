#!/usr/bin/env node
import { chromium, devices } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Viewport presets
const VIEWPORT_PRESETS = {
    mobile: devices['iPhone 14'],
    tablet: devices['iPad Pro 11'],
    desktop: {
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};
// Parse custom viewport (e.g., "800x600")
function parseViewport(input) {
    const match = input.match(/^(\d+)x(\d+)$/);
    if (match) {
        return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
    }
    if (VIEWPORT_PRESETS[input]) {
        return input;
    }
    throw new Error(`Invalid viewport: ${input}. Use mobile, tablet, desktop, or WIDTHxHEIGHT`);
}
// Execute a single action
async function executeAction(page, action) {
    switch (action.type) {
        case 'click':
            if (!action.selector)
                throw new Error('Click action requires selector');
            await page.click(action.selector);
            break;
        case 'type':
            if (!action.selector || !action.text) {
                throw new Error('Type action requires selector and text');
            }
            await page.fill(action.selector, action.text);
            break;
        case 'wait':
            await page.waitForTimeout(action.ms || 1000);
            break;
        case 'scroll':
            if (action.selector) {
                await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (el)
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, action.selector);
            }
            else {
                await page.evaluate((y) => window.scrollBy(0, y), action.y || 500);
            }
            await page.waitForTimeout(300);
            break;
        case 'hover':
            if (!action.selector)
                throw new Error('Hover action requires selector');
            await page.hover(action.selector);
            break;
    }
}
// Convert image to base64
async function toBase64(imagePath) {
    const buffer = await fs.promises.readFile(imagePath);
    return buffer.toString('base64');
}
// Main browse function
export async function browse(options) {
    const startTime = Date.now();
    let browser = null;
    let actionsExecuted = 0;
    try {
        // Validate URL
        let url = options.url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        // Get viewport config
        let viewportConfig;
        if (typeof options.viewport === 'string') {
            viewportConfig = VIEWPORT_PRESETS[options.viewport] || VIEWPORT_PRESETS.desktop;
        }
        else {
            viewportConfig = {
                viewport: options.viewport,
                deviceScaleFactor: 1,
                userAgent: 'custom'
            };
        }
        // Launch browser
        browser = await chromium.launch({
            headless: options.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const context = await browser.newContext({
            viewport: viewportConfig.viewport,
            deviceScaleFactor: viewportConfig.deviceScaleFactor,
            userAgent: viewportConfig.userAgent
        });
        const page = await context.newPage();
        page.setDefaultTimeout(options.timeout);
        // Navigate
        await page.goto(url, { waitUntil: 'networkidle' });
        // Wait for selector if specified
        if (options.waitFor) {
            await page.waitForSelector(options.waitFor, { timeout: options.timeout });
        }
        // Execute actions
        if (options.actions) {
            for (const action of options.actions) {
                await executeAction(page, action);
                actionsExecuted++;
            }
        }
        const title = await page.title();
        const finalUrl = page.url();
        // Generate output path
        const outputPath = options.output || path.join(process.cwd(), `screenshot-${Date.now()}.png`);
        // Take screenshot
        if (options.selector) {
            const element = await page.locator(options.selector).first();
            await element.screenshot({ path: outputPath });
        }
        else {
            await page.screenshot({
                path: outputPath,
                fullPage: options.fullPage
            });
        }
        const duration = Date.now() - startTime;
        return {
            success: true,
            screenshotPath: outputPath,
            url: finalUrl,
            title,
            viewport: typeof options.viewport === 'string' ? options.viewport : 'custom',
            duration,
            actionsExecuted
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            url: options.url,
            viewport: typeof options.viewport === 'string' ? options.viewport : 'custom',
            duration: Date.now() - startTime,
            actionsExecuted,
            error: errorMessage
        };
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    // Parse CLI arguments
    const options = {
        url: '',
        viewport: 'desktop',
        fullPage: false,
        timeout: 30000,
        headless: process.env.BROWSE_HEADLESS !== 'false'
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            switch (key) {
                case 'viewport':
                case 'v':
                    options.viewport = parseViewport(value || args[++i]);
                    break;
                case 'full-page':
                case 'f':
                    options.fullPage = true;
                    break;
                case 'selector':
                case 's':
                    options.selector = value || args[++i];
                    break;
                case 'wait-for':
                case 'w':
                    options.waitFor = value || args[++i];
                    break;
                case 'timeout':
                case 't':
                    options.timeout = parseInt(value || args[++i], 10);
                    break;
                case 'actions':
                case 'a':
                    try {
                        options.actions = JSON.parse(value || args[++i]);
                    }
                    catch (e) {
                        console.error('Invalid actions JSON');
                        process.exit(1);
                    }
                    break;
                case 'output':
                case 'o':
                    options.output = value || args[++i];
                    break;
                case 'headless':
                    options.headless = value !== 'false';
                    break;
                case 'no-headless':
                    options.headless = false;
                    break;
            }
        }
        else if (!arg.startsWith('-') && !options.url) {
            options.url = arg;
        }
    }
    if (!options.url) {
        console.error(`
Usage: browse <url> [options]

Options:
  -v, --viewport <preset|WxH>  Viewport: mobile, tablet, desktop, or custom (default: desktop)
  -f, --full-page              Capture full page screenshot
  -s, --selector <css>         Screenshot specific element
  -w, --wait-for <selector>    Wait for element before screenshot
  -t, --timeout <ms>           Navigation timeout (default: 30000)
  -a, --actions <json>         Execute action flow (JSON array)
  -o, --output <path>          Output file path
  --headless                   Run in headless mode (default: true)
  --no-headless                Show browser window

Examples:
  browse https://example.com
  browse example.com --viewport=mobile --full-page
  browse example.com --viewport=375x667 --selector="#hero"
  browse example.com --actions='[{"type":"click","selector":"#btn"}]'
`);
        process.exit(1);
    }
    browse(options).then(async (result) => {
        if (result.success) {
            console.log('\n📸 Screenshot captured!');
            console.log(`Title: ${result.title}`);
            console.log(`URL: ${result.url}`);
            console.log(`Viewport: ${result.viewport}`);
            console.log(`Duration: ${result.duration}ms`);
            if (result.actionsExecuted > 0) {
                console.log(`Actions: ${result.actionsExecuted} executed`);
            }
            console.log(`\nFile: ${result.screenshotPath}`);
            // Output base64 for Telegram integration
            if (process.env.OUTPUT_BASE64 === 'true' && result.screenshotPath) {
                const base64 = await toBase64(result.screenshotPath);
                console.log(`\nBASE64:${base64}`);
            }
            // Output MEDIA marker for OpenClaw
            if (result.screenshotPath) {
                console.log(`\nMEDIA: ${result.screenshotPath}`);
            }
            process.exit(0);
        }
        else {
            console.error(`\n❌ Error: ${result.error}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=index.js.map