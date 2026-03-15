import { Command } from 'commander';
import { chromium, type Browser, type Page } from 'playwright';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import pc from 'picocolors';
import type { Viewport, ViewportPreset, FlowAction, FlowStep } from '../types/index.js';
import { loadConfig, mergeWithDefaults } from '../lib/config.js';

const VIEWPORT_PRESETS: Record<ViewportPreset, Viewport> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 },
};

interface BrowseOptions {
  viewport?: string;
  width?: string;
  height?: string;
  fullPage?: boolean;
  output?: string;
  flows?: string;
  waitFor?: string;
  actions?: string;
  timeout?: string;
}

export function browseCommand(program: Command): void {
  program
    .command('browse <url>')
    .description('Browser automation and screenshot capture')
    .option('-v, --viewport <name>', 'Viewport preset (mobile, tablet, desktop, wide)', 'desktop')
    .option('-W, --width <pixels>', 'Custom viewport width')
    .option('-H, --height <pixels>', 'Custom viewport height')
    .option('-f, --full-page', 'Capture full page screenshot')
    .option('-o, --output <dir>', 'Output directory for screenshots', './screenshots')
    .option('--flows <names>', 'Comma-separated flow names from config')
    .option('--wait-for <selector>', 'Wait for element before screenshot')
    .option('--actions <actions>', 'Comma-separated actions (click:sel,wait:1000,type:sel|text)')
    .option('-t, --timeout <ms>', 'Navigation timeout', '30000')
    .action(async (url: string, options: BrowseOptions) => {
      try {
        await runBrowse(url, options);
      } catch (error) {
        console.error(pc.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}

async function runBrowse(url: string, options: BrowseOptions): Promise<void> {
  const config = mergeWithDefaults(loadConfig());
  const screenshotDir = resolve(options.output || config.browser.screenshotDir || './screenshots');

  // Ensure output directory exists
  if (!existsSync(screenshotDir)) {
    await mkdir(screenshotDir, { recursive: true });
  }

  // Determine viewport
  let viewport: Viewport;
  if (options.width && options.height) {
    viewport = { width: parseInt(options.width), height: parseInt(options.height) };
  } else if (options.viewport && config.browser.viewports?.[options.viewport]) {
    viewport = config.browser.viewports[options.viewport];
  } else {
    const viewportKey = (options.viewport || config.browser.defaultViewport) as ViewportPreset;
    viewport = VIEWPORT_PRESETS[viewportKey] || VIEWPORT_PRESETS.desktop;
  }

  const headless = process.env.BROWSE_HEADLESS !== 'false';
  const browser = await chromium.launch({ headless });

  console.log(pc.cyan('══════════════════════════════════════════════════'));
  console.log(pc.cyan('Browser Automation'));
  console.log(pc.cyan('══════════════════════════════════════════════════'));
  console.log();

  try {
    if (options.flows) {
      // Run predefined flows
      const flowNames = options.flows.split(',').map(f => f.trim());
      for (const flowName of flowNames) {
        const flow = config.browser.flows?.[flowName];
        if (!flow) {
          console.warn(pc.yellow(`Warning: Flow '${flowName}' not found in config`));
          continue;
        }
        await runFlow(browser, url, flow, viewport, screenshotDir, options);
      }
    } else if (options.actions) {
      // Run custom actions
      const actions = parseActions(options.actions);
      await runActions(browser, url, actions, viewport, screenshotDir, options);
    } else {
      // Simple screenshot
      await captureScreenshot(browser, url, viewport, screenshotDir, options);
    }

    console.log();
    console.log(pc.green('✓ Browser automation completed'));
  } finally {
    await browser.close();
  }
}

async function captureScreenshot(
  browser: Browser,
  url: string,
  viewport: Viewport,
  outputDir: string,
  options: BrowseOptions
): Promise<void> {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  const timeout = parseInt(options.timeout || '30000');
  await page.goto(url, { timeout, waitUntil: 'networkidle' });

  if (options.waitFor) {
    await page.waitForSelector(options.waitFor, { timeout });
  }

  const hostname = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '-');
  const viewportName = `${viewport.width}x${viewport.height}`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${hostname}_${viewportName}_${timestamp}.png`;
  const filepath = join(outputDir, filename);

  await page.screenshot({
    path: filepath,
    fullPage: options.fullPage || false,
  });

  console.log(pc.green(`✓ Screenshot saved: ${filepath}`));

  await context.close();
}

async function runFlow(
  browser: Browser,
  baseUrl: string,
  flow: FlowStep[],
  viewport: Viewport,
  outputDir: string,
  options: BrowseOptions
): Promise<void> {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const timeout = parseInt(options.timeout || '30000');

  for (const step of flow) {
    console.log(pc.blue(`  → ${step.name}`));

    const url = step.url.startsWith('http') ? step.url : new URL(step.url, baseUrl).toString();
    await page.goto(url, { timeout, waitUntil: 'networkidle' });

    if (step.actions) {
      for (const action of step.actions) {
        await executeAction(page, action, timeout);
      }
    }

    const hostname = new URL(baseUrl).hostname.replace(/[^a-zA-Z0-9]/g, '-');
    const stepName = step.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
    const viewportName = `${viewport.width}x${viewport.height}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${hostname}_${stepName}_${viewportName}_${timestamp}.png`;
    const filepath = join(outputDir, filename);

    await page.screenshot({ path: filepath, fullPage: options.fullPage || false });
    console.log(pc.green(`    ✓ ${filepath}`));
  }

  await context.close();
}

async function runActions(
  browser: Browser,
  url: string,
  actions: FlowAction[],
  viewport: Viewport,
  outputDir: string,
  options: BrowseOptions
): Promise<void> {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const timeout = parseInt(options.timeout || '30000');

  await page.goto(url, { timeout, waitUntil: 'networkidle' });

  const screenshots: string[] = [];

  for (const action of actions) {
    if (action.type === 'screenshot') {
      const hostname = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '-');
      const viewportName = `${viewport.width}x${viewport.height}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${hostname}_action_${screenshots.length}_${viewportName}_${timestamp}.png`;
      const filepath = join(outputDir, filename);

      await page.screenshot({ path: filepath, fullPage: options.fullPage || false });
      screenshots.push(filepath);
      console.log(pc.green(`  ✓ Screenshot: ${filepath}`));
    } else {
      await executeAction(page, action, timeout);
    }
  }

  await context.close();
}

async function executeAction(page: Page, action: FlowAction, timeout: number): Promise<void> {
  switch (action.type) {
    case 'click':
      if (action.selector) {
        await page.click(action.selector, { timeout });
      }
      break;
    case 'type':
      if (action.selector && action.text !== undefined) {
        await page.fill(action.selector, action.text, { timeout });
      }
      break;
    case 'wait':
      await page.waitForTimeout(action.delay || 1000);
      break;
    case 'scroll':
      await page.evaluate('window.scrollBy(0, window.innerHeight)');
      break;
    case 'hover':
      if (action.selector) {
        await page.hover(action.selector, { timeout });
      }
      break;
  }
}

function parseActions(actionsStr: string): FlowAction[] {
  return actionsStr.split(',').map(action => {
    const [type, ...params] = action.split(':');

    switch (type) {
      case 'click':
        return { type: 'click', selector: params[0] };
      case 'type':
        const [selector, text] = params.join(':').split('|');
        return { type: 'type', selector, text };
      case 'wait':
        return { type: 'wait', delay: parseInt(params[0]) || 1000 };
      case 'scroll':
        return { type: 'scroll' };
      case 'hover':
        return { type: 'hover', selector: params[0] };
      case 'screenshot':
        return { type: 'screenshot' };
      default:
        return { type: 'wait', delay: 1000 };
    }
  });
}
