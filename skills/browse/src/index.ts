/**
 * Browse skill - Browser automation with Playwright
 */
import { chromium, Page, ViewportSize } from 'playwright';
import { Logger, ensureDir } from '@nko/superpowers-shared';
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

function parseArgs(): { url: string; options: BrowseOptions } {
  const args = process.argv.slice(2);
  const url = args[0];
  const options: BrowseOptions = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--full-page':
        options.fullPage = true;
        break;
      case '--element':
        options.element = args[++i];
        break;
      case '--viewport':
        options.viewport = args[++i] as BrowseOptions['viewport'];
        break;
      case '--width':
        options.width = args[++i];
        break;
      case '--height':
        options.height = args[++i];
        break;
      case '--actions':
        options.actions = args[++i];
        break;
      case '--wait-for':
        options.waitFor = args[++i];
        break;
      case '--base64':
        options.base64 = true;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--timeout':
        options.timeout = args[++i];
        break;
    }
  }

  return { url, options };
}

function parseViewport(options: BrowseOptions): ViewportSize {
  if (options.width && options.height) {
    return {
      width: parseInt(options.width, 10),
      height: parseInt(options.height, 10),
    };
  }

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
      await page.evaluate((scrollTo: { x?: number; y?: number }) => {
        (globalThis as unknown as Window).scrollTo(scrollTo.x || 0, scrollTo.y || 0);
      }, { x: action.x, y: action.y });
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

    await page.goto(url, { waitUntil: 'networkidle', timeout });
    spinner.succeed(`Loaded: ${url}`);

    if (options.waitFor) {
      const waitSpinner = logger.spinner(`Waiting for element: ${options.waitFor}`);
      await page.waitForSelector(options.waitFor, { timeout });
      waitSpinner.succeed(`Element found: ${options.waitFor}`);
    }

    const actions = parseActions(options.actions);
    if (actions.length > 0) {
      const actionSpinner = logger.spinner(`Executing ${actions.length} action(s)`);
      for (const action of actions) {
        await executeAction(page, action);
      }
      actionSpinner.succeed('Actions completed');
    }

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
    }

    if (options.element) {
      const element = page.locator(options.element).first();
      
      if (options.base64) {
        const buffer = await element.screenshot({ type: 'png' });
        return { base64: buffer.toString('base64') };
      } else {
        await element.screenshot({ path: outputPath, type: 'png' });
        return { path: outputPath };
      }
    } else {
      if (options.base64) {
        const buffer = await page.screenshot({ fullPage: options.fullPage, type: 'png' });
        return { base64: buffer.toString('base64') };
      } else {
        await page.screenshot({ path: outputPath, fullPage: options.fullPage, type: 'png' });
        return { path: outputPath };
      }
    }
  } finally {
    await browser.close();
  }
}

export async function main(): Promise<void> {
  const { url, options } = parseArgs();
  
  if (!url) {
    console.error('Error: URL is required');
    process.exit(1);
  }

  try {
    new URL(url);
  } catch {
    console.error(`Error: Invalid URL: ${url}`);
    process.exit(1);
  }

  logger.info(`Starting browser automation for: ${url}`);
  logger.info(`Viewport: ${options.viewport || 'desktop'}`);

  try {
    const result = await captureScreenshot(url, options);

    if (result.base64) {
      console.log('\n--- BASE64_START ---');
      console.log(result.base64);
      console.log('--- BASE64_END ---\n');
      console.log('Screenshot captured (base64 output above)');
      process.exit(0);
    } else if (result.path) {
      const absolutePath = path.resolve(result.path);
      console.log(`Screenshot saved to: ${absolutePath}`);
      process.exit(0);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Screenshot failed: ${message}`);
    process.exit(1);
  }
}

// Run main if this file is executed directly
if (require.main === module) {
  main();
}