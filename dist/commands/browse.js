import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    wide: { width: 1920, height: 1080 }
};
export async function browseCommand(url, options) {
    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log('Browser Automation');
    console.log('══════════════════════════════════════════════════');
    console.log('');
    console.log(`URL: ${url}`);
    let browser;
    try {
        // Determine viewport
        let viewport = viewports[options.viewport] || viewports.desktop;
        if (options.width && options.height) {
            viewport = {
                width: parseInt(options.width, 10),
                height: parseInt(options.height, 10)
            };
        }
        console.log(`Viewport: ${viewport.width}x${viewport.height}`);
        // Launch browser
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        // Navigate
        console.log('Navigating...');
        await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: parseInt(options.timeout, 10)
        });
        // Execute actions if provided
        if (options.actions) {
            console.log('Executing actions...');
            await executeActions(page, options.actions);
        }
        // Wait for element if specified
        if (options.waitFor) {
            console.log(`Waiting for: ${options.waitFor}`);
            await page.waitForSelector(options.waitFor, { timeout: 10000 });
        }
        // Ensure output directory exists
        const outputDir = resolve(options.output);
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }
        // Generate filename
        const hostname = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '-');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${hostname}_${options.viewport}_${timestamp}.png`;
        const filepath = join(outputDir, filename);
        // Take screenshot
        const screenshotBuffer = await page.screenshot({
            fullPage: options.fullPage,
            type: 'png'
        });
        writeFileSync(filepath, screenshotBuffer);
        console.log('');
        console.log(`✓ Screenshot saved: ${filepath}`);
        if (options.base64) {
            const base64 = screenshotBuffer.toString('base64');
            console.log('');
            console.log('---BASE64_START---');
            console.log(base64);
            console.log('---BASE64_END---');
        }
    }
    catch (error) {
        console.error('');
        console.error('✗ Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
async function executeActions(page, actions) {
    const actionList = actions.split(',');
    for (const action of actionList) {
        const [type, ...params] = action.split(':');
        switch (type) {
            case 'click':
                if (params[0]) {
                    await page.click(params[0]);
                    console.log(`  Clicked: ${params[0]}`);
                }
                break;
            case 'type':
                if (params[0] && params[1]) {
                    await page.fill(params[0], params[1]);
                    console.log(`  Typed into: ${params[0]}`);
                }
                break;
            case 'wait':
                const delay = parseInt(params[0] || '1000', 10);
                await page.waitForTimeout(delay);
                console.log(`  Waited: ${delay}ms`);
                break;
            case 'scroll':
                await page.evaluate('window.scrollBy(0, window.innerHeight)');
                console.log('  Scrolled down');
                break;
            case 'hover':
                if (params[0]) {
                    await page.hover(params[0]);
                    console.log(`  Hovered: ${params[0]}`);
                }
                break;
            case 'screenshot':
                console.log('  Screenshot at this point');
                break;
        }
    }
}
//# sourceMappingURL=browse.js.map