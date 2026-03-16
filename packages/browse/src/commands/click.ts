import { chromium } from 'playwright';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

interface ClickOptions {
  selector: string;
  screenshot?: boolean;
  waitForNavigation?: boolean;
  viewport: string;
}

const viewports: Record<string, { width: number; height: number }> = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
};

export async function click(url: string, options: ClickOptions): Promise<void> {
  console.log(chalk.blue('🖱️  Clicking element on'), chalk.cyan(url));
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      viewport: viewports[options.viewport] || viewports.desktop,
    });
    
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    if (options.waitForNavigation) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click(options.selector),
      ]);
    } else {
      await page.click(options.selector);
    }
    
    console.log(chalk.green('✓ Clicked element:'), chalk.cyan(options.selector));
    
    if (options.screenshot) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `click-${timestamp}.png`;
      await fs.mkdir('./screenshots', { recursive: true });
      const outputPath = path.join('./screenshots', filename);
      await page.screenshot({ path: outputPath });
      console.log(chalk.green('✓ Screenshot saved:'), chalk.cyan(outputPath));
    }
  } finally {
    await browser.close();
  }
}
