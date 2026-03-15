import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
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
export async function run(url, options) {
    console.log(chalk.cyan('══════════════════════════════════════════════════'));
    console.log(chalk.cyan('Browser Automation'));
    console.log(chalk.cyan('══════════════════════════════════════════════════\n'));
    // Determine viewport
    let viewport;
    if (options.width && options.height) {
        viewport = { width: options.width, height: options.height };
    }
    else {
        viewport = viewports[options.viewport] || viewports.desktop;
    }
    console.log(chalk.gray(`URL: ${url}`));
    console.log(chalk.gray(`Viewport: ${viewport.width}x${viewport.height} (${options.viewport})`));
    console.log(chalk.gray(`Full page: ${options.fullPage ? 'yes' : 'no'}\n`));
    let browser;
    try {
        // Launch browser
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        // Navigate
        console.log(chalk.blue('ℹ Navigating...'));
        await page.goto(url, { timeout: options.timeout, waitUntil: 'networkidle' });
        console.log(chalk.green('✓ Page loaded\n'));
        // Execute actions if provided
        if (options.actions) {
            const actions = parseActions(options.actions);
            console.log(chalk.blue('ℹ Executing actions...'));
            for (const action of actions) {
                switch (action.type) {
                    case 'click':
                        await page.click(action.params[0]);
                        console.log(chalk.gray(`  Clicked: ${action.params[0]}`));
                        break;
                    case 'type':
                        await page.fill(action.params[0], action.params[1] || '');
                        console.log(chalk.gray(`  Typed into: ${action.params[0]}`));
                        break;
                    case 'wait':
                        await page.waitForTimeout(parseInt(action.params[0]) || 1000);
                        console.log(chalk.gray(`  Waited: ${action.params[0]}ms`));
                        break;
                    case 'scroll':
                        await page.evaluate('window.scrollBy(0, window.innerHeight)');
                        console.log(chalk.gray('  Scrolled down'));
                        break;
                    case 'hover':
                        await page.hover(action.params[0]);
                        console.log(chalk.gray(`  Hovered: ${action.params[0]}`));
                        break;
                }
            }
            console.log(chalk.green('✓ Actions completed\n'));
        }
        // Wait for element if specified
        if (options.waitFor) {
            console.log(chalk.blue(`ℹ Waiting for element: ${options.waitFor}...`));
            await page.waitForSelector(options.waitFor, { timeout: options.timeout });
            console.log(chalk.green('✓ Element found\n'));
        }
        // Ensure output directory exists
        if (!fs.existsSync(options.output)) {
            fs.mkdirSync(options.output, { recursive: true });
        }
        // Take screenshot
        const filename = generateFilename(url, options.viewport);
        const filepath = path.join(options.output, filename);
        console.log(chalk.blue('ℹ Capturing screenshot...'));
        await page.screenshot({
            path: filepath,
            fullPage: options.fullPage
        });
        console.log(chalk.green(`✓ Screenshot saved: ${filepath}\n`));
        console.log(chalk.cyan('══════════════════════════════════════════════════'));
    }
    catch (error) {
        console.error(chalk.red(`\n✗ Error: ${error.message}`));
        throw error;
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
//# sourceMappingURL=index.js.map