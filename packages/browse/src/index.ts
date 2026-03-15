import { chromium, type Browser, type Page } from 'playwright';
import chalk from 'chalk';

/**
 * Browse options
 */
export interface BrowseOptions {
  viewport: string;
  width?: string;
  height?: string;
  fullPage: boolean;
  selector?: string;
  output?: string;
  wait: string;
  actions?: string;
}

/**
 * Browse action definition
 */
export interface BrowseAction {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'press' | 'select';
  selector?: string;
  text?: string;
  duration?: number;
  x?: number;
  y?: number;
  key?: string;
  value?: string;
}

/**
 * Viewport presets
 */
export const viewportPresets: Record<string, { width: number; height: number; deviceScaleFactor?: number }> = {
  mobile: { width: 375, height: 667, deviceScaleFactor: 2 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
  desktop: { width: 1920, height: 1080 },
  'mobile-lg': { width: 414, height: 896, deviceScaleFactor: 3 },
  'tablet-lg': { width: 1024, height: 1366, deviceScaleFactor: 2 },
  'desktop-hd': { width: 2560, height: 1440 },
  'desktop-4k': { width: 3840, height: 2160 },
};

/**
 * Main browse command
 */
export async function browseCommand(url: string, options: BrowseOptions): Promise<void> {
  console.log(chalk.blue('🌐 Opening browser...'));
  
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    
    // Determine viewport
    let viewport = viewportPresets[options.viewport] || viewportPresets.desktop;
    if (options.width && options.height) {
      viewport = {
        width: parseInt(options.width, 10),
        height: parseInt(options.height, 10),
      };
    }
    
    const context = await browser.newContext({
      viewport,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    console.log(chalk.blue(`📍 Navigating to ${url}...`));
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait specified time
    const waitTime = parseInt(options.wait, 10);
    if (waitTime > 0) {
      console.log(chalk.gray(`⏳ Waiting ${waitTime}ms...`));
      await page.waitForTimeout(waitTime);
    }
    
    // Execute actions if provided
    if (options.actions) {
      const actions: BrowseAction[] = JSON.parse(options.actions);
      await executeActions(page, actions);
    }
    
    // Take screenshot
    console.log(chalk.blue('📸 Capturing screenshot...'));
    
    let screenshotBuffer: Buffer;
    
    if (options.selector) {
      const element = await page.locator(options.selector).first();
      screenshotBuffer = await element.screenshot({ type: 'png' });
      console.log(chalk.gray(`   Captured element: ${options.selector}`));
    } else {
      screenshotBuffer = await page.screenshot({
        fullPage: options.fullPage,
        type: 'png',
      });
      console.log(chalk.gray(`   Captured ${options.fullPage ? 'full page' : 'viewport'}`));
    }
    
    // Output handling
    if (options.output) {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.output, screenshotBuffer);
      console.log(chalk.green(`✅ Screenshot saved to ${options.output}`));
    } else {
      // Base64 output for integration
      const base64 = screenshotBuffer.toString('base64');
      console.log(chalk.green('✅ Screenshot captured'));
      console.log('\n---BASE64_START---');
      console.log(base64);
      console.log('---BASE64_END---');
    }
    
    await context.close();
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Execute browser actions
 */
async function executeActions(page: Page, actions: BrowseAction[]): Promise<void> {
  console.log(chalk.blue(`🎬 Executing ${actions.length} action(s)...`));
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const actionNum = i + 1;
    
    try {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            console.log(chalk.gray(`  [${actionNum}] Clicking ${action.selector}`));
            await page.locator(action.selector).click();
          }
          break;
          
        case 'type':
          if (action.selector && action.text !== undefined) {
            console.log(chalk.gray(`  [${actionNum}] Typing into ${action.selector}`));
            await page.locator(action.selector).fill(action.text);
          }
          break;
          
        case 'wait':
          const duration = action.duration || 1000;
          console.log(chalk.gray(`  [${actionNum}] Waiting ${duration}ms`));
          await page.waitForTimeout(duration);
          break;
          
        case 'scroll':
          if (action.x !== undefined && action.y !== undefined) {
            console.log(chalk.gray(`  [${actionNum}] Scrolling to (${action.x}, ${action.y})`));
            await page.evaluate(({ x, y }) => window.scrollTo(x, y), { x: action.x, y: action.y });
          } else if (action.selector) {
            console.log(chalk.gray(`  [${actionNum}] Scrolling to element ${action.selector}`));
            await page.locator(action.selector).scrollIntoViewIfNeeded();
          } else {
            console.log(chalk.gray(`  [${actionNum}] Scrolling to bottom`));
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          }
          break;
          
        case 'hover':
          if (action.selector) {
            console.log(chalk.gray(`  [${actionNum}] Hovering over ${action.selector}`));
            await page.locator(action.selector).hover();
          }
          break;
          
        case 'press':
          if (action.selector && action.key) {
            console.log(chalk.gray(`  [${actionNum}] Pressing key ${action.key} on ${action.selector}`));
            await page.locator(action.selector).press(action.key);
          }
          break;
          
        case 'select':
          if (action.selector && action.value) {
            console.log(chalk.gray(`  [${actionNum}] Selecting ${action.value} in ${action.selector}`));
            await page.locator(action.selector).selectOption(action.value);
          }
          break;
          
        default:
          console.log(chalk.yellow(`  [${actionNum}] Unknown action type: ${(action as BrowseAction).type}`));
      }
    } catch (error) {
      console.error(chalk.red(`  [${actionNum}] Action failed:`), error instanceof Error ? error.message : error);
      throw error;
    }
  }
  
  console.log(chalk.green(`✅ Executed ${actions.length} action(s)`));
}
