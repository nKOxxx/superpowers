#!/usr/bin/env node
/**
 * browse.ts - Browser automation with Playwright
 * 
 * Features:
 * - Screenshot capture (full page, elements, viewports)
 * - Visual regression testing
 * - Accessibility auditing
 * - Mobile/tablet emulation
 * - PDF generation
 * - Telegram integration
 */

import { chromium, firefox, webkit, devices, type Browser, type Page } from 'playwright';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join, basename } from 'path';
import { execSync } from 'child_process';

const program = new Command();

interface BrowseOptions {
  screenshot?: boolean;
  selector?: string;
  viewport?: string;
  mobile?: boolean;
  tablet?: boolean;
  dark?: boolean;
  waitFor?: string;
  delay?: string;
  accessibility?: boolean;
  compare?: string;
  output?: string;
  pdf?: boolean;
  scroll?: boolean;
  interactive?: boolean;
  telegram?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
  timeout?: string;
}

program
  .name('browse')
  .description('Browser automation for visual testing and scraping')
  .argument('<url>', 'URL to browse')
  .option('-s, --screenshot', 'capture screenshot')
  .option('--selector <selector>', 'capture specific element')
  .option('--viewport <wxh>', 'viewport size (e.g., 1920x1080)')
  .option('--mobile', 'emulate mobile device')
  .option('--tablet', 'emulate tablet device')
  .option('--dark', 'force dark mode')
  .option('--wait-for <selector>', 'wait for element')
  .option('--delay <ms>', 'delay before capture')
  .option('-a, --accessibility', 'run accessibility audit')
  .option('-c, --compare <path>', 'compare against baseline')
  .option('-o, --output <dir>', 'output directory', './screenshots')
  .option('--pdf', 'generate PDF')
  .option('--scroll', 'scroll to bottom before capture')
  .option('-i, --interactive', 'keep browser open')
  .option('--telegram', 'send to Telegram')
  .option('--browser <type>', 'browser type', 'chromium')
  .option('--timeout <ms>', 'navigation timeout', '30000')
  .action(async (url: string, options: BrowseOptions) => {
    const spinner = ora('Launching browser...').start();
    
    try {
      // Launch browser
      const browserType = { chromium, firefox, webkit }[options.browser || 'chromium'];
      const browser = await browserType.launch({ 
        headless: !options.interactive 
      });

      // Create context with device emulation if specified
      let contextOptions: any = {
        colorScheme: options.dark ? 'dark' : 'light',
      };

      if (options.mobile) {
        contextOptions = { ...contextOptions, ...devices['iPhone 14 Pro'] };
      } else if (options.tablet) {
        contextOptions = { ...contextOptions, ...devices['iPad Pro'] };
      } else if (options.viewport) {
        const [width, height] = options.viewport.split('x').map(Number);
        contextOptions.viewport = { width, height };
      }

      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();

      // Set timeout
      page.setDefaultTimeout(parseInt(options.timeout || '30000'));

      spinner.text = 'Navigating to ' + url;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Scroll if requested
      if (options.scroll) {
        spinner.text = 'Scrolling page...';
        await autoScroll(page);
      }

      // Wait for element if specified
      if (options.waitFor) {
        spinner.text = `Waiting for ${options.waitFor}`;
        await page.waitForSelector(options.waitFor);
      }

      // Delay if specified
      if (options.delay) {
        await sleep(parseInt(options.delay));
      }

      // Ensure output directory exists
      await mkdir(options.output || './screenshots', { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const domain = new URL(url).hostname.replace(/[^a-z0-9]/gi, '-');

      // Accessibility audit
      if (options.accessibility) {
        spinner.text = 'Running accessibility audit...';
        const violations = await runAccessibilityAudit(page);
        const reportPath = join(options.output || './screenshots', `${domain}-a11y-${timestamp}.json`);
        await writeFile(reportPath, JSON.stringify(violations, null, 2));
        spinner.succeed(chalk.green(`Accessibility report: ${reportPath}`));
        console.log(chalk.yellow(`Found ${violations.length} violations`));
      }

      // Screenshot capture
      if (options.screenshot || options.compare) {
        spinner.text = 'Capturing screenshot...';
        
        let screenshotBuffer: Buffer;
        const screenshotOptions: any = { 
          fullPage: !options.selector,
          type: 'png' 
        };

        if (options.selector) {
          const element = await page.locator(options.selector).first();
          screenshotBuffer = await element.screenshot(screenshotOptions);
        } else {
          screenshotBuffer = await page.screenshot(screenshotOptions);
        }

        const screenshotPath = join(options.output || './screenshots', `${domain}-${timestamp}.png`);
        await writeFile(screenshotPath, screenshotBuffer);
        spinner.succeed(chalk.green(`Screenshot saved: ${screenshotPath}`));

        // Visual comparison
        if (options.compare) {
          spinner.start('Comparing with baseline...');
          if (existsSync(options.compare)) {
            const baseline = await readFile(options.compare);
            const diff = await compareImages(baseline, screenshotBuffer);
            if (diff > 0.1) {
              spinner.warn(chalk.yellow(`Visual diff detected: ${(diff * 100).toFixed(1)}%`));
            } else {
              spinner.succeed(chalk.green('No significant visual changes'));
            }
          } else {
            spinner.warn(chalk.yellow('Baseline not found, saving current as baseline'));
            await writeFile(options.compare, screenshotBuffer);
          }
        }

        // Send to Telegram
        if (options.telegram) {
          spinner.start('Sending to Telegram...');
          await sendToTelegram(screenshotPath, url);
          spinner.succeed('Sent to Telegram');
        }
      }

      // PDF generation
      if (options.pdf) {
        spinner.text = 'Generating PDF...';
        const pdfPath = join(options.output || './screenshots', `${domain}-${timestamp}.pdf`);
        await page.pdf({ 
          path: pdfPath, 
          format: 'A4',
          printBackground: true 
        });
        spinner.succeed(chalk.green(`PDF saved: ${pdfPath}`));
      }

      // Interactive mode
      if (options.interactive) {
        console.log(chalk.cyan('Browser open. Press Ctrl+C to exit.'));
        await new Promise(() => {}); // Keep running
      }

      await browser.close();

    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

// Auto-scroll to bottom
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Simple accessibility audit
async function runAccessibilityAudit(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const violations: any[] = [];
    
    // Check images without alt
    document.querySelectorAll('img:not([alt])').forEach((img, i) => {
      violations.push({
        id: `img-alt-${i}`,
        impact: 'critical',
        description: 'Image missing alt text',
        element: (img as HTMLImageElement).src.slice(0, 100)
      });
    });

    // Check form inputs without labels
    document.querySelectorAll('input:not([aria-label]):not([aria-labelledby]):not([id])').forEach((input, i) => {
      violations.push({
        id: `input-label-${i}`,
        impact: 'critical',
        description: 'Form input missing label',
        element: (input as HTMLInputElement).type
      });
    });

    // Check contrast (simplified)
    document.querySelectorAll('p, span, a, button').forEach((el, i) => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      if (color === bgColor) {
        violations.push({
          id: `contrast-${i}`,
          impact: 'serious',
          description: 'Possible low contrast text',
          element: el.textContent?.slice(0, 50) || ''
        });
      }
    });

    // Check missing lang attribute
    if (!document.documentElement.lang) {
      violations.push({
        id: 'html-lang',
        impact: 'moderate',
        description: 'HTML element missing lang attribute'
      });
    }

    return violations;
  });
}

// Simple image comparison (pixel diff)
async function compareImages(img1: Buffer, img2: Buffer): Promise<number> {
  // In production, use pixelmatch or similar
  // This is a simplified placeholder
  if (img1.length === img2.length) {
    let diff = 0;
    for (let i = 0; i < Math.min(img1.length, img2.length); i++) {
      if (img1[i] !== img2[i]) diff++;
    }
    return diff / img1.length;
  }
  return 1; // Different sizes = 100% diff
}

// Send screenshot to Telegram via OpenClaw
async function sendToTelegram(screenshotPath: string, url: string): Promise<void> {
  try {
    execSync(`openclaw message send --channel telegram --media "${screenshotPath}" --caption "Screenshot: ${url}"`, {
      stdio: 'inherit'
    });
  } catch {
    console.log(chalk.yellow('Failed to send to Telegram. Make sure OpenClaw messaging is configured.'));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

program.parse();
