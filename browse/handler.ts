import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Types
interface ViewportPreset {
  width: number;
  height: number;
  deviceScaleFactor: number;
  userAgent: string;
}

interface ViewportPresets {
  [key: string]: ViewportPreset;
}

interface FlowAction {
  action: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'waitForSelector' | 'screenshot';
  selector?: string;
  text?: string;
  ms?: number;
  fullPage?: boolean;
}

interface BrowseOptions {
  url: string;
  viewport?: string;
  fullPage?: boolean;
  selector?: string;
  flow?: FlowAction[];
  waitFor?: string;
  timeout?: number;
  outputPath?: string;
}

interface SkillContext {
  args: string[];
  options: Record<string, string | boolean>;
  channel?: string;
  userId?: string;
}

interface SkillResult {
  success: boolean;
  message: string;
  data?: {
    screenshotPath?: string;
    url?: string;
    viewport?: string;
    duration?: number;
    actionsExecuted?: number;
  };
  error?: string;
}

// Viewport presets
const VIEWPORT_PRESETS: ViewportPresets = {
  mobile: {
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  tablet: {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  },
  desktop: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

// Parse command line arguments
function parseArgs(args: string[]): BrowseOptions {
  const options: BrowseOptions = {
    url: '',
    viewport: 'desktop',
    timeout: 30000
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      
      switch (key) {
        case 'viewport':
          options.viewport = value || 'desktop';
          break;
        case 'full-page':
          options.fullPage = true;
          break;
        case 'selector':
          options.selector = value;
          break;
        case 'flow':
          try {
            options.flow = JSON.parse(value || '[]');
          } catch (e) {
            throw new Error(`Invalid flow JSON: ${e}`);
          }
          break;
        case 'wait-for':
          options.waitFor = value;
          break;
        case 'timeout':
          options.timeout = parseInt(value || '30000', 10);
          break;
        case 'output':
          options.outputPath = value;
          break;
      }
    } else if (!arg.startsWith('-') && !options.url) {
      options.url = arg;
    }
  }

  if (!options.url) {
    throw new Error('URL is required. Usage: /browse <url> [options]');
  }

  // Ensure URL has protocol
  if (!options.url.startsWith('http://') && !options.url.startsWith('https://')) {
    options.url = 'https://' + options.url;
  }

  return options;
}

// Execute flow actions
async function executeFlow(page: Page, actions: FlowAction[], timeout: number): Promise<number> {
  let executed = 0;
  
  for (const action of actions) {
    switch (action.action) {
      case 'click':
        if (!action.selector) throw new Error('Click action requires selector');
        await page.click(action.selector, { timeout });
        break;
        
      case 'type':
        if (!action.selector || !action.text) {
          throw new Error('Type action requires selector and text');
        }
        await page.fill(action.selector, action.text, { timeout });
        break;
        
      case 'wait':
        await page.waitForTimeout(action.ms || 1000);
        break;
        
      case 'scroll':
        if (action.selector) {
          await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, action.selector);
        } else {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        }
        await page.waitForTimeout(500);
        break;
        
      case 'hover':
        if (!action.selector) throw new Error('Hover action requires selector');
        await page.hover(action.selector, { timeout });
        break;
        
      case 'waitForSelector':
        if (!action.selector) throw new Error('waitForSelector action requires selector');
        await page.waitForSelector(action.selector, { timeout });
        break;
        
      case 'screenshot':
        // Handled separately
        break;
    }
    executed++;
  }
  
  return executed;
}

// Main handler function
export async function handler(context: SkillContext): Promise<SkillResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  let context_: BrowserContext | null = null;
  let page: Page | null = null;
  
  try {
    // Parse arguments
    const options = parseArgs(context.args);
    
    // Get viewport preset
    const viewport = VIEWPORT_PRESETS[options.viewport || 'desktop'] || VIEWPORT_PRESETS.desktop;
    
    // Launch browser
    const headless = process.env.BROWSE_HEADLESS !== 'false';
    browser = await chromium.launch({ 
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create context with viewport
    context_ = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      userAgent: viewport.userAgent
    });
    
    page = await context_.newPage();
    
    // Set default timeout
    page.setDefaultTimeout(options.timeout || 30000);
    
    // Navigate to URL
    await page.goto(options.url, { waitUntil: 'networkidle' });
    
    // Wait for specific selector if provided
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: options.timeout });
    }
    
    // Execute flow actions if provided
    let actionsExecuted = 0;
    if (options.flow && options.flow.length > 0) {
      actionsExecuted = await executeFlow(page, options.flow, options.timeout || 30000);
    }
    
    // Generate output path
    const outputDir = options.outputPath || os.tmpdir();
    const timestamp = Date.now();
    const screenshotPath = path.join(outputDir, `browse-${timestamp}.png`);
    
    // Take screenshot
    if (options.selector) {
      // Screenshot specific element
      const element = await page.locator(options.selector).first();
      await element.screenshot({ path: screenshotPath });
    } else {
      // Screenshot page
      await page.screenshot({
        path: screenshotPath,
        fullPage: options.fullPage || false
      });
    }
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      message: `Screenshot captured: ${screenshotPath}`,
      data: {
        screenshotPath,
        url: options.url,
        viewport: options.viewport,
        duration,
        actionsExecuted
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Browse failed: ${errorMessage}`,
      error: errorMessage
    };
  } finally {
    if (context_) await context_.close();
    if (browser) await browser.close();
  }
}

// CLI entry point
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (import.meta.url === `file://${__filename}`) {
  const args = process.argv.slice(2);
  const context: SkillContext = {
    args,
    options: {}
  };
  
  handler(context).then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}
