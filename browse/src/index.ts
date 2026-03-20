/**
 * Browse Skill - Browser automation with Playwright
 * 
 * Provides: screenshots, accessibility audits, visual regression testing
 * Compatible with: Kimi K2.5, Node.js 18+, OpenClaw
 */

import { chromium, firefox, webkit, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// Viewport configurations
export const VIEWPORTS: Record<string, { width: number; height: number; deviceScaleFactor: number }> = {
  mobile: { width: 375, height: 667, deviceScaleFactor: 2 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
  desktop: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  '4k': { width: 3840, height: 2160, deviceScaleFactor: 1 }
};

// Interfaces
export interface BrowseOptions {
  url: string;
  screenshots?: boolean;
  viewport?: string;
  viewports?: string;
  accessibility?: boolean;
  baseline?: boolean;
  compare?: boolean;
  name?: string;
  threshold?: number;
  outputDir: string;
  format?: 'json' | 'markdown';
  telegram?: boolean;
  fullPage?: boolean;
  waitFor?: string;
  timeout?: number;
  dryRun?: boolean;
  fullAudit?: boolean;
  notifyFailuresOnly?: boolean;
  update?: boolean;
  rules?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
}

export interface ScreenshotResult {
  viewport: string;
  path: string;
  filename: string;
  width: number;
  height: number;
}

export interface AccessibilityViolation {
  id: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
}

export interface AccessibilityResult {
  url: string;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  timestamp: string;
}

export interface RegressionResult {
  viewport: string;
  diffPath?: string;
  diffPercentage?: number;
  match: boolean;
}

export interface BrowseResult {
  url: string;
  timestamp: string;
  screenshots: ScreenshotResult[];
  accessibility?: AccessibilityResult;
  baselinesCreated?: string[];
  regressions: RegressionResult[];
}

// Default options
export function getDefaultOptions(): Partial<BrowseOptions> {
  return {
    outputDir: './browse-results',
    fullPage: true,
    timeout: 30000,
    threshold: 0.1,
    format: 'json',
    browser: 'chromium'
  };
}

/**
 * Main browse function - executes browser automation
 */
export async function browse(options: BrowseOptions): Promise<BrowseResult> {
  const browserType = options.browser || 'chromium';
  const browser = await { chromium, firefox, webkit }[browserType].launch({ 
    headless: true 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    fs.mkdirSync(options.outputDir, { recursive: true });
    
    const result: BrowseResult = {
      url: options.url,
      timestamp: new Date().toISOString(),
      screenshots: [],
      regressions: []
    };

    const viewports = options.viewports 
      ? options.viewports.split(',')
      : options.viewport 
        ? [options.viewport]
        : Object.keys(VIEWPORTS);

    // Handle baseline creation
    if (options.baseline) {
      const baselineDir = path.join(options.outputDir, 'baselines');
      const baselines = await createBaseline(page, options.url, viewports, baselineDir, options);
      result.baselinesCreated = baselines;
    }

    // Handle regression testing
    if (options.compare) {
      const baselineDir = path.join(options.outputDir, 'baselines');
      const regressions: RegressionResult[] = [];
      
      for (const viewport of viewports) {
        const comparison = await compareToBaseline(
          page, 
          options.url, 
          viewport, 
          baselineDir, 
          options.threshold || 0.1,
          options
        );
        
        if (!comparison.match) {
          regressions.push(comparison);
        }
      }
      
      result.regressions = regressions;
    }

    // Capture screenshots
    if (options.screenshots || options.fullAudit) {
      const screenshotsDir = path.join(options.outputDir, 'screenshots');
      fs.mkdirSync(screenshotsDir, { recursive: true });
      
      result.screenshots = await captureScreenshots(page, options.url, viewports, options);
    }

    // Run accessibility audit
    if (options.accessibility || options.fullAudit) {
      result.accessibility = await runAccessibilityAudit(page, options.url, options);
    }

    // Send Telegram notification
    if (options.telegram) {
      await sendTelegramNotification(result, options);
    }

    return result;
  } finally {
    await browser.close();
  }
}

/**
 * Capture screenshots at multiple viewports
 */
export async function captureScreenshots(
  page: Page,
  url: string,
  viewports: string[],
  options: BrowseOptions
): Promise<ScreenshotResult[]> {
  const screenshots: ScreenshotResult[] = [];
  const screenshotsDir = path.join(options.outputDir, 'screenshots');
  
  const urlSlug = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const timestamp = new Date().toISOString().split('T')[0];

  for (const viewportName of viewports) {
    const viewport = VIEWPORTS[viewportName];
    if (!viewport) continue;

    await page.setViewportSize({ 
      width: viewport.width, 
      height: viewport.height 
    });

    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: options.timeout || 30000 
    });

    // Wait for specific element if requested
    if (options.waitFor) {
      if (/^\d+$/.test(options.waitFor)) {
        await page.waitForTimeout(parseInt(options.waitFor));
      } else {
        await page.waitForSelector(options.waitFor, { timeout: 10000 });
      }
    }

    const filename = `${viewportName}_${urlSlug}_${timestamp}.png`;
    const screenshotPath = path.join(screenshotsDir, filename);

    await page.screenshot({
      path: screenshotPath,
      fullPage: options.fullPage !== false
    });

    screenshots.push({
      viewport: viewportName,
      path: screenshotPath,
      filename,
      width: viewport.width,
      height: viewport.height
    });

    console.log(`  📸 ${viewportName}: ${filename}`);
  }

  return screenshots;
}

/**
 * Run accessibility audit using axe-core
 */
export async function runAccessibilityAudit(
  page: Page,
  url: string,
  options: BrowseOptions
): Promise<AccessibilityResult> {
  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: options.timeout || 30000 
  });

  // Inject axe-core
  const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await page.evaluate(axeSource);

  // Run axe analysis
  const results = await page.evaluate((rules) => {
    // @ts-ignore - axe is injected
    return axe.run({
      rules: rules ? rules.split(',').reduce((acc: any, rule: string) => {
        acc[rule.trim()] = { enabled: true };
        return acc;
      }, {}) : undefined
    });
  }, options.rules);

  const violations: AccessibilityViolation[] = results.violations.map((v: any) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    nodes: v.nodes.length
  }));

  return {
    url,
    violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create baseline screenshots for regression testing
 */
export async function createBaseline(
  page: Page,
  url: string,
  viewports: string[],
  baselineDir: string,
  options: BrowseOptions
): Promise<string[]> {
  fs.mkdirSync(baselineDir, { recursive: true });
  const baselines: string[] = [];

  const urlSlug = options.name || url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

  for (const viewportName of viewports) {
    const viewport = VIEWPORTS[viewportName];
    if (!viewport) continue;

    await page.setViewportSize({ 
      width: viewport.width, 
      height: viewport.height 
    });

    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: options.timeout || 30000 
    });

    const baselinePath = path.join(baselineDir, `${urlSlug}_${viewportName}.png`);
    await page.screenshot({ path: baselinePath, fullPage: false });
    baselines.push(baselinePath);
    
    console.log(`  📋 Baseline created: ${baselinePath}`);
  }

  return baselines;
}

