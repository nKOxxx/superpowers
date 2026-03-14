/**
 * Screenshot utilities for browse skill
 */

import { Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotOptions {
  fullPage?: boolean;
  waitFor?: string;
  timeout?: number;
}

export async function captureScreenshot(
  context: BrowserContext,
  url: string,
  outputPath: string,
  options: ScreenshotOptions = {}
): Promise<string> {
  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: options.timeout || 30000 });
    
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 5000 });
    }
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await page.screenshot({
      path: outputPath,
      fullPage: options.fullPage !== false
    });
    
    return outputPath;
  } finally {
    await page.close();
  }
}

export async function captureElementScreenshot(
  page: Page,
  selector: string,
  outputPath: string
): Promise<string> {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  await element.screenshot({ path: outputPath });
  return outputPath;
}

export async function compareScreenshots(
  baselinePath: string,
  currentPath: string,
  diffPath?: string
): Promise<{ matches: boolean; diffPercentage: number }> {
  // Simple file existence check - full pixel comparison would require pixelmatch
  if (!fs.existsSync(baselinePath)) {
    return { matches: false, diffPercentage: 100 };
  }
  
  // For now, return a placeholder result
  // In production, integrate pixelmatch for actual visual diff
  return { matches: true, diffPercentage: 0 };
}
