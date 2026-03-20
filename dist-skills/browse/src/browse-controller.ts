import { chromium, Browser, Page, devices } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { BrowseOptions, BrowseResult, AuditResult, ComparisonResult, PerformanceMetrics } from './types';
import { AccessibilityAuditor } from './accessibility';
import { VisualComparer } from './visual-comparison';

export class BrowseController {
  private options: BrowseOptions;
  private browser?: Browser;
  private page?: Page;

  constructor(options: BrowseOptions) {
    this.options = options;
  }

  async execute(): Promise<BrowseResult> {
    const result: BrowseResult = {
      url: this.options.url,
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      await this.launchBrowser();
      await this.navigate();
      
      if (this.options.waitFor) {
        await this.waitForElement(this.options.waitFor);
      }

      // Collect metrics
      result.metrics = await this.collectMetrics();

      // Run accessibility audit
      if (this.options.audit) {
        try {
          result.audit = await this.runAccessibilityAudit();
        } catch (err) {
          result.errors.push(`Accessibility audit failed: ${err}`);
        }
      }

      // Capture screenshot
      if (this.options.screenshot) {
        try {
          result.screenshot = await this.captureScreenshot();
        } catch (err) {
          result.errors.push(`Screenshot failed: ${err}`);
        }
      }

      // Compare visual diff
      if (this.options.compare && result.screenshot) {
        try {
          result.comparison = await this.compareVisual(result.screenshot);
        } catch (err) {
          result.errors.push(`Visual comparison failed: ${err}`);
        }
      }

      // Send to Telegram if requested
      if (this.options.telegram && result.screenshot) {
        await this.sendToTelegram(result);
      }

    } catch (err) {
      result.errors.push(`Navigation failed: ${err}`);
    } finally {
      await this.cleanup();
    }

    return result;
  }

  private async launchBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true
    });

    const context = await this.browser.newContext({
      viewport: this.options.mobile 
        ? devices['iPhone 14'].viewport 
        : this.options.viewport,
      deviceScaleFactor: this.options.mobile ? 2 : 1,
      colorScheme: this.options.darkMode ? 'dark' : 'light'
    });

    this.page = await context.newPage();
  }

  private async navigate(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto(this.options.url, {
      waitUntil: 'networkidle',
      timeout: this.options.timeout
    });
  }

  private async waitForElement(selector: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.waitForSelector(selector, { timeout: this.options.timeout });
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    if (!this.page) throw new Error('Page not initialized');

    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.startTime : 0,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : 0,
        paint: paint.length > 0 ? paint[0].startTime : 0
      };
    });

    return metrics;
  }

  private async runAccessibilityAudit(): Promise<AuditResult> {
    if (!this.page) throw new Error('Page not initialized');
    
    const auditor = new AccessibilityAuditor(this.page);
    return await auditor.run();
  }

  private async captureScreenshot(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const outputDir = this.options.output || './browse-results';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hostname = new URL(this.options.url).hostname.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${hostname}-${timestamp}.png`;
    const filepath = path.join(outputDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: this.options.fullPage
    });

    return filepath;
  }

  private async compareVisual(screenshotPath: string): Promise<ComparisonResult> {
    if (!this.options.compare) throw new Error('No baseline provided');
    
    const comparer = new VisualComparer();
    return await comparer.compare(this.options.compare, screenshotPath);
  }

  private async sendToTelegram(result: BrowseResult): Promise<void> {
    try {
      // Check if openclaw CLI is available
      const message = this.formatTelegramMessage(result);
      
      // Use openclaw message command if available
      const cmd = `openclaw message send --message "${message}"`;
      execSync(cmd, { stdio: 'ignore' });
    } catch {
      // Silent fail - Telegram is optional
    }
  }

  private formatTelegramMessage(result: BrowseResult): string {
    const lines = [
      `📸 Screenshot: ${result.url}`,
      ''
    ];

    if (result.audit) {
      const issues = result.audit.violations.length;
      lines.push(`♿ Accessibility: ${issues === 0 ? '✅ No issues' : `⚠️ ${issues} issues`}`);
    }

    if (result.metrics) {
      lines.push(`⚡ Load time: ${result.metrics.loadTime}ms`);
    }

    return lines.join('\n');
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
