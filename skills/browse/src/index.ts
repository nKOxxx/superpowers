import { chromium, Browser, Page } from 'playwright';
import { BrowseOptions, BrowseAction, ScreenshotResult, VIEWPORT_PRESETS, Viewport } from './types.js';

export * from './types.js';

function getViewport(options: BrowseOptions): Viewport {
  if (typeof options.viewport === 'object') {
    return options.viewport;
  }
  return VIEWPORT_PRESETS[options.viewport || 'desktop'];
}

async function executeAction(page: Page, action: BrowseAction): Promise<void> {
  switch (action.type) {
    case 'click':
      if (!action.selector) throw new Error('Click action requires selector');
      await page.click(action.selector);
      break;
    case 'type':
      if (!action.selector || action.text === undefined) {
        throw new Error('Type action requires selector and text');
      }
      await page.fill(action.selector, action.text);
      break;
    case 'wait':
      await page.waitForTimeout(action.duration || 1000);
      break;
    case 'scroll':
      if (action.x !== undefined && action.y !== undefined) {
        await page.evaluate((xy: { x: number; y: number }) => window.scrollTo(xy.x, xy.y), { x: action.x, y: action.y });
      } else {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      }
      break;
    case 'hover':
      if (!action.selector) throw new Error('Hover action requires selector');
      await page.hover(action.selector);
      break;
    case 'press':
      if (!action.key) throw new Error('Press action requires key');
      await page.keyboard.press(action.key);
      break;
  }
}

export async function browse(options: BrowseOptions): Promise<ScreenshotResult> {
  const browser = await chromium.launch({ headless: true });
  const viewport = getViewport(options);
  
  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    // Navigate to URL
    await page.goto(options.url, { 
      waitUntil: 'networkidle',
      timeout: options.timeout || 30000 
    });
    
    // Execute actions if provided
    if (options.actions && options.actions.length > 0) {
      for (const action of options.actions) {
        await executeAction(page, action);
      }
    }
    
    // Take screenshot
    const screenshotOptions: Parameters<Page['screenshot']>[0] = {
      type: 'png'
    };
    
    if (options.fullPage) {
      screenshotOptions.fullPage = true;
    }
    
    if (options.selector) {
      const element = page.locator(options.selector).first();
      const buffer = await element.screenshot({ type: 'png' });
      const base64 = buffer.toString('base64');
      
      return {
        success: true,
        base64,
        viewport,
        url: options.url,
        timestamp: new Date().toISOString()
      };
    }
    
    const buffer = await page.screenshot(screenshotOptions);
    const base64 = buffer.toString('base64');
    
    return {
      success: true,
      base64,
      viewport,
      url: options.url,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      viewport,
      url: options.url,
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

export async function browseToFile(options: BrowseOptions & { outputPath: string }): Promise<ScreenshotResult> {
  const browser = await chromium.launch({ headless: true });
  const viewport = getViewport(options);
  
  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    await page.goto(options.url, { 
      waitUntil: 'networkidle',
      timeout: options.timeout || 30000 
    });
    
    if (options.actions && options.actions.length > 0) {
      for (const action of options.actions) {
        await executeAction(page, action);
      }
    }
    
    const screenshotOptions: Parameters<Page['screenshot']>[0] = {
      path: options.outputPath,
      type: 'png'
    };
    
    if (options.fullPage) {
      screenshotOptions.fullPage = true;
    }
    
    if (options.selector) {
      const element = await page.locator(options.selector).first();
      if (!element) {
        throw new Error(`Element not found: ${options.selector}`);
      }
      await element.screenshot({ path: options.outputPath, type: 'png' });
    } else {
      await page.screenshot(screenshotOptions);
    }
    
    return {
      success: true,
      path: options.outputPath,
      viewport,
      url: options.url,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      viewport,
      url: options.url,
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}
