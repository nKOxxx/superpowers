import { chromium, Browser, Page, BrowserContext, ViewportSize } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { BrowseOptions, AuditResult, ComparisonResult } from './cli';

declare const window: any;

export class BrowseController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async browse(url: string, options: BrowseOptions): Promise<BrowseResult> {
    await this.ensureBrowser();
    
    const viewport = this.parseViewport(options.viewport);
    await this.createContext(viewport, options.darkMode, options.mobile);
    
    const timeout = parseInt(options.timeout as string, 10) || 30000;
    
    // Navigate to URL
    await this.page!.goto(url, { 
      waitUntil: 'networkidle',
      timeout 
    });

    // Wait for specific element if requested
    if (options.waitFor) {
      await this.page!.waitForSelector(options.waitFor, { timeout });
    }

    const result: BrowseResult = {
      success: true,
      url,
      title: await this.page!.title()
    };

    // Run accessibility audit
    if (options.audit) {
      result.auditResults = await this.runAccessibilityAudit();
    }

    // Capture screenshot
    if (options.screenshot) {
      result.screenshotPath = await this.captureScreenshot(options.output);
    }

    // Compare with baseline
    if (options.compare && result.screenshotPath) {
      result.comparisonResult = await this.compareScreenshots(
        result.screenshotPath,
        options.compare
      );
    }

    return result;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  private async ensureBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true
      });
    }
  }

  private async createContext(
    viewport: ViewportSize,
    darkMode?: boolean,
    mobile?: boolean
  ): Promise<void> {
    const contextOptions: any = {
      viewport,
      deviceScaleFactor: mobile ? 2 : 1
    };

    if (darkMode) {
      contextOptions.colorScheme = 'dark';
    }

    if (mobile) {
      contextOptions.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15';
    }

    this.context = await this.browser!.newContext(contextOptions);
    this.page = await this.context.newPage();
  }

  private parseViewport(viewportStr?: string): ViewportSize {
    if (!viewportStr) {
      return { width: 1280, height: 720 };
    }

    const [width, height] = viewportStr.split('x').map(Number);
    
    if (isNaN(width) || isNaN(height)) {
      throw new Error(`Invalid viewport format: ${viewportStr}. Use WxH (e.g., 1920x1080)`);
    }

    return { width, height };
  }

  private async runAccessibilityAudit(): Promise<AuditResult> {
    // Inject axe-core
    const axeScript = require.resolve('axe-core/axe.min.js');
    const axeSource = fs.readFileSync(axeScript, 'utf-8');
    
    await this.page!.addScriptTag({ content: axeSource });

    // Run audit
    const results = await this.page!.evaluate(() => {
      return new Promise<any>((resolve) => {
        const w = window as any;
        w.axe.run((err: any, auditResults: any) => {
          if (err) throw err;
          resolve(auditResults);
        });
      });
    });

    return {
      violations: results.violations || [],
      passes: results.passes || [],
      incomplete: results.incomplete || []
    };
  }

  private async captureScreenshot(outputDir?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;
    
    const output = outputDir || './screenshots';
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true });
    }

    const screenshotPath = path.join(output, filename);
    
    await this.page!.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    return screenshotPath;
  }

  private async compareScreenshots(
    currentPath: string,
    baselinePath: string
  ): Promise<ComparisonResult> {
    const pixelmatch = await import('pixelmatch');
    const { PNG } = await import('pngjs');
    
    const current = PNG.sync.read(fs.readFileSync(currentPath));
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));

    if (current.width !== baseline.width || current.height !== baseline.height) {
      return {
        diffPercentage: 100,
        passed: false
      };
    }

    const { width, height } = current;
    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch.default(
      current.data,
      baseline.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    // Save diff image if there are differences
    let diffPath: string | undefined;
    if (diffPixels > 0) {
      const diffDir = path.dirname(currentPath);
      diffPath = path.join(diffDir, `diff-${path.basename(currentPath)}`);
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }

    return {
      diffPercentage,
      diffPath,
      passed: diffPercentage < 1.0 // Allow 1% difference
    };
  }
}

export interface BrowseResult {
  success: boolean;
  url: string;
  title: string;
  screenshotPath?: string;
  auditResults?: AuditResult;
  comparisonResult?: ComparisonResult;
}
