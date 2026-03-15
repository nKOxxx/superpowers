import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { Viewport, BrowseOptions, BrowseAction, FlowOptions, ScreenshotResult } from './types.js';

// Viewport presets
const VIEWPORTS: Record<string, Viewport> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

export const VIEWPORT_PRESETS = VIEWPORTS;

function getViewport(viewport: string | undefined): Viewport {
  if (!viewport) return VIEWPORTS.desktop;
  if (viewport in VIEWPORTS) {
    return VIEWPORTS[viewport];
  }
  // Try parsing as WxH
  const match = viewport.match(/^(\d+)x(\d+)$/);
  if (match) {
    return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
  }
  return VIEWPORTS.desktop;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function browseToFile(options: BrowseOptions): Promise<ScreenshotResult> {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const viewport = typeof options.viewport === 'string' 
      ? getViewport(options.viewport) 
      : (options.viewport || VIEWPORTS.desktop);
    
    context = await browser.newContext({
      viewport,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    page = await context.newPage();
    
    await page.goto(options.url, { waitUntil: 'networkidle', timeout: options.timeout || 30000 });
    
    // Execute actions if provided
    if (options.actions && options.actions.length > 0) {
      for (const action of options.actions) {
        switch (action.type) {
          case 'click':
            if (action.selector) await page.click(action.selector);
            break;
          case 'type':
            if (action.selector && action.text !== undefined) {
              await page.fill(action.selector, action.text);
            }
            break;
          case 'wait':
            await delay(action.duration || 1000);
            break;
          case 'scroll':
            if (action.x !== undefined && action.y !== undefined) {
              await page.evaluate(({ x, y }: { x: number; y: number }) => {
                if (typeof window !== 'undefined') window.scrollTo(x, y);
              }, { x: action.x, y: action.y });
            } else {
              await page.evaluate(() => {
                if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                  window.scrollTo(0, document.body.scrollHeight);
                }
              });
            }
            break;
          case 'hover':
            if (action.selector) await page.hover(action.selector);
            break;
        }
      }
    }
    
    await delay(500);
    
    let screenshot: Buffer;
    
    if (options.selector) {
      const element = await page.locator(options.selector).first();
      screenshot = await element.screenshot({ type: 'png' });
    } else {
      screenshot = await page.screenshot({ 
        fullPage: options.fullPage || false,
        type: 'png' 
      });
    }
    
    const base64 = screenshot.toString('base64');
    let path: string | undefined;
    
    if (options.outputPath) {
      writeFileSync(options.outputPath, screenshot);
      path = options.outputPath;
    }
    
    return {
      success: true,
      base64,
      path,
      viewport,
      url: options.url,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      viewport: typeof options.viewport === 'string' ? getViewport(options.viewport) : (options.viewport || VIEWPORTS.desktop),
      url: options.url,
      timestamp: new Date().toISOString()
    };
  } finally {
    await context?.close();
    await browser?.close();
  }
}

// Re-export browseToFile as browse for compatibility
export const browse = browseToFile;

export async function flow(options: FlowOptions): Promise<string[]> {
  const screenshots: string[] = [];
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const viewport = getViewport(options.viewport);
    
    context = await browser.newContext({ viewport });
    page = await context.newPage();
    
    await page.goto(options.url, { waitUntil: 'networkidle' });
    
    for (let i = 0; i < options.actions.length; i++) {
      const action = options.actions[i];
      
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
          await delay(action.duration || 1000);
          break;
          
        case 'scroll':
          if (action.x !== undefined && action.y !== undefined) {
            await page.evaluate(({ x, y }: { x: number; y: number }) => {
              if (typeof window !== 'undefined') window.scrollTo(x, y);
            }, { x: action.x, y: action.y });
          } else {
            await page.evaluate(() => {
              if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                window.scrollTo(0, document.body.scrollHeight);
              }
            });
          }
          break;
          
        case 'hover':
          if (action.selector) {
            await page.hover(action.selector);
          }
          break;
          
        case 'screenshot':
          const screenshot = await page.screenshot({ type: 'png' });
          if (action.output) {
            writeFileSync(action.output, screenshot);
            screenshots.push(action.output);
          } else {
            screenshots.push(screenshot.toString('base64'));
          }
          break;
      }
      
      // Small delay between actions
      await delay(500);
    }
    
    // Final screenshot if not already captured
    if (options.output && !screenshots.includes(options.output)) {
      const finalScreenshot = await page.screenshot({ type: 'png' });
      writeFileSync(options.output, finalScreenshot);
      screenshots.push(options.output);
    }
    
    return screenshots;
    
  } catch (error) {
    throw error;
  } finally {
    await context?.close();
    await browser?.close();
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const url = args[0];
  
  if (!url) {
    console.error(chalk.red('Usage: browse <url> [--viewport=mobile|tablet|desktop]'));
    process.exit(1);
  }
  
  const viewportArg = args.find(a => a.startsWith('--viewport='))?.split('=')[1] || 'desktop';
  const fullPage = args.includes('--full-page');
  const selector = args.find(a => a.startsWith('--selector='))?.split('=')[1];
  const output = args.find(a => a.startsWith('--output='))?.split('=')[1];
  
  browseToFile({ url, viewport: viewportArg, fullPage, selector, outputPath: output });
}
