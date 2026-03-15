import { chromium, type Browser, type Page } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { BrowseOptions, Viewport, BrowserAction, FlowStep } from '../types/index.js';

const VIEWPORT_PRESETS: Record<string, Viewport> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 },
};

/**
 * Get viewport dimensions
 */
export function getViewport(options: BrowseOptions): Viewport {
  if (options.width && options.height) {
    return { width: options.width, height: options.height };
  }
  
  const preset = options.viewport || 'desktop';
  return VIEWPORT_PRESETS[preset] || VIEWPORT_PRESETS.desktop;
}

/**
 * Parse actions string into action objects
 */
export function parseActions(actionsStr: string): BrowserAction[] {
  const actions: BrowserAction[] = [];
  const parts = actionsStr.split(',');
  
  for (const part of parts) {
    const [type, ...rest] = part.trim().split(':');
    const value = rest.join(':'); // Rejoin in case value contains colons
    
    switch (type) {
      case 'click':
        actions.push({ type: 'click', selector: value });
        break;
      case 'type':
        const [selector, text] = value.split('|');
        actions.push({ type: 'type', selector, text });
        break;
      case 'wait':
        actions.push({ type: 'wait', delay: parseInt(value, 10) });
        break;
      case 'scroll':
        actions.push({ type: 'scroll' });
        break;
      case 'hover':
        actions.push({ type: 'hover', selector: value });
        break;
      case 'screenshot':
        actions.push({ type: 'screenshot' });
        break;
    }
  }
  
  return actions;
}

/**
 * Execute a browser action
 */
export async function executeAction(page: Page, action: BrowserAction): Promise<void> {
  switch (action.type) {
    case 'click':
      if (action.selector) {
        await page.click(action.selector);
      }
      break;
    case 'type':
      if (action.selector && action.text) {
        await page.fill(action.selector, action.text);
      }
      break;
    case 'wait':
      await page.waitForTimeout(action.delay || 1000);
      break;
    case 'scroll':
      await page.evaluate(() => (window as any).scrollBy(0, (window as any).innerHeight));
      break;
    case 'hover':
      if (action.selector) {
        await page.hover(action.selector);
      }
      break;
    case 'screenshot':
      // Screenshot is handled separately
      break;
  }
}

/**
 * Take a screenshot of a URL
 */
export async function takeScreenshot(
  url: string,
  options: BrowseOptions,
  outputName?: string
): Promise<string> {
  const browser = await chromium.launch();
  
  try {
    const viewport = getViewport(options);
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: options.timeout || 30000 
    });
    
    // Wait for specific element if requested
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 10000 });
    }
    
    // Execute custom actions if provided
    if (options.actions) {
      const actions = parseActions(options.actions);
      for (const action of actions) {
        await executeAction(page, action);
      }
    }
    
    // Ensure output directory exists
    const outputDir = options.output || './screenshots';
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate filename
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/\./g, '-');
    const viewportName = options.viewport || `${viewport.width}x${viewport.height}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = outputName || `${hostname}_${viewportName}_${timestamp}.png`;
    const filepath = join(outputDir, filename);
    
    // Ensure directory exists
    const dir = dirname(filepath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Take screenshot
    await page.screenshot({
      path: filepath,
      fullPage: options.fullPage || false,
    });
    
    return filepath;
  } finally {
    await browser.close();
  }
}

/**
 * Run a flow (sequence of steps)
 */
export async function runFlow(
  flow: FlowStep[],
  options: BrowseOptions,
  baseUrl: string
): Promise<string[]> {
  const browser = await chromium.launch();
  const screenshots: string[] = [];
  
  try {
    const viewport = getViewport(options);
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    const outputDir = options.output || './screenshots';
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    for (let i = 0; i < flow.length; i++) {
      const step = flow[i];
      const url = step.url.startsWith('http') ? step.url : `${baseUrl}${step.url}`;
      
      // Navigate
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000 
      });
      
      // Execute actions
      if (step.actions) {
        for (const action of step.actions) {
          await executeAction(page, action);
        }
      }
      
      // Take screenshot
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${step.name.replace(/\s+/g, '_')}_${i}_${timestamp}.png`;
      const filepath = join(outputDir, filename);
      
      await page.screenshot({
        path: filepath,
        fullPage: options.fullPage || false,
      });
      
      screenshots.push(filepath);
    }
    
    return screenshots;
  } finally {
    await browser.close();
  }
}

/**
 * Get screenshot as base64 for Telegram
 */
export async function getScreenshotBase64(
  url: string,
  options: BrowseOptions
): Promise<{ base64: string; filepath: string }> {
  const filepath = await takeScreenshot(url, options);
  const { readFileSync } = await import('fs');
  const imageBuffer = readFileSync(filepath);
  const base64 = imageBuffer.toString('base64');
  return { base64, filepath };
}
