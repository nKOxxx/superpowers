import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { ViewportSize } from 'playwright-core';

export interface BrowseOptions {
  url: string;
  viewport?: 'mobile' | 'tablet' | 'desktop' | string;
  fullPage?: boolean;
  selector?: string;
  actions?: BrowseAction[];
  outputFormat?: 'base64' | 'file';
  outputPath?: string;
}

export interface BrowseAction {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  selector?: string;
  text?: string;
  delay?: number;
  x?: number;
  y?: number;
}

export interface BrowseResult {
  success: boolean;
  screenshot?: string;
  filePath?: string;
  error?: string;
  duration: number;
  url: string;
  viewport: { width: number; height: number };
}

const VIEWPORTS: Record<string, ViewportSize> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

function parseViewport(viewport: string): ViewportSize {
  if (viewport in VIEWPORTS) {
    return VIEWPORTS[viewport];
  }
  // Parse custom dimensions like "1200x800"
  const match = viewport.match(/(\d+)x(\d+)/);
  if (match) {
    return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
  }
  return VIEWPORTS.desktop;
}

export async function browse(options: BrowseOptions): Promise<BrowseResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    const viewport = options.viewport ? parseViewport(options.viewport) : VIEWPORTS.desktop;
    
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport });
    const page = await context.newPage();

    // Navigate to URL
    await page.goto(options.url, { waitUntil: 'networkidle' });

    // Execute actions if provided
    if (options.actions && options.actions.length > 0) {
      await executeActions(page, options.actions);
    }

    // Determine screenshot target
    let screenshotTarget: Page | ReturnType<Page['locator']> = page;
    if (options.selector) {
      screenshotTarget = page.locator(options.selector);
    }

    // Take screenshot
    const screenshotOptions: { fullPage?: boolean; path?: string; type?: 'png' } = {
      type: 'png',
    };

    if (options.fullPage && !options.selector) {
      screenshotOptions.fullPage = true;
    }

    const screenshot = await screenshotTarget.screenshot(screenshotOptions);
    const duration = Date.now() - startTime;

    if (options.outputFormat === 'file' && options.outputPath) {
      const fs = await import('fs');
      fs.writeFileSync(options.outputPath, screenshot);
      
      return {
        success: true,
        filePath: options.outputPath,
        duration,
        url: options.url,
        viewport,
      };
    }

    return {
      success: true,
      screenshot: screenshot.toString('base64'),
      duration,
      url: options.url,
      viewport,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
      url: options.url,
      viewport: options.viewport ? parseViewport(options.viewport) : VIEWPORTS.desktop,
    };
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

async function executeActions(page: Page, actions: BrowseAction[]): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'click':
        if (action.selector) {
          await page.click(action.selector);
        }
        break;
      case 'type':
        if (action.selector && action.text !== undefined) {
          await page.fill(action.selector, action.text);
        }
        break;
      case 'wait':
        await page.waitForTimeout(action.delay || 1000);
        break;
      case 'scroll':
        if (action.x !== undefined && action.y !== undefined) {
          await page.evaluate(`window.scrollTo(${action.x}, ${action.y})`);
        } else if (action.selector) {
          await page.locator(action.selector).scrollIntoViewIfNeeded();
        }
        break;
      case 'hover':
        if (action.selector) {
          await page.hover(action.selector);
        }
        break;
    }
  }
}