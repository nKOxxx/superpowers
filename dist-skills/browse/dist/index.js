import { chromium, devices } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIEWPORTS = {
    mobile: devices['iPhone 14'],
    tablet: devices['iPad Pro 11'],
    desktop: { viewport: { width: 1920, height: 1080 }, userAgent: 'desktop' }
};
async function parseArgs() {
    const args = process.argv.slice(2);
    const options = { url: '' };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg.startsWith('--')) {
            options.url = arg;
        }
        else if (arg === '--viewport' && args[i + 1]) {
            options.viewport = args[++i];
        }
        else if (arg === '--full-page') {
            options.fullPage = true;
        }
        else if (arg === '--selector' && args[i + 1]) {
            options.selector = args[++i];
        }
        else if (arg === '--wait-for' && args[i + 1]) {
            options.waitFor = args[++i];
        }
        else if (arg === '--actions' && args[i + 1]) {
            try {
                options.actions = JSON.parse(args[++i]);
            }
            catch (e) {
                console.error('Invalid actions JSON:', e);
                process.exit(1);
            }
        }
    }
    if (!options.url) {
        console.error('Usage: browse <url> [options]');
        console.error('Options:');
        console.error('  --viewport <mobile|tablet|desktop>');
        console.error('  --full-page');
        console.error('  --selector <css-selector>');
        console.error('  --wait-for <selector>');
        console.error('  --actions <json>');
        process.exit(1);
    }
    return options;
}
async function executeAction(page, action) {
    switch (action.type) {
        case 'click':
            await page.click(action.selector);
            break;
        case 'type':
            await page.fill(action.selector, action.text);
            break;
        case 'wait':
            await page.waitForTimeout(action.ms);
            break;
        case 'scroll':
            await page.evaluate((y) => window.scrollBy(0, y), action.y);
            break;
        case 'hover':
            await page.hover(action.selector);
            break;
    }
}
async function browse(options) {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext(options.viewport ? VIEWPORTS[options.viewport] : VIEWPORTS.desktop);
        const page = await context.newPage();
        console.log(`Navigating to ${options.url}...`);
        await page.goto(options.url, { waitUntil: 'networkidle' });
        if (options.waitFor) {
            console.log(`Waiting for ${options.waitFor}...`);
            await page.waitForSelector(options.waitFor, { timeout: 10000 });
        }
        if (options.actions) {
            console.log('Executing actions...');
            for (const action of options.actions) {
                await executeAction(page, action);
            }
        }
        const title = await page.title();
        const url = page.url();
        // Take screenshot
        const screenshotDir = path.join(process.cwd(), '.browse-screenshots');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        const timestamp = Date.now();
        const filename = `screenshot-${timestamp}.png`;
        const filepath = path.join(screenshotDir, filename);
        if (options.selector) {
            const element = await page.$(options.selector);
            if (!element) {
                throw new Error(`Element not found: ${options.selector}`);
            }
            await element.screenshot({ path: filepath });
        }
        else {
            await page.screenshot({
                path: filepath,
                fullPage: options.fullPage || false
            });
        }
        console.log('\n📸 Screenshot captured!');
        console.log(`Title: ${title}`);
        console.log(`URL: ${url}`);
        console.log(`Viewport: ${options.viewport || 'desktop'}`);
        console.log(`File: ${filepath}`);
        // Output for OpenClaw to capture
        console.log(`\nMEDIA: ${filepath}`);
    }
    finally {
        await browser.close();
    }
}
parseArgs().then(browse).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
