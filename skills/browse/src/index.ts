import { Command } from 'commander';
import { chromium, Browser, Page } from 'playwright';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

interface ViewportPreset {
  width: number;
  height: number;
  deviceScaleFactor: number;
}

interface BrowseOptions {
  viewport?: string;
  fullPage?: boolean;
  output?: string;
  wait?: string;
  selector?: string;
  actions?: string;
  json?: boolean;
}

const VIEWPORT_PRESETS: Record<string, ViewportPreset> = {
  mobile: { width: 375, height: 667, deviceScaleFactor: 2 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
  desktop: { width: 1280, height: 720, deviceScaleFactor: 1 },
  wide: { width: 1920, height: 1080, deviceScaleFactor: 1 }
};

const program = new Command();

program
  .name('browse')
  .description('Browser automation and visual testing with Playwright')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop, wide)', 'desktop')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-o, --output <path>', 'Save screenshot to file path')
  .option('-w, --wait <ms>', 'Wait time in ms after page load', '1000')
  .option('-s, --selector <selector>', 'CSS selector to capture specific element')
  .option('-a, --actions <actions>', 'Comma-separated actions (click:sel,type:sel|text,wait:ms,scroll,hover:sel)')
  .option('-j, --json', 'Output results as JSON', false)
  .action(async (url: string, options: BrowseOptions) => {
    const spinner = ora('Launching browser...').start();
    let browser: Browser | null = null;

    try {
      // Validate URL
      let targetUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        targetUrl = `https://${url}`;
      }

      // Get viewport
      const viewport = VIEWPORT_PRESETS[options.viewport || 'desktop'] || VIEWPORT_PRESETS.desktop;

      // Launch browser
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      spinner.text = `Navigating to ${targetUrl}...`;
      await page.goto(targetUrl, { waitUntil: 'networkidle' });

      // Execute actions if provided
      if (options.actions) {
        spinner.text = 'Executing actions...';
        await executeActions(page, options.actions);
      }

      // Wait
      const waitMs = parseInt(options.wait || '1000', 10);
      await page.waitForTimeout(waitMs);

      // Take screenshot
      spinner.text = 'Capturing screenshot...';
      let screenshotBuffer: Buffer;

      if (options.selector) {
        const element = await page.locator(options.selector).first();
        screenshotBuffer = await element.screenshot();
      } else {
        screenshotBuffer = await page.screenshot({ 
          fullPage: options.fullPage || false 
        });
      }

      const base64Data = screenshotBuffer.toString('base64');

      // Save to file if output specified
      if (options.output) {
        const outputDir = dirname(options.output);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }
        await page.screenshot({ 
          path: options.output,
          fullPage: options.fullPage || false 
        });
      }

      await browser.close();
      browser = null;
      spinner.succeed('Screenshot captured!');

      // Output results
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          url: targetUrl,
          viewport: options.viewport,
          fullPage: options.fullPage || false,
          screenshot: base64Data,
          outputPath: options.output || null
        }, null, 2));
      } else {
        console.log(chalk.green('\n✓ Screenshot captured'));
        console.log(chalk.gray(`  URL: ${targetUrl}`));
        console.log(chalk.gray(`  Viewport: ${viewport.width}x${viewport.height}`));
        if (options.output) {
          console.log(chalk.gray(`  Saved to: ${options.output}`));
        }
        
        // Output base64 for OpenClaw canvas
        console.log(chalk.cyan('\n--- SCREENSHOT_BASE64_START ---'));
        console.log(base64Data);
        console.log(chalk.cyan('--- SCREENSHOT_BASE64_END ---'));
      }

    } catch (error) {
      if (browser) await browser.close();
      spinner.fail('Failed to capture screenshot');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: errorMessage
        }, null, 2));
      } else {
        console.error(chalk.red(`\n✗ Error: ${errorMessage}`));
      }
      
      process.exit(1);
    }
  });

async function executeActions(page: Page, actionsString: string): Promise<void> {
  const actions = actionsString.split(',');
  
  for (const action of actions) {
    const [type, ...params] = action.split(':');
    
    switch (type) {
      case 'click':
        await page.locator(params[0]).first().click();
        break;
        
      case 'type':
        const [selector, text] = params.join(':').split('|');
        await page.locator(selector).first().fill(text);
        break;
        
      case 'wait':
        await page.waitForTimeout(parseInt(params[0], 10));
        break;
        
      case 'scroll':
        await page.mouse.wheel(0, 800);
        break;
        
      case 'hover':
        await page.locator(params[0]).first().hover();
        break;
        
      case 'navigate':
        await page.goto(params.join(':'), { waitUntil: 'networkidle' });
        break;
        
      case 'screenshot':
        // Just a marker, main screenshot happens after all actions
        break;
    }
  }
}

// Show help if no arguments
if (process.argv.length < 3) {
  program.help();
}

program.parse();
