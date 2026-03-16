/**
 * Flow execution engine for browser automation
 */
import { chromium } from 'playwright';
/**
 * Execute a single flow
 */
export async function executeFlow(flow, options = {}) {
    const { viewport = { width: 1280, height: 720 }, headless = true, timeout = 30000 } = options;
    const result = {
        flowName: flow.name,
        success: true,
        stepsCompleted: 0,
        totalSteps: flow.steps.length,
        screenshots: [],
        errors: [],
        duration: 0
    };
    const startTime = Date.now();
    let browser;
    try {
        browser = await chromium.launch({ headless });
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        // Set default timeout
        page.setDefaultTimeout(timeout);
        for (let i = 0; i < flow.steps.length; i++) {
            const step = flow.steps[i];
            try {
                await executeStep(page, step, flow.baseUrl, result);
                result.stepsCompleted++;
            }
            catch (error) {
                const errorMsg = `Step ${i + 1} (${step.action}) failed: ${error instanceof Error ? error.message : String(error)}`;
                result.errors.push(errorMsg);
                result.success = false;
                break;
            }
        }
    }
    catch (error) {
        result.success = false;
        result.errors.push(`Flow initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    finally {
        if (browser) {
            await browser.close();
        }
        result.duration = Date.now() - startTime;
    }
    return result;
}
/**
 * Execute a single step
 */
async function executeStep(page, step, baseUrl, result) {
    switch (step.action) {
        case 'navigate': {
            const url = step.target?.startsWith('http')
                ? step.target
                : `${baseUrl}${step.target || ''}`;
            await page.goto(url, { waitUntil: 'networkidle' });
            break;
        }
        case 'click': {
            if (!step.target)
                throw new Error('Click action requires target selector');
            await page.locator(step.target).click();
            break;
        }
        case 'type': {
            if (!step.target)
                throw new Error('Type action requires target selector');
            if (step.value === undefined)
                throw new Error('Type action requires value');
            await page.locator(step.target).fill(step.value);
            break;
        }
        case 'wait': {
            const delay = step.options?.ms || 1000;
            await page.waitForTimeout(delay);
            break;
        }
        case 'screenshot': {
            const timestamp = Date.now();
            const filename = `flow-${result.flowName}-${timestamp}.png`;
            const path = step.target || filename;
            await page.screenshot({ path, fullPage: step.options?.fullPage ?? true });
            result.screenshots.push(path);
            break;
        }
        case 'scroll': {
            if (step.target) {
                await page.locator(step.target).scrollIntoViewIfNeeded();
            }
            else {
                await page.evaluate(() => {
                    // @ts-expect-error window is available in browser context
                    window.scrollBy(0, window.innerHeight);
                });
            }
            break;
        }
        case 'hover': {
            if (!step.target)
                throw new Error('Hover action requires target selector');
            await page.locator(step.target).hover();
            break;
        }
        default:
            throw new Error(`Unknown action: ${step.action}`);
    }
}
/**
 * Execute multiple flows in sequence
 */
export async function executeFlows(flows, options = {}) {
    const results = [];
    for (const flow of flows) {
        const result = await executeFlow(flow, options);
        results.push(result);
    }
    return results;
}
/**
 * Create a flow from predefined paths
 */
export function createFlowFromPaths(name, baseUrl, paths, options = {}) {
    const { screenshotEach = true } = options;
    const steps = [];
    for (const path of paths) {
        steps.push({ action: 'navigate', target: path });
        if (screenshotEach) {
            steps.push({
                action: 'screenshot',
                options: { fullPage: true }
            });
        }
    }
    return { name, baseUrl, steps };
}
/**
 * Format flow results for display
 */
export function formatFlowResults(results) {
    const lines = ['Flow Execution Results', '======================'];
    for (const result of results) {
        const status = result.success ? '✅' : '❌';
        lines.push(`\n${status} ${result.flowName}`);
        lines.push(`   Steps: ${result.stepsCompleted}/${result.totalSteps}`);
        lines.push(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
        if (result.screenshots.length > 0) {
            lines.push(`   Screenshots: ${result.screenshots.length}`);
        }
        if (result.errors.length > 0) {
            lines.push(`   Errors:`);
            for (const error of result.errors) {
                lines.push(`      - ${error}`);
            }
        }
    }
    const allPassed = results.every(r => r.success);
    lines.push(`\n${allPassed ? '✅' : '❌'} Overall: ${results.filter(r => r.success).length}/${results.length} flows passed`);
    return lines.join('\n');
}
//# sourceMappingURL=flows.js.map