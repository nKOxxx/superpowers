import type { Page, Browser, ViewportSize } from 'playwright';
import { chromium, firefox, webkit } from 'playwright';
import { loadConfig, sendTelegramNotification, substituteEnvVars, formatDuration, timestamp, type TelegramConfig } from '@openclaw/superpowers-shared';
import { mkdir } from 'fs/promises';
import { resolve } from 'path';
import chalk from 'chalk';

export interface BrowseConfig {
  browserType?: 'chromium' | 'firefox' | 'webkit';
  defaultViewport?: string;
  viewports?: Record<string, ViewportSize>;
  flows?: Record<string, string[]>;
  selectors?: Record<string, string>;
  telegram?: TelegramConfig;
}

export interface ScreenshotOptions {
  url: string;
  viewport?: string | ViewportSize;
  selector?: string;
  fullPage?: boolean;
  wait?: number;
  outputDir?: string;
  filename?: string;
  browserType?: 'chromium' | 'firefox' | 'webkit';
}

export interface FlowResult {
  name: string;
  screenshots: string[];
  duration: number;
  success: boolean;
  error?: string;
}

const DEFAULT_VIEWPORTS: Record<string, ViewportSize> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  '1440p': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 }
};

export class BrowserAutomation {
  private config: BrowseConfig;
  private browser?: Browser;

  constructor(config?: BrowseConfig) {
    this.config = config || {};
  }

  async init(): Promise<void> {
    const browserType = this.config.browserType || 'chromium';
    const launcher = { chromium, firefox, webkit }[browserType];
    
    this.browser = await launcher.launch({ headless: true });
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }

  async captureScreenshot(options: ScreenshotOptions): Promise<string> {
    if (!this.browser) {
      await this.init();
    }

    const viewport = this.resolveViewport(options.viewport);
    const context = await this.browser!.newContext({ viewport });
    const page = await context.newPage();

    try {
      console.log(chalk.blue(`🌐 Navigating to ${options.url}...`));
      await page.goto(options.url, { waitUntil: 'networkidle' });

      if (options.wait) {
        await page.waitForTimeout(options.wait);
      }

      const outputDir = options.outputDir || './screenshots';
      await mkdir(outputDir, { recursive: true });

      const filename = options.filename || `screenshot-${timestamp()}.png`;
      const filepath = resolve(outputDir, filename);

      let screenshotOptions: Parameters<Page['screenshot']>[0] = {
        path: filepath,
        fullPage: options.fullPage ?? true
      };

      if (options.selector) {
        const element = await page.locator(options.selector).first();
        screenshotOptions = {
          ...screenshotOptions,
          fullPage: false
        };
        await element.screenshot(screenshotOptions);
      } else {
        await page.screenshot(screenshotOptions);
      }

      console.log(chalk.green(`✅ Screenshot saved: ${filepath}`));
      return filepath;
    } finally {
      await context.close();
    }
  }

  async runFlow(flowName: string, baseUrl: string, outputDir?: string): Promise<FlowResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];

    const flows = this.config.flows || {};
    const paths = flows[flowName];

    if (!paths) {
      return {
        name: flowName,
        screenshots: [],
        duration: 0,
        success: false,
        error: `Flow '${flowName}' not found in config`
      };
    }

    try {
      if (!this.browser) {
        await this.init();
      }

      const context = await this.browser!.newContext({
        viewport: this.resolveViewport('desktop')
      });
      const page = await context.newPage();

      for (const path of paths) {
        const url = new URL(path, baseUrl).toString();
        console.log(chalk.blue(`  → ${path}`));
        
        await page.goto(url, { waitUntil: 'networkidle' });
        
        const filename = `${flowName}-${path.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp()}.png`;
        const filepath = await this.captureScreenshot({
          url,
          outputDir: outputDir || './screenshots',
          filename,
          fullPage: true
        });
        
        screenshots.push(filepath);
      }

      await context.close();

      return {
        name: flowName,
        screenshots,
        duration: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      return {
        name: flowName,
        screenshots,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async captureMultipleViewports(
    url: string,
    viewports: string[],
    outputDir?: string
  ): Promise<string[]> {
    const screenshots: string[] = [];

    for (const viewport of viewports) {
      console.log(chalk.cyan(`📱 Viewport: ${viewport}`));
      const filename = `viewport-${viewport}-${timestamp()}.png`;
      const filepath = await this.captureScreenshot({
        url,
        viewport,
        outputDir,
        filename,
        fullPage: true
      });
      screenshots.push(filepath);
    }

    return screenshots;
  }

  private resolveViewport(viewport?: string | ViewportSize): ViewportSize {
    if (typeof viewport === 'object' && viewport !== null) {
      return viewport as ViewportSize;
    }

    const viewports = { ...DEFAULT_VIEWPORTS, ...this.config.viewports };
    return viewports[viewport || this.config.defaultViewport || 'desktop'] || viewports.desktop;
  }
}

export async function browse(options: {
  url: string;
  viewport?: string;
  viewports?: string[];
  flows?: string[];
  selector?: string;
  fullPage?: boolean;
  wait?: number;
  outputDir?: string;
  configPath?: string;
  telegram?: boolean;
}): Promise<void> {
  const rawConfig = loadConfig(options.configPath);
  const config = substituteEnvVars(rawConfig) as { browser?: BrowseConfig; telegram?: TelegramConfig };
  const browserConfig = config.browser || {};

  const automation = new BrowserAutomation(browserConfig);
  const results: { filepath?: string; flow?: FlowResult }[] = [];

  try {
    await automation.init();

    if (options.flows && options.flows.length > 0) {
      for (const flowName of options.flows) {
        console.log(chalk.magenta(`\n🔄 Running flow: ${flowName}`));
        const result = await automation.runFlow(flowName, options.url, options.outputDir);
        results.push({ flow: result });
        
        if (result.success) {
          console.log(chalk.green(`✅ Flow '${flowName}' completed in ${formatDuration(result.duration)}`));
        } else {
          console.log(chalk.red(`❌ Flow '${flowName}' failed: ${result.error}`));
        }
      }
    } else if (options.viewports && options.viewports.length > 0) {
      const screenshots = await automation.captureMultipleViewports(
        options.url,
        options.viewports,
        options.outputDir
      );
      screenshots.forEach(s => results.push({ filepath: s }));
    } else {
      const filepath = await automation.captureScreenshot({
        url: options.url,
        viewport: options.viewport,
        selector: options.selector,
        fullPage: options.fullPage,
        wait: options.wait,
        outputDir: options.outputDir
      });
      results.push({ filepath });
    }

    // Send Telegram notification if requested
    if (options.telegram && config.telegram?.enabled) {
      const successCount = results.filter(r => !r.flow || r.flow.success).length;
      const totalCount = results.length;
      const message = `🌐 **Browse Complete**\n\n` +
        `URL: ${options.url}\n` +
        `Results: ${successCount}/${totalCount} successful\n` +
        `Generated: ${results.filter(r => r.filepath || (r.flow?.screenshots?.length ?? 0) > 0).length} screenshots`;

      await sendTelegramNotification(config.telegram, message);
    }

  } finally {
    await automation.close();
  }
}

export { loadConfig, sendTelegramNotification, formatDuration, timestamp };
