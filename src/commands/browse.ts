import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { readFileSync } from 'fs';

interface ViewportPreset { width: number; height: number; }
const VIEWPORT_PRESETS: Record<string, ViewportPreset> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

interface ActionStep {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  selector?: string; text?: string; delay?: number; x?: number; y?: number;
}

interface FlowConfig { url: string; viewport?: string; actions: ActionStep[]; }

interface ScreenshotOptions {
  url: string; viewport?: string; fullPage?: boolean; selector?: string; flow?: string;
}

async function captureScreenshot(options: ScreenshotOptions): Promise<string> {
  const spinner = ora('Launching browser...').start();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const viewport = VIEWPORT_PRESETS[options.viewport || 'desktop'] || VIEWPORT_PRESETS.desktop;
    context = await browser.newContext({ viewport, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
    page = await context.newPage();
    spinner.text = `Navigating to ${options.url}...`;
    await page.goto(options.url, { waitUntil: 'networkidle', timeout: 30000 });
    if (options.flow) {
      spinner.text = 'Executing flow...';
      const flowConfig: FlowConfig = JSON.parse(readFileSync(options.flow, 'utf-8'));
      for (const action of flowConfig.actions) await executeAction(page, action);
    }
    spinner.text = 'Capturing screenshot...';
    let screenshotBuffer: Buffer;
    if (options.selector) {
      const element = await page.locator(options.selector).first();
      screenshotBuffer = await element.screenshot({ type: 'png' });
    } else {
      screenshotBuffer = await page.screenshot({ fullPage: options.fullPage || false, type: 'png' });
    }
    const base64Image = screenshotBuffer.toString('base64');
    spinner.succeed(chalk.green('Screenshot captured!'));
    return base64Image;
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

async function executeAction(page: Page, action: ActionStep): Promise<void> {
  switch (action.type) {
    case 'click': if (action.selector) await page.click(action.selector); break;
    case 'type':
      if (action.selector && action.text !== undefined) await page.fill(action.selector, action.text);
      break;
    case 'wait': await page.waitForTimeout(action.delay || 1000); break;
    case 'scroll':
      if (action.x !== undefined && action.y !== undefined) {
        // @ts-ignore - Runs in browser context via page.evaluate()
        await page.evaluate(({ x, y }) => window.scrollTo(x, y), { x: action.x, y: action.y });
      } else {
        // @ts-ignore - Runs in browser context via page.evaluate()
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      }
      break;
    case 'hover': if (action.selector) await page.hover(action.selector); break;
  }
}

function validateUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return `https://${url}`;
  return url;
}

export const browseCommand = new Command('browse')
  .description('Browser automation with Playwright')
  .argument('<url>', 'URL to capture')
  .option('-v, --viewport <preset>', 'Viewport (mobile, tablet, desktop)', 'desktop')
  .option('-f, --full-page', 'Full page screenshot')
  .option('-s, --selector <selector>', 'Element selector')
  .option('--flow <path>', 'Flow config JSON')
  .action(async (url: string, options) => {
    try {
      const base64Image = await captureScreenshot({ 
        url: validateUrl(url), 
        viewport: options.viewport, 
        fullPage: options.fullPage, 
        selector: options.selector, 
        flow: options.flow 
      });
      console.log(`\n${chalk.cyan('=== BASE64 ===')}\n${base64Image}\n${chalk.cyan('=== END ===')}\n`);
    } catch { 
      process.exit(1); 
    }
  });

browseCommand.command('flow')
  .description('Execute flow test')
  .argument('<config>', 'Config path')
  .action(async (configPath: string) => {
    try {
      const flowConfig: FlowConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      const base64Image = await captureScreenshot({ 
        url: validateUrl(flowConfig.url), 
        viewport: flowConfig.viewport, 
        flow: configPath 
      });
      console.log(`\n${chalk.cyan('=== BASE64 ===')}\n${base64Image}\n${chalk.cyan('=== END ===')}\n`);
    } catch { 
      process.exit(1); 
    }
  });

browseCommand.command('presets')
  .description('Show viewport presets')
  .action(() => {
    console.log(chalk.cyan('Viewport Presets:'));
    for (const [name, dim] of Object.entries(VIEWPORT_PRESETS)) {
      console.log(`  ${chalk.yellow(name)} ${dim.width}x${dim.height}`);
    }
  });
