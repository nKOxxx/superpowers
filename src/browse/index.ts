import { chromium, Browser, Page, ViewportSize } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export interface BrowseOptions {
  url: string;
  viewport?: string | ViewportSize;
  fullPage?: boolean;
  selector?: string;
  actions?: Action[];
  outputPath?: string;
}

export interface Action {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  selector?: string;
  text?: string;
  delay?: number;
  x?: number;
  y?: number;
}

const VIEWPORT_PRESETS: Record<string, ViewportSize> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

export class BrowseSkill {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private parseViewport(viewport: string | ViewportSize | undefined): ViewportSize {
    if (!viewport) return VIEWPORT_PRESETS.desktop;
    
    if (typeof viewport === 'string') {
      if (viewport in VIEWPORT_PRESETS) {
        return VIEWPORT_PRESETS[viewport];
      }
      // Parse format like "1200x800"
      const match = viewport.match(/(\d+)x(\d+)/);
      if (match) {
        return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
      }
    }
    
    return viewport as ViewportSize;
  }

  async captureScreenshot(options: BrowseOptions): Promise<{ path: string; base64: string }> {
    if (!this.browser) {
      await this.init();
    }

    const viewport = this.parseViewport(options.viewport);
    
    const context = await this.browser!.newContext({
      viewport,
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    try {
      // Navigate to URL
      await page.goto(options.url, { waitUntil: 'networkidle' });

      // Execute actions if provided
      if (options.actions) {
        await this.executeActions(page, options.actions);
      }

      // Determine screenshot options
      let screenshotOptions: any = {
        type: 'png',
        encoding: 'base64',
      };

      if (options.fullPage) {
        screenshotOptions.fullPage = true;
      } else if (options.selector) {
        const element = await page.$(options.selector);
        if (!element) {
          throw new Error(`Element not found: ${options.selector}`);
        }
        screenshotOptions.clip = await element.boundingBox();
      }

      // Capture screenshot as base64
      const screenshotBuffer = await page.screenshot(screenshotOptions);
      const base64 = screenshotBuffer.toString('base64');

      // Save to file if outputPath provided
      let outputPath = options.outputPath;
      if (!outputPath) {
        const timestamp = Date.now();
        outputPath = path.join(process.cwd(), `screenshot-${timestamp}.png`);
      }

      fs.writeFileSync(outputPath, Buffer.from(base64, 'base64'));

      await context.close();

      return { path: outputPath, base64 };
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  private async executeActions(page: Page, actions: Action[]): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          if (!action.selector) throw new Error('Click action requires selector');
          await page.click(action.selector);
          break;
        case 'type':
          if (!action.selector || !action.text) {
            throw new Error('Type action requires selector and text');
          }
          await page.fill(action.selector, action.text);
          break;
        case 'wait':
          await page.waitForTimeout(action.delay || 1000);
          break;
        case 'scroll':
          await page.evaluate(`window.scrollTo(${action.x || 0}, ${action.y || 0})`);
          break;
        case 'hover':
          if (!action.selector) throw new Error('Hover action requires selector');
          await page.hover(action.selector);
          break;
      }
    }
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  async function main() {
    const url = args[0];
    if (!url) {
      console.error('Usage: browse <url> [options]');
      process.exit(1);
    }

    const options: BrowseOptions = { url };
    
    // Parse arguments
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--viewport=')) {
        options.viewport = arg.split('=')[1];
      } else if (arg === '--full-page') {
        options.fullPage = true;
      } else if (arg.startsWith('--selector=')) {
        options.selector = arg.split('=')[1];
      } else if (arg.startsWith('--output=')) {
        options.outputPath = arg.split('=')[1];
      }
    }

    const skill = new BrowseSkill();
    try {
      await skill.init();
      const result = await skill.captureScreenshot(options);
      console.log(JSON.stringify({ success: true, ...result }, null, 2));
    } catch (error) {
      console.error(JSON.stringify({ success: false, error: (error as Error).message }));
      process.exit(1);
    } finally {
      await skill.close();
    }
  }

  main();
}
