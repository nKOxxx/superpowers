import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Viewport presets
const VIEWPORTS = {
  mobile: { width: 375, height: 667, deviceScaleFactor: 2 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
  desktop: { width: 1280, height: 720, deviceScaleFactor: 1 },
  wide: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  '4k': { width: 3840, height: 2160, deviceScaleFactor: 1 }
};

export interface BrowseOptions {
  url: string;
  viewports?: string[];
  fullPage?: boolean;
  audit?: boolean;
  wait?: number;
  selector?: string;
  darkMode?: boolean;
  outputDir?: string;
}

export interface ScreenshotResult {
  viewport: string;
  path: string;
  width: number;
  height: number;
}

export interface AuditViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

export interface AuditResult {
  passes: number;
  violations: AuditViolation[];
  incomplete: number;
  inapplicable: number;
}

export class BrowseSkill {
  private outputDir: string;

  constructor(outputDir = './browse-results') {
    this.outputDir = outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async captureScreenshots(options: BrowseOptions): Promise<ScreenshotResult[]> {
    const browser = await chromium.launch({ headless: true });
    const viewports = options.viewports || ['desktop'];
    const results: ScreenshotResult[] = [];

    try {
      for (const viewportName of viewports) {
        const viewport = VIEWPORTS[viewportName as keyof typeof VIEWPORTS] || VIEWPORTS.desktop;
        
        const context = await browser.newContext({
          viewport,
          colorScheme: options.darkMode ? 'dark' : 'light'
        });
        
        const page = await context.newPage();
        await page.goto(options.url, { waitUntil: 'networkidle' });
        
        if (options.wait && options.wait > 0) {
          await page.waitForTimeout(options.wait);
        }

        const timestamp = Date.now();
        const filename = `${viewportName}-${timestamp}.png`;
        const filepath = path.join(this.outputDir, filename);

        if (options.selector) {
          const element = await page.locator(options.selector).first();
          await element.screenshot({ path: filepath });
        } else {
          await page.screenshot({ 
            path: filepath, 
            fullPage: options.fullPage 
          });
        }

        results.push({
          viewport: viewportName,
          path: filepath,
          width: viewport.width,
          height: viewport.height
        });

        await context.close();
      }
    } finally {
      await browser.close();
    }

    return results;
  }

  async runAccessibilityAudit(options: BrowseOptions): Promise<AuditResult> {
    const browser = await chromium.launch({ headless: true });
    
    try {
      const context = await browser.newContext({
        viewport: VIEWPORTS.desktop,
        colorScheme: options.darkMode ? 'dark' : 'light'
      });
      
      const page = await context.newPage();
      await page.goto(options.url, { waitUntil: 'networkidle' });
      
      if (options.wait && options.wait > 0) {
        await page.waitForTimeout(options.wait);
      }

      // Inject axe-core
      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js'
      });

      const auditResult = await page.evaluate(async () => {
        // @ts-ignore - axe is loaded from CDN
        const results = await axe.run();
        return {
          passes: results.passes.length,
          violations: results.violations,
          incomplete: results.incomplete.length,
          inapplicable: results.inapplicable.length
        };
      });

      await context.close();
      return auditResult;
    } finally {
      await browser.close();
    }
  }

  formatAuditReport(result: AuditResult): string {
    const lines: string[] = [];
    lines.push(`♿ Accessibility Audit Results`);
    lines.push(`   ✅ Passes: ${result.passes}`);
    lines.push(`   ❌ Violations: ${result.violations.length}`);
    lines.push(`   ⏳ Incomplete: ${result.incomplete}`);
    lines.push(`   ➖ Inapplicable: ${result.inapplicable}`);
    
    if (result.violations.length > 0) {
      lines.push(`\n⚠️ Violations:`);
      for (const v of result.violations) {
        const icon = v.impact === 'critical' ? '🔴' : v.impact === 'serious' ? '🟠' : '🟡';
        lines.push(`\n${icon} ${v.id} (${v.impact})`);
        lines.push(`   ${v.description}`);
        lines.push(`   Help: ${v.helpUrl}`);
        lines.push(`   Affected: ${v.nodes.length} element(s)`);
      }
    }
    
    return lines.join('\n');
  }

  async browse(options: BrowseOptions): Promise<string> {
    const outputs: string[] = [];
    
    // Capture screenshots
    const screenshots = await this.captureScreenshots(options);
    outputs.push(`📸 Captured ${screenshots.length} screenshot(s):`);
    for (const s of screenshots) {
      outputs.push(`   - ${s.viewport}: ${s.width}x${s.height}`);
      outputs.push(`MEDIA: ${s.path}`);
    }

    // Run accessibility audit if requested
    if (options.audit) {
      const auditResult = await this.runAccessibilityAudit(options);
      outputs.push('\n' + this.formatAuditReport(auditResult));
    }

    return outputs.join('\n');
  }
}

// Export for OpenClaw integration
export default BrowseSkill;