/**
 * Compare current screenshot to baseline
 */
export async function compareToBaseline(
  page: Page,
  url: string,
  viewport: string,
  baselineDir: string,
  threshold: number,
  options: BrowseOptions
): Promise<RegressionResult> {
  const viewportConfig = VIEWPORTS[viewport];
  if (!viewportConfig) {
    return { viewport, match: true };
  }

  await page.setViewportSize({ 
    width: viewportConfig.width, 
    height: viewportConfig.height 
  });

  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: options.timeout || 30000 
  });

  const urlSlug = options.name || url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const baselinePath = path.join(baselineDir, `${urlSlug}_${viewport}.png`);

  // Check if baseline exists
  if (!fs.existsSync(baselinePath)) {
    console.log(`  ⚠️  No baseline found for ${viewport}, creating...`);
    await createBaseline(page, url, [viewport], baselineDir, options);
    return { viewport, match: true };
  }

  // Capture current screenshot to temp
  const tempDir = path.join(options.outputDir, 'temp');
  fs.mkdirSync(tempDir, { recursive: true });
  const currentPath = path.join(tempDir, `current_${viewport}.png`);
  await page.screenshot({ path: currentPath, fullPage: false });

  // Compare images
  const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
  const currentImg = PNG.sync.read(fs.readFileSync(currentPath));

  if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
    return { 
      viewport, 
      match: false, 
      diffPercentage: 100 
    };
  }

  const diff = new PNG({ width: baselineImg.width, height: baselineImg.height });
  const diffPixels = pixelmatch(
    baselineImg.data,
    currentImg.data,
    diff.data,
    baselineImg.width,
    baselineImg.height,
    { threshold: 0.1 }
  );

  const totalPixels = baselineImg.width * baselineImg.height;
  const diffPercentage = (diffPixels / totalPixels) * 100;

  // Save diff if there are differences
  let diffPath: string | undefined;
  if (diffPercentage > threshold) {
    const diffDir = path.join(options.outputDir, 'diffs');
    fs.mkdirSync(diffDir, { recursive: true });
    diffPath = path.join(diffDir, `${urlSlug}_${viewport}_diff.png`);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  // Cleanup temp
  fs.unlinkSync(currentPath);

  return {
    viewport,
    match: diffPercentage <= threshold,
    diffPath,
    diffPercentage
  };
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(result: BrowseResult, options: BrowseOptions): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('  ⚠️  Telegram credentials not configured');
    return;
  }

  // Only notify on failures if requested
  if (options.notifyFailuresOnly) {
    const hasIssues = 
      (result.accessibility?.violations.length || 0) > 0 ||
      result.regressions.length > 0;
    if (!hasIssues) return;
  }

  let message = `📸 *Browse Report*\n`;
  message += `🔗 ${result.url}\n`;
  message += `⏰ ${new Date(result.timestamp).toLocaleString()}\n\n`;

  if (result.screenshots.length > 0) {
    message += `📷 Screenshots: ${result.screenshots.length} captured\n`;
  }

  if (result.accessibility) {
    const violations = result.accessibility.violations;
    const critical = violations.filter(v => v.impact === 'critical').length;
    const serious = violations.filter(v => v.impact === 'serious').length;
    
    if (violations.length === 0) {
      message += `✅ Accessibility: No violations\n`;
    } else {
      message += `⚠️ Accessibility: ${violations.length} violations\n`;
      message += `   Critical: ${critical}, Serious: ${serious}\n`;
    }
  }

  if (result.regressions.length > 0) {
    message += `\n🚨 *Visual Regressions: ${result.regressions.length}*\n`;
    for (const reg of result.regressions) {
      message += `   ${reg.viewport}: ${reg.diffPercentage?.toFixed(2)}% diff\n`;
    }
  } else if (options.compare) {
    message += `\n✅ No visual regressions\n`;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      console.warn('  ⚠️  Failed to send Telegram notification');
    } else {
      console.log('  📤 Telegram notification sent');
    }
  } catch (error) {
    console.warn('  ⚠️  Telegram error:', error);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  const urlIndex = args.findIndex(arg => arg === '-u' || arg === '--url');
  const url = urlIndex !== -1 && args[urlIndex + 1] 
    ? args[urlIndex + 1] 
    : args.find(arg => arg.startsWith('http')) || '';

  if (!url) {
    console.error('Error: URL is required. Use --url <url>');
    process.exit(1);
  }

  const options: BrowseOptions = {
    url,
    screenshots: args.includes('-s') || args.includes('--screenshots'),
    accessibility: args.includes('-a') || args.includes('--accessibility'),
    baseline: args.includes('--baseline'),
    compare: args.includes('--compare'),
    telegram: args.includes('-t') || args.includes('--telegram'),
    fullPage: !args.includes('--no-full-page'),
    dryRun: args.includes('--dry-run'),
    fullAudit: args.includes('--full-audit'),
    notifyFailuresOnly: args.includes('--notify-failures-only'),
    update: args.includes('--update'),
    outputDir: './browse-results',
    threshold: 0.1,
    format: 'json'
  };

  // Parse additional options
  const outputIndex = args.findIndex(arg => arg === '-o' || arg === '--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.outputDir = args[outputIndex + 1];
  }

  const viewportIndex = args.findIndex(arg => arg === '--viewport');
  if (viewportIndex !== -1 && args[viewportIndex + 1]) {
    options.viewport = args[viewportIndex + 1];
  }

  const viewportsIndex = args.findIndex(arg => arg === '--viewports');
  if (viewportsIndex !== -1 && args[viewportsIndex + 1]) {
    options.viewports = args[viewportsIndex + 1];
  }

  const nameIndex = args.findIndex(arg => arg === '--name');
  if (nameIndex !== -1 && args[nameIndex + 1]) {
    options.name = args[nameIndex + 1];
  }

  const thresholdIndex = args.findIndex(arg => arg === '--threshold');
  if (thresholdIndex !== -1 && args[thresholdIndex + 1]) {
    options.threshold = parseFloat(args[thresholdIndex + 1]);
  }

  browse(options).then(result => {
    console.log('\n📊 Browse Results:');
    console.log(`   URL: ${result.url}`);
    console.log(`   Screenshots: ${result.screenshots.length}`);
    
    if (result.accessibility) {
      const v = result.accessibility.violations;
      console.log(`   Accessibility: ${v.length} violations`);
      if (v.length > 0) {
        const critical = v.filter(x => x.impact === 'critical').length;
        const serious = v.filter(x => x.impact === 'serious').length;
        console.log(`      Critical: ${critical}, Serious: ${serious}`);
      }
    }

    if (result.regressions.length > 0) {
      console.log(`   ⚠️  Regressions: ${result.regressions.length} detected`);
    }

    // Save results
    if (options.format === 'json') {
      const resultsPath = path.join(options.outputDir, 'results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n   Results saved to: ${resultsPath}`);
    }

    process.exit(0);
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default browse;
