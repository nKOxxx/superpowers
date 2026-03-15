import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { BrowseOptions, Viewport, ViewportPreset, BrowserAction } from '../types/index.js';
import { Logger, ensureDir, formatTimestamp, sanitizeFilename, loadConfig } from '../utils/index.js';

const VIEWPORTS: Record<ViewportPreset, Viewport> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 }
};

export class BrowseSkill {
  private logger: Logger;
  private config: any;

  constructor(verbose = false) {
    this.logger = new Logger(verbose);
    this.config = loadConfig();
  }

  async run(options: BrowseOptions): Promise<string[]> {
    this.logger.header('Browse - Browser Automation');
    
    const screenshots: string[] = [];
    const browser = await chromium.launch({ headless: true });
    
    try {
      const viewport = this.resolveViewport(options.viewport);
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      this.logger.info(`Navigating to ${options.url}`);
      
      await page.goto(options.url, { 
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000 
      });

      // Wait for specific element if requested
      if (options.waitFor) {
        this.logger.info(`Waiting for element: ${options.waitFor}`);
        await page.waitForSelector(options.waitFor, { timeout: 10000 });
      }

      // Execute actions if provided
      if (options.actions && options.actions.length > 0) {
        await this.executeActions(page, options.actions);
      }

      // Take screenshot
      const outputDir = options.outputDir || './screenshots';
      ensureDir(outputDir);

      const hostname = sanitizeFilename(new URL(options.url).hostname);
      const viewportName = this.getViewportName(options.viewport);
      const timestamp = formatTimestamp();
      const filename = `${hostname}_${viewportName}_${timestamp}.png`;
      const filepath = path.join(outputDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: options.fullPage || false
      });

      screenshots.push(filepath);
      this.logger.success(`Screenshot saved: ${filepath}`);

    } finally {
      await browser.close();
    }

    return screenshots;
  }

  private resolveViewport(viewport?: ViewportPreset | Viewport): Viewport {
    if (!viewport) return VIEWPORTS.desktop;
    
    if (typeof viewport === 'string') {
      const customViewports = this.config?.browser?.viewports || {};
      return customViewports[viewport] || VIEWPORTS[viewport] || VIEWPORTS.desktop;
    }
    
    return viewport;
  }

  private getViewportName(viewport?: ViewportPreset | Viewport): string {
    if (!viewport) return 'desktop';
    if (typeof viewport === 'string') return viewport;
    return `${viewport.width}x${viewport.height}`;
  }

  private async executeActions(page: Page, actions: BrowserAction[]): Promise<void> {
    this.logger.info('Executing actions...');
    
    for (const action of actions) {
      switch (action.kind) {
        case 'click':
          if (action.selector) {
            await page.click(action.selector);
            this.logger.verboseLog(`Clicked: ${action.selector}`);
          }
          break;
          
        case 'type':
          if (action.selector && action.text) {
            await page.fill(action.selector, action.text);
            this.logger.verboseLog(`Typed in: ${action.selector}`);
          }
          break;
          
        case 'wait':
          await page.waitForTimeout(action.ms || 1000);
          this.logger.verboseLog(`Waited: ${action.ms || 1000}ms`);
          break;
          
        case 'scroll':
          await page.evaluate(() => (window as any).scrollBy(0, (window as any).innerHeight));
          this.logger.verboseLog('Scrolled down');
          break;
          
        case 'hover':
          if (action.selector) {
            await page.hover(action.selector);
            this.logger.verboseLog(`Hovered: ${action.selector}`);
          }
          break;
          
        case 'screenshot':
          // Screenshot handled separately
          break;
      }
    }
  }

  /**
   * Parse action string into BrowserAction array
   * Format: "click:.btn,wait:1000,type:#input|hello"
   */
  static parseActions(actionString: string): BrowserAction[] {
    const actions: BrowserAction[] = [];
    const parts = actionString.split(',');
    
    for (const part of parts) {
      const [kind, ...params] = part.split(':');
      
      switch (kind) {
        case 'click':
          actions.push({ kind: 'click', selector: params[0] });
          break;
        case 'type':
          const [selector, text] = params.join(':').split('|');
          actions.push({ kind: 'type', selector, text });
          break;
        case 'wait':
          actions.push({ kind: 'wait', ms: parseInt(params[0]) || 1000 });
          break;
        case 'scroll':
          actions.push({ kind: 'scroll' });
          break;
        case 'hover':
          actions.push({ kind: 'hover', selector: params[0] });
          break;
        case 'screenshot':
          actions.push({ kind: 'screenshot' });
          break;
      }
    }
    
    return actions;
  }
}
