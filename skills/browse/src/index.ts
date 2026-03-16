import { chromium, type Browser, type Page } from 'playwright';
import chalk from 'chalk';

interface BrowseOptions {
  viewport: string;
  width?: number;
  height?: number;
  fullPage: boolean;
  selector?: string;
  output?: string;
  wait: number;
  actions?: string;
}

interface BrowseAction {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'navigate' | 'screenshot';
  selector?: string;
  text?: string;
  duration?: number;
  x?: number;
  y?: number;
  url?: string;
}

const viewportPresets: Record<string, { width: number; height: number; deviceScaleFactor: number }> = {
  mobile: { width: 375, height: 667, deviceScaleFactor: 2 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
  desktop: { width: 1280, height: 720, deviceScaleFactor: 1 },
  wide: { width: 1920, height: 1080, deviceScaleFactor: 1 },
};

export async function browse(options: BrowseOptions & { url: string }): Promise<{ success: boolean; base64?: string; error?: string }> {
  const { url, ...browseOptions } = options;
  return browseCommand(url, browseOptions);
}

export async function browseCommand(url: string, options: BrowseOptions): Promise<{ success: boolean; base64?: string; error?: string }> {
  console.log(chalk.blue('🌐 Opening browser...'));
  
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    
    // Determine viewport
    let viewport = viewportPresets[options.viewport] || viewportPresets.desktop;
    if (options.width && options.height) {
      viewport = {
        width: options.width,
        height: options.height,
        deviceScaleFactor: 1,
      };
    }
    
    const context = await browser.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
      deviceScaleFactor: viewport.deviceScaleFactor,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    console.log(chalk.blue(`📍 Navigating to ${url}...`));
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait specified time
    if (options.wait > 0) {
      await page.waitForTimeout(options.wait);
    }
    
    // Execute actions if provided
    if (options.actions) {
      let actions: BrowseAction[];
      try {
        actions = JSON.parse(options.actions);
      } catch {
        // Try parsing as simple string format
        actions = parseActionsString(options.actions);
      }
      await executeActions(page, actions);
    }
    
    // Take screenshot
    console.log(chalk.blue('📸 Capturing screenshot...'));
    
    let screenshotBuffer: Buffer;
    
    if (options.selector) {
      const element = await page.locator(options.selector).first();
      screenshotBuffer = await element.screenshot({ type: 'png' });
    } else {
      screenshotBuffer = await page.screenshot({
        fullPage: options.fullPage,
        type: 'png',
      });
    }
    
    // Output handling
    const base64 = screenshotBuffer.toString('base64');
    
    if (options.output) {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.output, screenshotBuffer);
      console.log(chalk.green(`✅ Screenshot saved to ${options.output}`));
    } else {
      // Base64 output for Telegram integration
      console.log(chalk.green('✅ Screenshot captured'));
      console.log('\n---BASE64_START---');
      console.log(base64);
      console.log('---BASE64_END---');
    }
    
    await context.close();
    
    return { success: true, base64 };
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function parseActionsString(actionsStr: string): BrowseAction[] {
  // Parse simple action format: "click:.btn,wait:1000,type:#input|hello"
  const actions: BrowseAction[] = [];
  const parts = actionsStr.split(',');
  
  for (const part of parts) {
    const [type, ...rest] = part.split(':');
    const value = rest.join(':');
    
    switch (type) {
      case 'click':
        actions.push({ type: 'click', selector: value });
        break;
      case 'type': {
        const [selector, text] = value.split('|');
        actions.push({ type: 'type', selector, text });
        break;
      }
      case 'wait':
        actions.push({ type: 'wait', duration: parseInt(value, 10) });
        break;
      case 'scroll':
        actions.push({ type: 'scroll' });
        break;
      case 'hover':
        actions.push({ type: 'hover', selector: value });
        break;
      case 'navigate':
        actions.push({ type: 'navigate', url: value });
        break;
      case 'screenshot':
        actions.push({ type: 'screenshot' });
        break;
    }
  }
  
  return actions;
}

async function executeActions(page: Page, actions: BrowseAction[]): Promise<void> {
  console.log(chalk.blue(`🎬 Executing ${actions.length} action(s)...`));
  
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            console.log(chalk.gray(`  Clicking ${action.selector}`));
            await page.locator(action.selector).click();
          }
          break;
          
        case 'type':
          if (action.selector && action.text !== undefined) {
            console.log(chalk.gray(`  Typing into ${action.selector}`));
            await page.locator(action.selector).fill(action.text);
          }
          break;
          
        case 'wait': {
          const duration = action.duration || 1000;
          console.log(chalk.gray(`  Waiting ${duration}ms`));
          await page.waitForTimeout(duration);
          break;
        }
          
        case 'scroll':
          if (action.x !== undefined && action.y !== undefined) {
            console.log(chalk.gray(`  Scrolling to (${action.x}, ${action.y})`));
            await page.evaluate((coords: { x: number; y: number }) => {
              (globalThis as any).window.scrollTo(coords.x, coords.y);
            }, { x: action.x, y: action.y });
          } else {
            console.log(chalk.gray('  Scrolling to bottom'));
            await page.evaluate(() => {
              const w = globalThis as any;
              w.window.scrollTo(0, w.document.body.scrollHeight);
            });
          }
          break;
          
        case 'hover':
          if (action.selector) {
            console.log(chalk.gray(`  Hovering over ${action.selector}`));
            await page.locator(action.selector).hover();
          }
          break;
          
        case 'navigate':
          if (action.url) {
            console.log(chalk.gray(`  Navigating to ${action.url}`));
            await page.goto(action.url, { waitUntil: 'networkidle' });
          }
          break;
          
        case 'screenshot':
          console.log(chalk.gray('  Taking screenshot'));
          // Screenshot will be taken at the end anyway
          break;
          
        default:
          console.log(chalk.yellow(`  Unknown action type: ${action.type}`));
      }
    } catch (error) {
      console.log(chalk.yellow(`  ⚠️ Action failed: ${error instanceof Error ? error.message : error}`));
    }
  }
}

export async function flow(options: {
  url: string;
  actions: BrowseAction[];
  viewport: string;
  output?: string;
}): Promise<{ success: boolean; base64?: string; error?: string }> {
  return browseCommand(options.url, {
    viewport: options.viewport,
    fullPage: false,
    wait: 1000,
    actions: JSON.stringify(options.actions),
    output: options.output,
  });
}
