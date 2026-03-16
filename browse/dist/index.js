#!/usr/bin/env node
import { Command } from 'commander';
import { takeScreenshot, testUrl, clickElement, typeText, runFlow, closeBrowser } from './browser.js';
import { readJson } from '../shared/utils.js';
import { fileURLToPath } from 'url';
const program = new Command();
program
    .name('browse')
    .description('Browser automation with Playwright - screenshots, UI testing, flow validation')
    .version('1.0.0');
program
    .command('screenshot <url>')
    .description('Take a screenshot of a webpage')
    .option('-v, --viewport <preset>', 'Viewport preset: desktop, mobile, tablet', 'desktop')
    .option('-W, --width <number>', 'Custom viewport width')
    .option('-H, --height <number>', 'Custom viewport height')
    .option('-o, --output <dir>', 'Output directory', './screenshots')
    .option('-f, --filename <name>', 'Custom filename')
    .option('--full-page', 'Capture full page')
    .option('--wait-for <selector>', 'Wait for element before screenshot')
    .option('--wait-time <ms>', 'Wait time before screenshot', parseInt)
    .option('--hide <selectors...>', 'Hide elements (e.g., cookie banners)')
    .option('--dark-mode', 'Enable dark mode')
    .action(async (url, options) => {
    const viewport = options.width && options.height
        ? { width: parseInt(options.width), height: parseInt(options.height) }
        : options.viewport;
    await takeScreenshot({
        url,
        viewport,
        fullPage: options.fullPage,
        waitFor: options.waitFor,
        waitTime: options.waitTime,
        hideSelectors: options.hide,
        darkMode: options.darkMode,
        outputDir: options.output,
        filename: options.filename
    });
    await closeBrowser();
});
program
    .command('test-url <url>')
    .description('Test a URL for availability and content')
    .option('--expect-status <code>', 'Expected HTTP status', parseInt, 200)
    .option('--expect-text <text>', 'Text that should appear on page')
    .option('--expect-selector <selector>', 'CSS selector that should exist')
    .option('-t, --timeout <ms>', 'Page load timeout', parseInt, 30000)
    .option('--dark-mode', 'Enable dark mode')
    .action(async (url, options) => {
    const result = await testUrl({
        url,
        expectStatus: options.expectStatus,
        expectText: options.expectText,
        expectSelector: options.expectSelector,
        timeout: options.timeout,
        darkMode: options.darkMode
    });
    await closeBrowser();
    process.exit(result.success ? 0 : 1);
});
program
    .command('click <url>')
    .description('Click an element on a webpage')
    .option('-s, --selector <selector>', 'Element selector to click', '#submit-btn')
    .option('--screenshot', 'Take screenshot after click')
    .option('--wait-for-navigation', 'Wait for navigation after click')
    .option('-v, --viewport <preset>', 'Viewport preset', 'desktop')
    .action(async (url, options) => {
    await clickElement({
        url,
        selector: options.selector,
        screenshot: options.screenshot,
        waitForNavigation: options.waitForNavigation,
        viewport: options.viewport
    });
    await closeBrowser();
});
program
    .command('type <url>')
    .description('Type text into an input field')
    .option('-s, --selector <selector>', 'Input field selector', '#email')
    .option('-t, --text <text>', 'Text to type', 'user@example.com')
    .option('--clear', 'Clear field before typing')
    .option('--submit', 'Submit form after typing')
    .option('--delay <ms>', 'Delay between keystrokes', parseInt)
    .option('--screenshot', 'Take screenshot after typing')
    .action(async (url, options) => {
    await typeText({
        url,
        selector: options.selector,
        text: options.text,
        clear: options.clear,
        submit: options.submit,
        delay: options.delay,
        screenshot: options.screenshot
    });
    await closeBrowser();
});
program
    .command('flow <flow-file>')
    .description('Run a multi-step browser flow from a JSON file')
    .action(async (flowFile) => {
    const flow = await readJson(flowFile);
    if (!flow) {
        console.error(`Failed to load flow file: ${flowFile}`);
        process.exit(1);
    }
    const result = await runFlow(flow);
    await closeBrowser();
    process.exit(result.success ? 0 : 1);
});
// Handle direct invocation
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    program.parse();
}
export { program };
//# sourceMappingURL=index.js.map