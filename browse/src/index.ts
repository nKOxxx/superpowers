import { chromium, devices, type Browser, type Page } from 'playwright';
import chalk from 'chalk';
import { readFileSync } from 'fs';

interface BrowseOptions {
  viewport: string;
  width?: string;
  height?: string;
  fullPage: boolean;
  selector?: string;
  output?: string;
  wait: string;
  actions?: string;
}

interface BrowseAction {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  selector?: string;
  text?: string;
  duration?: number;
  x?: number;
  y?: number;
}

const viewportPresets: Record<string, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
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
        width: parseInt(options.width, 10),
        height: parseInt(options.height, 10),
      };
    }
    
    const context = await browser.newContext({
      viewport,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
    
    const page = await context.newPage();
    
    console.log(chalk.blue(`📍 Navigating to ${url}...`));
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait specified time
    const waitTime = parseInt(options.wait, 10);
    if (waitTime > 0) {
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
    } else {
      screenshotBuffer = await page.screenshot({
        fullPage: options.fullPage,
        type: 'png',
      });
    }
    
    // Output handling
    if (options.output) {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.output, screenshotBuffer);
      console.log(chalk.green(`✅ Screenshot saved to ${options.output}`));
    } else {
      // Base64 output for Telegram integration
      const base64 = screenshotBuffer.toString('base64');
      console.log(chalk.green('✅ Screenshot captured'));
      console.log('\n---BASE64_START---');
      console.log(base64);
      console.log('---BASE64_END---');
    }
    
    await context.close();
    
    return { success: true, base64: screenshotBuffer.toString('base64') };
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function executeActions(page: Page, actions: BrowseAction[]): Promise<void> {
  console.log(chalk.blue(`🎬 Executing ${actions.length} action(s)...`));
  
  for (const action of actions) {
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
        
      case 'wait':
        const duration = action.duration || 1000;
        console.log(chalk.gray(`  Waiting ${duration}ms`));
        await page.waitForTimeout(duration);
        break;
        
      case 'scroll':
        if (action.x !== undefined && action.y !== undefined) {
          console.log(chalk.gray(`  Scrolling to (${action.x}, ${action.y})`));
          // @ts-ignore - page.evaluate runs in browser context
          await page.evaluate((coords: { x: number; y: number }) => {
            window.scrollTo(coords.x, coords.y);
          }, { x: action.x, y: action.y });
        } else {
          console.log(chalk.gray('  Scrolling to bottom'));
          // @ts-ignore - page.evaluate runs in browser context
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
        }
        break;
        
      case 'hover':
        if (action.selector) {
          console.log(chalk.gray(`  Hovering over ${action.selector}`));
          await page.locator(action.selector).hover();
        }
        break;
        
      default:
        console.log(chalk.yellow(`  Unknown action type: ${action.type}`));
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
    wait: '1000',
    actions: JSON.stringify(options.actions),
    output: options.output,
  });
}
