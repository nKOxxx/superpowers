#!/usr/bin/env tsx
/**
 * /browse - Browser Automation Skill
 *
 * Visual testing and browser automation using Playwright
 */
import { Command } from 'commander';
import pc from 'picocolors';
import { takeScreenshot, takeResponsiveScreenshots, createComparisonReport } from './lib/screenshot.js';
import { executeFlow, createFlowFromPaths, formatFlowResults } from './lib/flows.js';
import { loadConfig } from './lib/config.js';
import { mkdir } from 'fs/promises';
import { join } from 'path';
const program = new Command();
program
    .name('browse')
    .description('Browser automation and visual testing with Playwright')
    .version('1.0.0');
program
    .argument('<url>', 'URL to browse')
    .option('-v, --viewport <size>', 'Viewport size (mobile, tablet, desktop)', 'desktop')
    .option('-w, --width <pixels>', 'Custom viewport width')
    .option('-h, --height <pixels>', 'Custom viewport height')
    .option('-f, --flows <names>', 'Run predefined flows (comma-separated)')
    .option('-s, --screenshot', 'Take screenshot', true)
    .option('-F, --full-page', 'Full page screenshot', true)
    .option('-o, --output <path>', 'Output directory for screenshots')
    .option('-r, --responsive', 'Take screenshots at all viewport sizes')
    .option('--no-headless', 'Run browser in visible mode')
    .option('--wait-for <selector>', 'Wait for element before screenshot')
    .option('--delay <ms>', 'Additional delay before screenshot', '0')
    .option('--hide <selectors>', 'CSS selectors to hide (comma-separated)')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (url, options) => {
    try {
        const config = loadConfig(options.config);
        console.log(pc.cyan('🌐 Browse: Browser Automation'));
        console.log(pc.gray(`URL: ${url}`));
        console.log('');
        // Ensure screenshot directory exists
        const screenshotDir = options.output || config.browser.screenshotDir;
        await mkdir(screenshotDir, { recursive: true });
        // Determine viewport
        let viewport = config.browser.viewports.desktop;
        if (options.width && options.height) {
            viewport = {
                width: parseInt(options.width, 10),
                height: parseInt(options.height, 10)
            };
        }
        else if (options.viewport && config.browser.viewports[options.viewport]) {
            viewport = config.browser.viewports[options.viewport];
        }
        // Handle responsive mode
        if (options.responsive) {
            console.log(pc.yellow('📱 Taking responsive screenshots...'));
            const results = await takeResponsiveScreenshots(url, config.browser.viewports, screenshotDir);
            console.log(pc.green(`✅ Captured ${results.length} screenshots`));
            for (const result of results) {
                console.log(`   ${result.viewport.width}x${result.viewport.height}: ${result.path}`);
            }
            // Generate comparison report
            const reportPath = join(screenshotDir, 'comparison-report.html');
            await createComparisonReport(results, reportPath);
            console.log(pc.blue(`📊 Report: ${reportPath}`));
            return;
        }
        // Handle flows
        if (options.flows) {
            const flowNames = options.flows.split(',');
            console.log(pc.yellow(`🔄 Running flows: ${flowNames.join(', ')}`));
            const results = [];
            for (const flowName of flowNames) {
                const paths = config.browser.flows[flowName];
                if (!paths) {
                    console.warn(pc.yellow(`⚠️ Flow "${flowName}" not found in config`));
                    continue;
                }
                const flow = createFlowFromPaths(flowName, url, paths);
                const result = await executeFlow(flow, {
                    viewport,
                    screenshotDir,
                    headless: options.headless
                });
                results.push(result);
            }
            console.log('');
            console.log(formatFlowResults(results));
            return;
        }
        // Single screenshot
        console.log(pc.yellow(`📸 Taking screenshot (${viewport.width}x${viewport.height})...`));
        const hideSelectors = options.hide ? options.hide.split(',') : [];
        const result = await takeScreenshot(url, {
            viewport,
            fullPage: options.fullPage,
            waitForSelector: options.waitFor,
            delay: parseInt(options.delay || '0', 10),
            hideSelectors,
            outputPath: options.output
                ? join(options.output, `screenshot-${Date.now()}.png`)
                : undefined
        });
        console.log(pc.green('✅ Screenshot captured'));
        console.log(`   Path: ${result.path}`);
        console.log(`   Size: ${(result.size / 1024).toFixed(1)} KB`);
        console.log(`   Viewport: ${result.viewport.width}x${result.viewport.height}`);
    }
    catch (error) {
        console.error(pc.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=browse.js.map