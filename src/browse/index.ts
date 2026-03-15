import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface BrowseOptions {
  url: string;
  viewport?: 'mobile' | 'tablet' | 'desktop' | { width: number; height: number };
  fullPage?: boolean;
  output?: string;
  waitFor?: string;
  actions?: string;
  timeout?: number;
}

const VIEWPORT_PRESETS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 }
};

export class BrowserSkill {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async screenshot(options: BrowseOptions): Promise<string[]> {
    if (!this.browser) {
      await this.init();
    }

    const screenshots: string[] = [];
    const page = await this.browser!.newPage();

    try {
      // Set viewport
      const viewport = this.resolveViewport(options.viewport);
      await page.setViewportSize(viewport);

      // Navigate
      await page.goto(options.url, { 
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000 
      });

      // Wait for element if specified
      if (options.waitFor) {
        await page.waitForSelector(options.waitFor, { timeout: 10000 });
      }

      // Execute actions if provided
      if (options.actions) {
        await this.executeActions(page, options.actions, screenshots, options);
      } else {
        // Single screenshot
        const screenshotPath = await this.takeScreenshot(page, options);
        screenshots.push(screenshotPath);
      }

      return screenshots;
    } finally {
      await page.close();
    }
  }

  private resolveViewport(viewport?: BrowseOptions['viewport']): { width: number; height: number } {
    if (!viewport) return VIEWPORT_PRESETS.desktop;
    if (typeof viewport === 'string') {
      return VIEWPORT_PRESETS[viewport] || VIEWPORT_PRESETS.desktop;
    }
    return viewport;
  }

  private async takeScreenshot(page: Page, options: BrowseOptions): Promise<string> {
    const outputDir = options.output || './screenshots';
    await fs.mkdir(outputDir, { recursive: true });

    const url = new URL(options.url);
    const hostname = url.hostname.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${hostname}_${timestamp}.png`;
    const filepath = path.join(outputDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: options.fullPage || false
    });

    return filepath;
  }

  private async executeActions(
    page: Page, 
    actionsStr: string, 
    screenshots: string[],
    options: BrowseOptions
  ): Promise<void> {
    const actions = actionsStr.split(',').map(a => a.trim());

    for (const action of actions) {
      const [type, ...params] = action.split(':');
      
      switch (type) {
        case 'click':
          if (params[0]) {
            await page.click(params[0]);
          }
          break;
        
        case 'type':
          if (params[0] && params[1]) {
            await page.fill(params[0], params[1]);
          }
          break;
        
        case 'wait':
          if (params[0]) {
            const delay = parseInt(params[0], 10);
            await page.waitForTimeout(delay);
          }
          break;
        
        case 'scroll':
          await page.evaluate('window.scrollBy(0, window.innerHeight)');
          break;
        
        case 'hover':
          if (params[0]) {
            await page.hover(params[0]);
          }
          break;
        
        case 'screenshot':
          const screenshotPath = await this.takeScreenshot(page, options);
          screenshots.push(screenshotPath);
          break;
      }
    }
  }

  async captureBase64(options: BrowseOptions): Promise<string> {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser!.newPage();

    try {
      const viewport = this.resolveViewport(options.viewport);
      await page.setViewportSize(viewport);

      await page.goto(options.url, { 
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000 
      });

      if (options.waitFor) {
        await page.waitForSelector(options.waitFor, { timeout: 10000 });
      }

      const screenshot = await page.screenshot({
        fullPage: options.fullPage || false,
        type: 'png'
      });

      return screenshot.toString('base64');
    } finally {
      await page.close();
    }
  }
}

export default BrowserSkill;
