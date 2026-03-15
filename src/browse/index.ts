import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { chromium, Browser, Page, devices } from 'playwright';

interface BrowseOptions {
  viewport?: string;
  fullPage?: boolean;
  selector?: string;
  actions?: string;
  output?: string;
}

interface ViewportConfig {
  width: number;
  height: number;
}

const viewports: Record<string, ViewportConfig> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

interface BrowseAction {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  selector?: string;
  text?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
}

function parseViewport(viewport: string): ViewportConfig {
  if (viewport in viewports) {
    return viewports[viewport];
  }
  // Parse custom dimensions like "800x600"
  const match = viewport.match(/^(\d+)x(\d+)$/);
  if (match) {
    return { width: parseInt(match[1]), height: parseInt(match[2]) };
  }
  return viewports.desktop;
}

function parseActions(actionsJson: string): BrowseAction[] {
  try {
    return JSON.parse(actionsJson) as BrowseAction[];
  } catch {
    console.error(chalk.red('Invalid actions JSON format'));
    return [];
  }
}

async function executeAction(page: Page, action: BrowseAction): Promise<void> {
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
    case 'scroll': {
      const direction = action.direction || 'down';
      const amount = action.amount || 500;
      const scrollMap: Record<string, { x: number; y: number }> = {
        up: { x: 0, y: -amount },
        down: { x: 0, y: amount },
        left: { x: -amount, y: 0 },
        right: { x: amount, y: 0 }
      };
      const scroll = scrollMap[direction] || { x: 0, y: amount };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.evaluate(({ x, y }: { x: number; y: number }) => {
        (globalThis as any).scrollBy(x, y);
      }, scroll);
      break;
    }
    case 'hover':
      if (action.selector) {
        await page.hover(action.selector);
      }
      break;
  }
}

export async function captureScreenshot(
  url: string,
  options: BrowseOptions
): Promise<{ screenshot: string; url: string; viewport: ViewportConfig }> {
  const viewport = options.viewport ? parseViewport(options.viewport) : viewports.desktop;
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    
    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Execute any actions
    if (options.actions) {
      const actions = parseActions(options.actions);
      for (const action of actions) {
        await executeAction(page, action);
      }
    }
    
    // Capture screenshot
    let screenshot: Buffer;
    
    if (options.selector) {
      const element = await page.$(options.selector);
      if (!element) {
        throw new Error(`Element not found: ${options.selector}`);
      }
      screenshot = await element.screenshot({ type: 'png' });
    } else {
      screenshot = await page.screenshot({
        fullPage: options.fullPage || false,
        type: 'png'
      });
    }
    
    return {
      screenshot: screenshot.toString('base64'),
      url,
      viewport
    };
  } finally {
    await browser.close();
  }
}

export const browseCommand = new Command('browse')
  .description('Browser automation with Playwright - capture screenshots and test flows')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <viewport>', 'Viewport preset (mobile, tablet, desktop) or custom WxH', 'desktop')
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-s, --selector <selector>', 'Capture specific element by CSS selector')
  .option('-a, --actions <json>', 'JSON array of actions to perform before capture')
  .option('-o, --output <path>', 'Output file path (defaults to stdout as base64)')
  .action(async (url: string, options: BrowseOptions) => {
    const spinner = ora('Launching browser...').start();
    
    try {
      spinner.text = `Navigating to ${url}...`;
      
      const result = await captureScreenshot(url, options);
      
      spinner.succeed(chalk.green(`Screenshot captured: ${result.viewport.width}x${result.viewport.height}`));
      
      if (options.output) {
        const fs = await import('fs');
        fs.writeFileSync(options.output, result.screenshot, 'base64');
        console.log(chalk.blue(`Screenshot saved to: ${options.output}`));
      } else {
        // Output base64 for Telegram integration
        console.log(result.screenshot);
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
