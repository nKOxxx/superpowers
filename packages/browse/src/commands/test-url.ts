import { chromium } from 'playwright';
import chalk from 'chalk';

interface TestUrlOptions {
  expectStatus: number;
  expectText?: string;
  expectSelector?: string;
  timeout: number;
  darkMode?: boolean;
}

export async function testUrl(url: string, options: TestUrlOptions): Promise<boolean> {
  console.log(chalk.blue('🔗 Testing URL:'), chalk.cyan(url));
  
  const browser = await chromium.launch({ headless: true });
  let passed = true;
  
  try {
    const context = await browser.newContext({
      colorScheme: options.darkMode ? 'dark' : 'light',
    });
    
    const page = await context.newPage();
    
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: options.timeout,
    });
    
    // Check status code
    const status = response?.status() || 0;
    if (status !== options.expectStatus) {
      console.log(chalk.red(`✗ Status code mismatch: expected ${options.expectStatus}, got ${status}`));
      passed = false;
    } else {
      console.log(chalk.green(`✓ Status code: ${status}`));
    }
    
    // Check expected text
    if (options.expectText) {
      const content = await page.content();
      if (content.includes(options.expectText)) {
        console.log(chalk.green(`✓ Expected text found: "${options.expectText}"`));
      } else {
        console.log(chalk.red(`✗ Expected text not found: "${options.expectText}"`));
        passed = false;
      }
    }
    
    // Check expected selector
    if (options.expectSelector) {
      const element = await page.$(options.expectSelector);
      if (element) {
        console.log(chalk.green(`✓ Expected selector found: "${options.expectSelector}"`));
      } else {
        console.log(chalk.red(`✗ Expected selector not found: "${options.expectSelector}"`));
        passed = false;
      }
    }
    
    if (passed) {
      console.log(chalk.green('\n✓ All tests passed'));
    } else {
      console.log(chalk.red('\n✗ Some tests failed'));
    }
    
    return passed;
  } finally {
    await browser.close();
  }
}
