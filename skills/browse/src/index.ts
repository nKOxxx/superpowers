/**
 * Browse skill - Browser automation with Playwright
 */
import { chromium, Browser, Page, ViewportSize } from 'playwright';
import { Logger, parseEnvOptions, exitWithError, exitWithSuccess, ensureDir } from '@nko/superpowers-shared';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger({ prefix: 'browse' });

export interface BrowseOptions {
  fullPage?: boolean;
  element?: string;
  viewport?: 'mobile' | 'tablet' | 'desktop' | string;
  width?: string;
  height?: string;
  actions?: string;
  waitFor?: string;
  base64?: boolean;
  output?: string;
  timeout?: string;
}

const VIEWPORT_PRESETS: Record<string, ViewportSize> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

interface BrowseAction {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  selector?: string;
  text?: string;
  delay?: number;
  x?: number;
  y?: number;
}

function parseViewport(options: BrowseOptions): ViewportSize {
  // Custom dimensions take priority
  if (options.width && options.height) {
    return {
      width: parseInt(options.width, 10),
      height: parseInt(options.height, 10),
    };
  }

  // Use preset
  const preset = options.viewport || 'desktop';
  const viewport = VIEWPORT_PRESETS[preset];
  
  if (!viewport) {
    logger.warn(`Unknown viewport preset: ${preset}, using desktop`);
    return VIEWPORT_PRESETS.desktop;
  }

  return viewport;
}

function parseActions(actionsJson?: string): BrowseAction[] {
  if (!actionsJson) return [];
  
  try {
    const actions = JSON.parse(actionsJson);
    if (!Array.isArray(actions)) {
      throw new Error('Actions must be an array');
    }
    return actions as BrowseAction[];
  } catch (error) {
    logger.warn(`Failed to parse actions: ${error}`);
    return [];
  }
}

async function executeAction(page: Page, action: BrowseAction): Promise<void> {
  const delay = action.delay || 500;

  switch (action.type) {
    case 'click':
      if (!action.selector) throw new Error('Click action requires selector');
      await page.click(action.selector);
      logger.debug(`Clicked: ${action.selector}`);
      break;
    
    case 'type':
      if (!action.selector || !action.text) {
        throw new Error('Type action requires selector and text');
      }
      await page.fill(action.selector, action.text);
      logger.debug(`Typed "${action.text}" into: ${action.selector}`);
      break;
    
    case 'wait':
      await page.waitForTimeout(action.delay || 1000);
      logger.debug(`Waited ${action.delay || 1000}ms`);
      break;
    
    case 'scroll':
      await page.evaluate(({ x, y }) => window.scrollTo(x || 0, y || 0), {
        x: action.x,
        y: action.y,
      });
      logger.debug(`Scrolled to: ${action.x || 0}, ${action.y || 0}`);
      break;
    
    case 'hover':
      if (!action.selector) throw new Error('Hover action requires selector');
      await page.hover(action.selector);
      logger.debug(`Hovered: ${action.selector}`);
      break;
    
    default:
      logger.warn(`Unknown action type: ${(action as BrowseAction).type}`);
  }

  // Small delay after each action
  await page.waitForTimeout(delay);
}

async function captureScreenshot(
  url: string,
  options: BrowseOptions
): Promise<{ path?: string; base64?: string }> {
  const spinner = logger.spinner(`Navigating to ${url}`);
  const browser = await chromium.launch({ headless: true });

  try {
    const viewport = parseViewport(options);
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const timeout = parseInt(options.timeout || '30000', 10);

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle', timeout });
    spinner.succeed(`Loaded: ${url}`);

    // Wait for specific element if requested
    if (options.waitFor) {
      const waitSpinner = logger.spinner(`Waiting for element: ${options.waitFor}`);
      await page.waitForSelector(options.waitFor, { timeout });
      waitSpinner.succeed(`Element found: ${options.waitFor}`);
    }

    // Execute action sequence
    const actions = parseActions(options.actions);
    if (actions.length > 0) {
      const actionSpinner = logger.spinner(`Executing ${actions.length} action(s)`);
      for (const action of actions) {
        await executeAction(page, action);
      }
      actionSpinner.succeed('Actions completed');
    }

    // Determine screenshot options
    let screenshotOptions: { path?: string; fullPage?: boolean; type?: 'png' | 'jpeg'; encoding?: 'base64' } = {
      type: 'png',
    };

    // Handle output path
    let outputPath: string | undefined;
    if (options.output) {
      outputPath = options.output;
    } else if (!options.base64) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const urlSlug = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '_');
      outputPath = `./screenshots/${urlSlug}_${timestamp}.png`;
    }

    if (outputPath) {
      ensureDir(path.dirname(outputPath));
      screenshotOptions.path = outputPath;
    }

    // Handle full page or element screenshot
    if (options.element) {
      const element = await page.locator(options.element).first();
      screenshotOptions.fullPage = false;
      
      if (options.base64) {
        screenshotOptions.encoding = 'base64';
        const base64 = await element.screenshot(screenshotOptions as { encoding: 'base64' });
        return { base64 };
      } else {
        await element.screenshot(screenshotOptions);
        return { path: outputPath };
      }
    } else {
      screenshotOptions.fullPage = options.fullPage;
      
      if (options.base64) {
        screenshotOptions.encoding = 'base64';
        const base64 = await page.screenshot(screenshotOptions as { encoding: 'base64' });
        return { base64 };
      } else {
        await page.screenshot(screenshotOptions);
        return { path: outputPath };
      }
    }
  } finally {
    await browser.close();
  }
}

export async function main(): Promise<void> {
  const url = process.env.SUPERPOWER_URL;
  
  if (!url) {
    exitWithError('Error: URL is required');
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    exitWithError(`Error: Invalid URL: ${url}`);
  }

  const options = parseEnvOptions() as BrowseOptions;
  
  logger.info(`Starting browser automation for: ${url}`);
  logger.info(`Viewport: ${options.viewport || 'desktop'}`);

  try {
    const result = await captureScreenshot(url, options);

    if (result.base64) {
      // Output base64 for Telegram integration
      console.log('\n--- BASE64_START ---');
      console.log(result.base64);
      console.log('--- BASE64_END ---\n');
      exitWithSuccess('Screenshot captured (base64 output above)');
    } else if (result.path) {
      const absolutePath = path.resolve(result.path);
      exitWithSuccess(`Screenshot saved to: ${absolutePath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    exitWithError(`Screenshot failed: ${message}`);
  }
}