import { chromium } from 'playwright';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
const viewportPresets = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
};
export async function browseCommand(url, options) {
    console.log(chalk.blue('🔍 Browse'), chalk.cyan(url));
    let viewport = viewportPresets.desktop;
    if (options.viewport && viewportPresets[options.viewport]) {
        viewport = viewportPresets[options.viewport];
    }
    if (options.width && options.height) {
        viewport = {
            width: parseInt(options.width, 10),
            height: parseInt(options.height, 10)
        };
    }
    console.log(chalk.gray(`Viewport: ${viewport.width}x${viewport.height}`));
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({
            viewport,
            deviceScaleFactor: 2
        });
        const page = await context.newPage();
        console.log(chalk.gray('Navigating...'));
        await page.goto(url, { waitUntil: 'networkidle' });
        // Execute action sequence if provided
        if (options.actions) {
            const actions = JSON.parse(options.actions);
            await executeActions(page, actions);
        }
        // Wait a bit for any animations
        await page.waitForTimeout(500);
        let screenshotBuffer;
        if (options.element) {
            console.log(chalk.gray(`Capturing element: ${options.element}`));
            const element = await page.locator(options.element).first();
            screenshotBuffer = await element.screenshot();
        }
        else {
            console.log(chalk.gray(options.fullPage ? 'Capturing full page...' : 'Capturing viewport...'));
            screenshotBuffer = await page.screenshot({
                fullPage: options.fullPage || false
            });
        }
        if (options.base64) {
            const base64 = screenshotBuffer.toString('base64');
            console.log(chalk.green('✅ Screenshot captured'));
            console.log(chalk.gray(`Base64 length: ${base64.length} chars`));
            console.log('\n---BASE64_START---');
            console.log(base64);
            console.log('---BASE64_END---');
        }
        else {
            const outputPath = options.output || `screenshot-${Date.now()}.png`;
            const resolvedPath = resolve(outputPath);
            writeFileSync(resolvedPath, screenshotBuffer);
            console.log(chalk.green('✅ Screenshot saved:'), chalk.cyan(resolvedPath));
        }
    }
    catch (error) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await browser.close();
    }
}
async function executeActions(page, actions) {
    console.log(chalk.gray(`Executing ${actions.length} actions...`));
    for (const action of actions) {
        switch (action.type) {
            case 'click':
                if (action.target) {
                    console.log(chalk.gray(`  Click: ${action.target}`));
                    await page.click(action.target);
                }
                break;
            case 'type':
                if (action.target && action.value) {
                    console.log(chalk.gray(`  Type "${action.value}" into ${action.target}`));
                    await page.fill(action.target, action.value);
                }
                break;
            case 'wait':
                const duration = action.duration || 1000;
                console.log(chalk.gray(`  Wait: ${duration}ms`));
                await page.waitForTimeout(duration);
                break;
            case 'scroll':
                if (action.x !== undefined && action.y !== undefined) {
                    console.log(chalk.gray(`  Scroll to: ${action.x}, ${action.y}`));
                    await page.evaluate(({ x, y }) => {
                        globalThis.scrollTo(x, y);
                    }, { x: action.x, y: action.y });
                }
                else if (action.target) {
                    console.log(chalk.gray(`  Scroll to element: ${action.target}`));
                    await page.locator(action.target).scrollIntoViewIfNeeded();
                }
                break;
            case 'hover':
                if (action.target) {
                    console.log(chalk.gray(`  Hover: ${action.target}`));
                    await page.hover(action.target);
                }
                break;
            case 'fill':
                if (action.target && action.value) {
                    console.log(chalk.gray(`  Fill ${action.target} with "${action.value}"`));
                    await page.fill(action.target, action.value);
                }
                break;
            default:
                console.log(chalk.yellow(`  Unknown action: ${action.type}`));
        }
        // Small delay between actions
        await page.waitForTimeout(200);
    }
}
//# sourceMappingURL=index.js.map