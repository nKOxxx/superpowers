import { chromium, type Browser, type Page } from 'playwright';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

interface ScreenshotOptions {
  viewport: string;
  width?: number;
  height?: number;
  output: string;
  filename?: string;
  fullPage?: boolean;
  waitFor?: string;
  waitTime?: number;
  hide?: string[];
  darkMode?: boolean;
}

const viewports: Record<string, { width: number; height: number }> = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
};

export async function screenshot(url: string, options: ScreenshotOptions): Promise<void> {
  console.log(chalk.blue('📸 Taking screenshot of'), chalk.cyan(url));
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      viewport: options.width && options.height 
        ? { width: options.width, height: options.height }
        : viewports[options.viewport] || viewports.desktop,
      colorScheme: options.darkMode ? 'dark' : 'light',
    });
    
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Hide elements if specified
    if (options.hide && options.hide.length > 0) {
      for (const selector of options.hide) {
        await page.evaluate((sel: string) => {
          const elements = document.querySelectorAll(sel);
          elements.forEach((el: Element) => ((el as HTMLElement).style.display = 'none'));
        }, selector);
      }
    }
    
    // Wait for element if specified
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 30000 });
    }
    
    // Wait for time if specified
    if (options.waitTime) {
      await page.waitForTimeout(options.waitTime);
    }
    
    // Ensure output directory exists
    await fs.mkdir(options.output, { recursive: true });
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.filename || `screenshot-${timestamp}.png`;
    const outputPath = path.join(options.output, filename);
    
    await page.screenshot({
      path: outputPath,
      fullPage: options.fullPage || false,
    });
    
    console.log(chalk.green('✓ Screenshot saved:'), chalk.cyan(outputPath));
  } finally {
    await browser.close();
  }
}
