import { chromium, Browser, Page } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join, parse } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, VIEWPORT_PRESETS, formatDate } from '../utils/config.js';
import { printHeader, printSuccess, printError, printInfo } from '../utils/format.js';

export interface BrowseOptions {
  viewport: string;
  width?: string;
  height?: string;
  fullPage: boolean;
  output: string;
  waitFor?: string;
  actions?: string;
  timeout: string;
}

interface Action {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'screenshot';
  selector?: string;
  text?: string;
  delay?: number;
}

function parseActions(actionsStr: string): Action[] {
  if (!actionsStr) return [];
  
  return actionsStr.split(',').map(part => {
    const [type, ...params] = part.split(':');
    
    switch (type) {
      case 'click':
        return { type: 'click', selector: params[0] };
      case 'type': {
        const [selector, text] = params.join(':').split('|');
        return { type: 'type', selector, text };
      }
      case 'wait':
        return { type: 'wait', delay: parseInt(params[0], 10) };
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

async function executeActions(page: Page, actions: Action[], outputDir: string, hostname: string): Promise<void> {
  let screenshotCount = 0;
  
  for (const action of actions) {
    switch (action.type) {
      case 'click':
        if (action.selector) {
          await page.click(action.selector);
        }
        break;
      case 'type':
        if (action.selector && action.text) {
          await page.fill(action.selector, action.text);
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
          await page.hover(action.selector);
        }
        break;
      case 'screenshot':
        screenshotCount++;
        const screenshotPath = join(outputDir, `${hostname}_action-${screenshotCount}_${formatDate()}.png`);
        await page.screenshot({ path: screenshotPath });
        printSuccess(`Action screenshot: ${screenshotPath}`);
        break;
    }
  }
}

export async function browseCommand(url: string, options: BrowseOptions): Promise<void> {
  printHeader('Browser Automation');
  
  const config = loadConfig();
  const spinner = ora('Launching browser...').start();
  
  let browser: Browser | null = null;
  
  try {
    // Parse viewport
    let viewport = VIEWPORT_PRESETS[options.viewport] || VIEWPORT_PRESETS.desktop;
    
    if (options.width && options.height) {
      viewport = {
        width: parseInt(options.width, 10),
        height: parseInt(options.height, 10)
      };
    } else if (config.browser?.viewports?.[options.viewport]) {
      viewport = config.browser.viewports[options.viewport];
    }
    
    // Ensure output directory exists
    if (!existsSync(options.output)) {
      mkdirSync(options.output, { recursive: true });
    }
    
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    spinner.text = `Navigating to ${url}...`;
    
    // Navigate
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: parseInt(options.timeout, 10)
    });
    
    // Wait for specific element if requested
    if (options.waitFor) {
      spinner.text = `Waiting for ${options.waitFor}...`;
      await page.waitForSelector(options.waitFor, { timeout: 10000 });
    }
    
    // Execute custom actions if provided
    if (options.actions) {
      spinner.text = 'Executing actions...';
      const actions = parseActions(options.actions);
      const hostname = parse(new URL(url).hostname).name;
      await executeActions(page, actions, options.output, hostname);
    }
    
    spinner.text = 'Capturing screenshot...';
    
    // Generate filename
    const hostname = parse(new URL(url).hostname).name;
    const viewportName = options.width ? `${viewport.width}x${viewport.height}` : options.viewport;
    const filename = `${hostname}_${viewportName}_${formatDate()}.png`;
    const filepath = join(options.output, filename);
    
    // Capture screenshot
    await page.screenshot({
      path: filepath,
      fullPage: options.fullPage
    });
    
    spinner.stop();
    
    printSuccess(`Screenshot saved: ${filepath}`);
    printInfo(`Viewport: ${viewport.width}x${viewport.height}`);
    printInfo(`Full page: ${options.fullPage ? 'Yes' : 'No'}`);
    
  } catch (error) {
    spinner.stop();
    printError(`Browser automation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}