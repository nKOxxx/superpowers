import { chromium, firefox, webkit } from 'playwright';
import { program } from 'commander';
import chalk from 'chalk';
const VIEWPORTS = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    'mobile-xl': { width: 414, height: 896 },
};
async function parseActions(actionsStr) {
    if (!actionsStr)
        return [];
    try {
        return JSON.parse(actionsStr);
    }
    catch {
        // Simple parser for CLI usage
        const actions = [];
        const parts = actionsStr.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith('click:')) {
                actions.push({ type: 'click', selector: trimmed.slice(6) });
            }
            else if (trimmed.startsWith('type:')) {
                const [selector, text] = trimmed.slice(5).split('=');
                actions.push({ type: 'type', selector, text });
            }
            else if (trimmed.startsWith('wait:')) {
                actions.push({ type: 'wait', duration: parseInt(trimmed.slice(5)) });
            }
            else if (trimmed.startsWith('scroll:')) {
                const [x, y] = trimmed.slice(7).split(',').map(Number);
                actions.push({ type: 'scroll', x, y });
            }
            else if (trimmed.startsWith('hover:')) {
                actions.push({ type: 'hover', selector: trimmed.slice(6) });
            }
            else if (trimmed.startsWith('press:')) {
                actions.push({ type: 'press', key: trimmed.slice(6) });
            }
        }
        return actions;
    }
}
async function executeAction(page, action) {
    switch (action.type) {
        case 'click':
            if (action.selector)
                await page.click(action.selector);
            break;
        case 'type':
            if (action.selector && action.text) {
                await page.fill(action.selector, action.text);
            }
            break;
        case 'wait':
            await page.waitForTimeout(action.duration || 1000);
            break;
        case 'scroll':
            await page.evaluate(`window.scrollTo(${action.x || 0}, ${action.y || 0})`);
            break;
        case 'hover':
            if (action.selector)
                await page.hover(action.selector);
            break;
        case 'press':
            if (action.key)
                await page.keyboard.press(action.key);
            break;
    }
}
export async function browse(options) {
    let browser = null;
    try {
        const browserType = options.browser || 'chromium';
        const browserLauncher = browserType === 'firefox' ? firefox : browserType === 'webkit' ? webkit : chromium;
        browser = await browserLauncher.launch({ headless: true });
        const context = await browser.newContext({
            viewport: options.width && options.height
                ? { width: options.width, height: options.height }
                : VIEWPORTS[options.viewport || 'desktop'],
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        const page = await context.newPage();
        console.log(chalk.blue(`🌐 Navigating to ${options.url}...`));
        await page.goto(options.url, { waitUntil: 'networkidle', timeout: (options.timeout || 30) * 1000 });
        if (options.waitFor) {
            await page.waitForSelector(options.waitFor, { timeout: 10000 });
        }
        // Execute actions
        const actions = await parseActions(options.actions);
        for (const action of actions) {
            console.log(chalk.yellow(`  → ${action.type}${action.selector ? ': ' + action.selector : ''}`));
            await executeAction(page, action);
        }
        // Take screenshot
        const screenshotOptions = {
            type: 'png',
            fullPage: options.fullPage || false
        };
        if (options.selector) {
            const element = await page.locator(options.selector).first();
            screenshotOptions.clip = await element.boundingBox();
        }
        const screenshot = await page.screenshot(screenshotOptions);
        await browser.close();
        browser = null;
        const base64 = screenshot.toString('base64');
        // Save to file if output specified
        if (options.output) {
            const fs = await import('fs');
            fs.writeFileSync(options.output, screenshot);
            console.log(chalk.green(`✅ Screenshot saved: ${options.output}`));
            return { path: options.output, base64: options.base64 ? base64 : undefined, success: true };
        }
        console.log(chalk.green(`✅ Screenshot captured (${screenshot.length} bytes)`));
        return { base64, success: true };
    }
    catch (error) {
        if (browser)
            await browser.close();
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`❌ Error: ${errorMsg}`));
        return { success: false, error: errorMsg };
    }
}
// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    program
        .name('browse')
        .description('Browser automation with Playwright')
        .version('1.0.0')
        .argument('<url>', 'URL to browse')
        .option('-b, --browser <type>', 'Browser: chromium, firefox, webkit', 'chromium')
        .option('-v, --viewport <preset>', 'Viewport preset: mobile, tablet, desktop', 'desktop')
        .option('-W, --width <px>', 'Viewport width', parseInt)
        .option('-H, --height <px>', 'Viewport height', parseInt)
        .option('-f, --full-page', 'Capture full page', false)
        .option('-s, --selector <sel>', 'Capture specific element')
        .option('-o, --output <path>', 'Save to file')
        .option('--base64', 'Output base64 to stdout', false)
        .option('-a, --actions <actions>', 'Actions: click:selector,type:sel=text,wait:ms')
        .option('-t, --timeout <sec>', 'Navigation timeout', parseInt, 30)
        .option('-w, --wait-for <selector>', 'Wait for selector before capture')
        .action(async (url, opts) => {
        const result = await browse({ url, ...opts });
        if (!result.success)
            process.exit(1);
        if (opts.base64 && result.base64)
            console.log(result.base64);
    });
    program.parse();
}
