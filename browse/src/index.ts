/**
 * Browse skill - Browser automation with Playwright
 */

import { chromium, firefox, webkit, type Browser, type Page, type BrowserContext } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger, ConsoleLogger, SkillResult, formatDuration } from '@openclaw/superpowers-shared';

export interface BrowseOptions {
  url: string;
  screenshot?: boolean;
  viewport?: { width: number; height: number };
  audit?: boolean;
  waitFor?: string;
  timeout?: number;
  compareBaseline?: string;
  mobile?: boolean;
  darkMode?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
  screenshotDir?: string;
  fullPage?: boolean;
}

export interface Violation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary?: string;
  }>;
}

export interface AccessibilityReport {
  violations: Violation[];
  passes: number;
  incomplete: number;
  score: number;
}

export interface ComparisonResult {
  diffPercentage: number;
  matched: boolean;
  diffPath?: string;
}

export interface BrowseResult {
  url: string;
  title: string;
  loadTime: number;
  screenshotPath?: string;
  auditResults?: AccessibilityReport;
  comparisonResult?: ComparisonResult;
  errors: string[];
}

export class BrowseSkill {
  private logger: Logger;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  async browse(options: BrowseOptions): Promise<BrowseResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    this.logger.info(`Browsing: ${options.url}`);

    try {
      // Launch browser
      this.browser = await this.launchBrowser(options.browser || 'chromium', options.mobile);
      
      // Create context with options
      this.context = await this.browser.newContext({
        viewport: options.viewport || (options.mobile ? { width: 375, height: 667 } : { width: 1280, height: 720 }),
        colorScheme: options.darkMode ? 'dark' : 'light',
        userAgent: options.mobile 
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
          : undefined
      });

      const page = await this.context.newPage();
      
      // Set timeout
      page.setDefaultTimeout(options.timeout || 30000);
      page.setDefaultNavigationTimeout(options.timeout || 30000);

      // Navigate
      const navigationStart = Date.now();
      const response = await page.goto(options.url, { 
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000 
      });
      
      const loadTime = Date.now() - navigationStart;
      this.logger.info(`Page loaded in ${loadTime}ms`);

      if (!response) {
        errors.push('Navigation failed - no response');
      } else if (!response.ok()) {
        errors.push(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Wait for selector if specified
      if (options.waitFor) {
        try {
          await page.waitForSelector(options.waitFor, { timeout: 10000 });
          this.logger.info(`Waited for selector: ${options.waitFor}`);
        } catch (e) {
          errors.push(`Timeout waiting for selector: ${options.waitFor}`);
        }
      }

      const title = await page.title();
      let screenshotPath: string | undefined;
      let auditResults: AccessibilityReport | undefined;
      let comparisonResult: ComparisonResult | undefined;

      // Run accessibility audit
      if (options.audit) {
        auditResults = await this.runAccessibilityAudit(page);
        this.logger.info(`Accessibility score: ${auditResults.score}/100`);
      }

      // Capture screenshot
      if (options.screenshot) {
        screenshotPath = await this.captureScreenshot(page, {
          dir: options.screenshotDir || './screenshots',
          fullPage: options.fullPage ?? true,
          name: `screenshot-${Date.now()}.png`
        });
        this.logger.info(`Screenshot saved: ${screenshotPath}`);

        // Compare with baseline if provided
        if (options.compareBaseline) {
          comparisonResult = await this.compareScreenshots(options.compareBaseline, screenshotPath);
          this.logger.info(`Visual comparison: ${comparisonResult.diffPercentage.toFixed(2)}% difference`);
        }
      }

      const result: BrowseResult = {
        url: options.url,
        title,
        loadTime,
        screenshotPath,
        auditResults,
        comparisonResult,
        errors
      };

      this.logger.info(`Browse completed in ${formatDuration(Date.now() - startTime)}`);
      return result;

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Browse failed: ${message}`);
      errors.push(message);
      
      return {
        url: options.url,
        title: '',
        loadTime: Date.now() - startTime,
        errors
      };
    } finally {
      await this.close();
    }
  }

  private async launchBrowser(
    type: 'chromium' | 'firefox' | 'webkit',
    mobile?: boolean
  ): Promise<Browser> {
    const launchOptions = {
      headless: true,
      args: mobile ? ['--window-size=375,667'] : ['--window-size=1280,720']
    };

    switch (type) {
      case 'firefox':
        return firefox.launch(launchOptions);
      case 'webkit':
        return webkit.launch(launchOptions);
      case 'chromium':
      default:
        return chromium.launch(launchOptions);
    }
  }

  async captureScreenshot(
    page: Page,
    options: { dir: string; name: string; fullPage?: boolean }
  ): Promise<string> {
    await fs.mkdir(options.dir, { recursive: true });
    const screenshotPath = path.join(options.dir, options.name);
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: options.fullPage ?? true
    });

    return screenshotPath;
  }

  async runAccessibilityAudit(page: Page): Promise<AccessibilityReport> {
    // Inject axe-core
    const axeSource = await fs.readFile(
      new URL('../node_modules/axe-core/axe.min.js', import.meta.url),
      'utf-8'
    );
    
    await page.addScriptTag({ content: axeSource });

    // Run audit
    interface AxeResults {
      violations: Array<{
        id: string;
        impact: 'minor' | 'moderate' | 'serious' | 'critical';
        description: string;
        help: string;
        helpUrl: string;
        nodes: Array<{
          target: string[];
          html: string;
          failureSummary?: string;
        }>;
      }>;
      passes: unknown[];
      incomplete: unknown[];
    }

    const results = await page.evaluate(() => {
      return new Promise<AxeResults>((resolve) => {
        (window as unknown as { axe: { run: (cb: (err: unknown, results: AxeResults) => void) => void } }).axe.run((err, results) => {
          if (err) {
            resolve({ violations: [], passes: [], incomplete: [] });
          } else {
            resolve(results);
          }
        });
      });
    });

    // Calculate score
    const totalChecks = results.violations.length + results.passes.length;
    const score = totalChecks > 0 
      ? Math.round((results.passes.length / totalChecks) * 100)
      : 100;

    return {
      violations: results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({
          target: n.target,
          html: n.html,
          failureSummary: n.failureSummary
        }))
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      score
    };
  }

  async compareScreenshots(baseline: string, current: string): Promise<ComparisonResult> {
    try {
      const { default: pixelmatch } = await import('pixelmatch');
      const { PNG } = await import('pngjs');
      
      const baselineImg = PNG.sync.read(await fs.readFile(baseline));
      const currentImg = PNG.sync.read(await fs.readFile(current));

      if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
        return {
          diffPercentage: 100,
          matched: false
        };
      }

      const diff = new PNG({ width: baselineImg.width, height: baselineImg.height });
      const numDiffPixels = pixelmatch(
        baselineImg.data,
        currentImg.data,
        diff.data,
        baselineImg.width,
        baselineImg.height,
        { threshold: 0.1 }
      );

      const totalPixels = baselineImg.width * baselineImg.height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;

      return {
        diffPercentage,
        matched: diffPercentage < 1 // Less than 1% difference is considered a match
      };
    } catch (error) {
      this.logger.error(`Comparison failed: ${error}`);
      return {
        diffPercentage: 100,
        matched: false
      };
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export convenience function
export async function browse(options: BrowseOptions): Promise<BrowseResult> {
  const skill = new BrowseSkill();
  return skill.browse(options);
}