import { chromium } from 'playwright';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

interface TypeOptions {
  selector: string;
  text: string;
  clear?: boolean;
  submit?: boolean;
  delay?: number;
  screenshot?: boolean;
}

export async function type(url: string, options: TypeOptions): Promise<void> {
  console.log(chalk.blue('⌨️  Typing into'), chalk.cyan(url));
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    const field = page.locator(options.selector);
    
    if (options.clear) {
      await field.fill('');
    }
    
    if (options.delay) {
      await field.pressSequentially(options.text, { delay: options.delay });
    } else {
      await field.fill(options.text);
    }
    
    if (options.submit) {
      await field.press('Enter');
    }
    
    console.log(chalk.green('✓ Typed text into:'), chalk.cyan(options.selector));
    
    if (options.screenshot) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `type-${timestamp}.png`;
      await fs.mkdir('./screenshots', { recursive: true });
      const outputPath = path.join('./screenshots', filename);
      await page.screenshot({ path: outputPath });
      console.log(chalk.green('✓ Screenshot saved:'), chalk.cyan(outputPath));
    }
  } finally {
    await browser.close();
  }
}
