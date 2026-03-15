/**
 * Browse Skill - Browser automation with Playwright
 * 
 * Usage: /browse <url> [--viewport=mobile|tablet|desktop] [--full-page] [--actions=<json>]
 */

import { chromium, Browser, Page, ViewportSize } from 'playwright';
import { BrowserOptions, BrowserAction, SkillResult } from '../types.js';
import { success, failure, formatDuration } from '../utils.js';

const VIEWPORTS: Record<string, ViewportSize> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

export class BrowseSkill {
  private browser?: Browser;
  private page?: Page;
  private startTime: number = 0;

  async execute(options: BrowserOptions): Promise<SkillResult> {
    this.startTime = Date.now();
    
    try {
      this.browser = await chromium.launch({ headless: true });
      
      const viewport = this.resolveViewport(options.viewport);
      this.page = await this.browser.newPage({ viewport });

      // Navigate to URL
      await this.page.goto(options.url, { waitUntil: 'networkidle' });

      // Wait if specified
      if (options.waitFor) {
        if (typeof options.waitFor === 'number') {
          await this.page.waitForTimeout(options.waitFor);
        } else {
          await this.page.waitForSelector(options.waitFor);
        }
      }

      // Execute actions if provided
      if (options.actions && options.actions.length > 0) {
        for (const action of options.actions) {
          await this.executeAction(action);
        }
      }

      // Take screenshot
      const screenshot = await this.takeScreenshot(options);
      const duration = formatDuration(Date.now() - this.startTime);

      await this.close();

      return success(
        `✅ Browse completed in ${duration}\n📸 Screenshot captured`,
        { screenshot, url: options.url, viewport }
      );
    } catch (error) {
      await this.close();
      return failure(`Browse failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private resolveViewport(viewport?: BrowserOptions['viewport']): ViewportSize {
    if (!viewport) return VIEWPORTS.desktop;
    if (typeof viewport === 'string') return VIEWPORTS[viewport] || VIEWPORTS.desktop;
    return viewport;
  }

  private async executeAction(action: BrowserAction): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    switch (action.kind) {
      case 'click':
        await this.page.click(action.selector);
        break;
      case 'type':
        await this.page.fill(action.selector, action.text);
        if (action.submit) {
          await this.page.press(action.selector, 'Enter');
        }
        break;
      case 'wait':
        await this.page.waitForTimeout(action.ms);
        break;
      case 'scroll':
        if (action.selector) {
          await this.page.evaluate((sel) => {
            document.querySelector(sel)?.scrollIntoView();
          }, action.selector);
        } else {
          const direction = action.direction === 'up' ? -500 : 500;
          await this.page.evaluate((y) => window.scrollBy(0, y), direction);
        }
        break;
      case 'hover':
        await this.page.hover(action.selector);
        break;
      case 'screenshot':
        if (action.selector) {
          const element = await this.page.$(action.selector);
          if (element) {
            await element.screenshot({ path: action.path || 'element-screenshot.png' });
          }
        } else {
          await this.page.screenshot({ 
            path: action.path || 'screenshot.png',
            fullPage: true 
          });
        }
        break;
      default:
        console.warn(`Unknown action kind: ${(action as any).kind}`);
    }
  }

  private async takeScreenshot(options: BrowserOptions): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const screenshotBuffer = await this.page.screenshot({
      fullPage: options.fullPage ?? false,
      type: 'png'
    });

    return screenshotBuffer.toString('base64');
  }

  private async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
    }
  }
}

// CLI entry point
export async function run(args: string[]): Promise<SkillResult> {
  const options = parseBrowseArgs(args);
  const skill = new BrowseSkill();
  return skill.execute(options);
}

function parseBrowseArgs(args: string[]): BrowserOptions {
  const options: BrowserOptions = { url: '' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (!arg.startsWith('--') && !options.url) {
      options.url = arg;
    } else if (arg === '--viewport' || arg.startsWith('--viewport=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : args[++i];
      if (['mobile', 'tablet', 'desktop'].includes(value)) {
        options.viewport = value as BrowserOptions['viewport'];
      }
    } else if (arg === '--full-page') {
      options.fullPage = true;
    } else if (arg === '--wait-for' || arg.startsWith('--wait-for=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : args[++i];
      const numValue = parseInt(value, 10);
      options.waitFor = isNaN(numValue) ? value : numValue;
    } else if (arg === '--actions') {
      const value = args[++i];
      options.actions = JSON.parse(value);
    }
  }

  if (!options.url) {
    throw new Error('URL is required');
  }

  return options;
}
