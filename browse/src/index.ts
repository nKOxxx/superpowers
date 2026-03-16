import { Browser, BrowserContext, Page, chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BrowseOptions, FlowStep, ScreenshotOptions, TestUrlOptions, ViewportPreset } from './types.js';

const VIEWPORT_PRESETS: Record<ViewportPreset, { width: number; height: number }> = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 }
};

export class BrowseSkill {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async init(options: BrowseOptions = {}) {
    this.browser = await chromium.launch({ headless: true });
    const viewport = VIEWPORT_PRESETS[options.viewport || 'desktop'];
    this.context = await this.browser.newContext({ viewport });
    this.page = await this.context.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  async screenshot(url: string, options: ScreenshotOptions = {}): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.goto(url, { waitUntil: 'networkidle' });

    if (options.waitFor) {
      await this.page.waitForSelector(options.waitFor);
    }

    if (options.waitTime) {
      await this.page.waitForTimeout(options.waitTime);
    }

    if (options.hide) {
      for (const selector of options.hide) {
        await this.page.evaluate((sel: string) => {
          const elements = document.querySelectorAll(sel);
          elements.forEach((el: Element) => (el as HTMLElement).style.display = 'none');
        }, selector);
      }
    }

    const outputDir = options.output || './screenshots';
    await fs.mkdir(outputDir, { recursive: true });

    const filename = options.filename || `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    const filepath = path.join(outputDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: options.fullPage || false
    });

    return filepath;
  }

  async testUrl(url: string, options: TestUrlOptions = {}): Promise<{ success: boolean; message: string }> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      const response = await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000
      });

      const status = response?.status() || 0;
      const expectedStatus = options.expectStatus || 200;

      if (status !== expectedStatus) {
        return { success: false, message: `Expected status ${expectedStatus}, got ${status}` };
      }

      if (options.expectText) {
        const content = await this.page.content();
        if (!content.includes(options.expectText)) {
          return { success: false, message: `Text "${options.expectText}" not found` };
        }
      }

      if (options.expectSelector) {
        const element = await this.page.$(options.expectSelector);
        if (!element) {
          return { success: false, message: `Selector "${options.expectSelector}" not found` };
        }
      }

      return { success: true, message: 'All checks passed' };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async click(url: string, selector: string, options: { screenshot?: boolean; waitForNavigation?: boolean } = {}): Promise<{ success: boolean; message: string; screenshotPath?: string }> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.goto(url, { waitUntil: 'networkidle' });

    try {
      if (options.waitForNavigation) {
        await Promise.all([
          this.page.waitForNavigation({ waitUntil: 'networkidle' }),
          this.page.click(selector)
        ]);
      } else {
        await this.page.click(selector);
      }

      let screenshotPath: string | undefined;
      if (options.screenshot) {
        screenshotPath = await this.screenshot(this.page.url(), { filename: 'after-click.png' });
      }

      return { success: true, message: 'Click successful', screenshotPath };
    } catch (error) {
      return { success: false, message: `Click failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async type(url: string, selector: string, text: string, options: { clear?: boolean; submit?: boolean; delay?: number; screenshot?: boolean } = {}): Promise<{ success: boolean; message: string; screenshotPath?: string }> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.page.goto(url, { waitUntil: 'networkidle' });

    try {
      if (options.clear) {
        await this.page.fill(selector, '');
      }

      await this.page.type(selector, text, { delay: options.delay || 0 });

      if (options.submit) {
        await this.page.press(selector, 'Enter');
      }

      let screenshotPath: string | undefined;
      if (options.screenshot) {
        screenshotPath = await this.screenshot(this.page.url(), { filename: 'after-type.png' });
      }

      return { success: true, message: 'Type successful', screenshotPath };
    } catch (error) {
      return { success: false, message: `Type failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async runFlow(flowFile: string): Promise<{ success: boolean; results: string[] }> {
    const content = await fs.readFile(flowFile, 'utf-8');
    const flow: { steps: FlowStep[]; outputDir?: string; viewport?: ViewportPreset } = JSON.parse(content);

    await this.init({ viewport: flow.viewport || 'desktop' });

    const results: string[] = [];
    const outputDir = flow.outputDir || './screenshots';

    try {
      for (const step of flow.steps) {
        switch (step.action) {
          case 'navigate':
            if (!this.page) throw new Error('Browser not initialized');
            await this.page.goto(step.url!, { waitUntil: 'networkidle' });
            results.push(`Navigated to ${step.url}`);
            break;

          case 'click':
            if (!this.page) throw new Error('Browser not initialized');
            await this.page.click(step.selector!);
            results.push(`Clicked ${step.selector}`);
            break;

          case 'type':
            if (!this.page) throw new Error('Browser not initialized');
            await this.page.type(step.selector!, step.text!);
            results.push(`Typed into ${step.selector}`);
            break;

          case 'wait':
            if (!this.page) throw new Error('Browser not initialized');
            await this.page.waitForTimeout(step.time || 1000);
            results.push(`Waited ${step.time}ms`);
            break;

          case 'scroll':
            if (!this.page) throw new Error('Browser not initialized');
            await this.page.evaluate(() => (window as Window).scrollBy(0, (window as Window).innerHeight));
            results.push('Scrolled down');
            break;

          case 'screenshot':
            const filepath = await this.screenshot(this.page!.url(), {
              filename: step.filename,
              output: outputDir
            });
            results.push(`Screenshot saved: ${filepath}`);
            break;
        }
      }

      return { success: true, results };
    } catch (error) {
      return { 
        success: false, 
        results: [...results, `Error: ${error instanceof Error ? error.message : String(error)}`] 
      };
    }
  }
}
