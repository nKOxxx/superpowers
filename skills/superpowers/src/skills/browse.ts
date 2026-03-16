import { chromium, type Browser, type Page } from 'playwright';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { loadConfig, getBrowserConfig } from '../lib/config.js';
import { header, success, error, step, info, warning, formatDuration } from '../lib/format.js';
import type { CrawlPage, PerformanceMetrics, A11yViolation } from '../types.js';

interface BrowseOptions {
  url: string;
  screenshot?: boolean;
  fullPage?: boolean;
  viewport?: string;
  waitFor?: string;
  waitTime?: number;
  output?: string;
  selector?: string;
  darkMode?: boolean;
  mobile?: boolean;
  tablet?: boolean;
  test?: boolean;
  compareTo?: string;
  threshold?: number;
  crawl?: boolean;
  depth?: number;
  maxPages?: number;
  validateLinks?: boolean;
  a11y?: boolean;
  standard?: string;
  metrics?: boolean;
  pdf?: boolean;
}

export async function browseCommand(url: string, options: BrowseOptions): Promise<void> {
  const startTime = Date.now();
  const config = loadConfig();
  const browserConfig = getBrowserConfig(config);
  
  // Ensure results directory exists
  const resultsDir = resolve(process.cwd(), browserConfig.screenshotDir);
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  header('Browse - Browser Automation');
  step(`Navigating to: ${url}`);

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false'
    });

    const context = await browser.newContext({
      viewport: getViewport(options, browserConfig),
      colorScheme: options.darkMode ? 'dark' : 'light'
    });

    const page = await context.newPage();

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for element if specified
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 10000 });
    }

    // Additional wait time
    if (options.waitTime) {
      await page.waitForTimeout(options.waitTime);
    }

    // Handle different modes
    if (options.crawl) {
      await crawlWebsite(page, url, options, resultsDir);
    } else if (options.a11y) {
      await runAccessibilityAudit(page, url, options, resultsDir);
    } else if (options.metrics) {
      await capturePerformanceMetrics(page, url);
    } else if (options.pdf) {
      await generatePDF(page, url, resultsDir);
    } else if (options.test && options.compareTo) {
      await runVisualRegression(page, url, options, resultsDir);
    } else {
      // Default: take screenshot
      await takeScreenshot(page, url, options, resultsDir);
    }

    const duration = Date.now() - startTime;
    success(`Completed in ${formatDuration(duration)}`);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    error(`Browse failed: ${message}`);
    process.exit(1);
  } finally {
    await browser?.close();
  }
}

function getViewport(options: BrowseOptions, config: any): { width: number; height: number } {
  if (options.mobile) {
    return config.viewports.mobile || { width: 375, height: 667 };
  }
  if (options.tablet) {
    return config.viewports.tablet || { width: 768, height: 1024 };
  }
  if (options.viewport) {
    if (options.viewport.includes('x')) {
      const [width, height] = options.viewport.split('x').map(Number);
      return { width, height };
    }
    if (config.viewports[options.viewport]) {
      return config.viewports[options.viewport];
    }
  }
  return config.viewports.desktop || { width: 1280, height: 720 };
}

async function takeScreenshot(
  page: Page,
  url: string,
  options: BrowseOptions,
  resultsDir: string
): Promise<void> {
  const filename = options.output || `screenshot-${Date.now()}.png`;
  const outputPath = resolve(resultsDir, 'screenshots', filename);
  
  mkdirSync(dirname(outputPath), { recursive: true });

  const screenshotOptions: any = {
    path: outputPath,
    fullPage: options.fullPage
  };

  if (options.selector) {
    const element = await page.locator(options.selector).first();
    await element.screenshot({ path: outputPath });
  } else {
    await page.screenshot(screenshotOptions);
  }

  success(`Screenshot saved: ${outputPath}`);
}

async function runVisualRegression(
  page: Page,
  url: string,
  options: BrowseOptions,
  resultsDir: string
): Promise<void> {
  const baselinePath = resolve(options.compareTo!);
  
  if (!existsSync(baselinePath)) {
    error(`Baseline image not found: ${baselinePath}`);
    process.exit(1);
  }

  const currentPath = join(resultsDir, 'screenshots', `current-${Date.now()}.png`);
  const diffPath = join(resultsDir, 'diffs', `diff-${Date.now()}.png`);
  
  mkdirSync(dirname(currentPath), { recursive: true });
  mkdirSync(dirname(diffPath), { recursive: true });

  // Take current screenshot
  await page.screenshot({ path: currentPath, fullPage: options.fullPage });

  // Load images
  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const current = PNG.sync.read(readFileSync(currentPath));

  // Ensure same dimensions
  if (baseline.width !== current.width || baseline.height !== current.height) {
    error('Images have different dimensions');
    info(`Baseline: ${baseline.width}x${baseline.height}`);
    info(`Current: ${current.width}x${current.height}`);
    process.exit(1);
  }

  // Create diff
  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const numDiffPixels = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    baseline.width,
    baseline.height,
    { threshold: options.threshold || 0.1 }
  );

  writeFileSync(diffPath, PNG.sync.write(diff));

  const diffPercent = (numDiffPixels / (baseline.width * baseline.height)) * 100;

  if (numDiffPixels === 0) {
    success('No visual differences detected');
  } else {
    warning(`Visual differences detected: ${numDiffPixels} pixels (${diffPercent.toFixed(2)}%)`);
    info(`Diff saved: ${diffPath}`);
    
    if (diffPercent > (options.threshold || 0.1) * 100) {
      process.exit(1);
    }
  }
}

async function crawlWebsite(
  page: Page,
  startUrl: string,
  options: BrowseOptions,
  resultsDir: string
): Promise<void> {
  const maxDepth = options.depth || 2;
  const maxPages = options.maxPages || 50;
  const validateLinks = options.validateLinks || false;
  const screenshotEach = options.screenshotEach || false;

  const visited = new Set<string>();
  const pages: CrawlPage[] = [];
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];

  const baseUrl = new URL(startUrl);

  step(`Crawling with max depth: ${maxDepth}, max pages: ${maxPages}`);

  while (queue.length > 0 && visited.size < maxPages) {
    const { url, depth } = queue.shift()!;

    if (visited.has(url) || depth > maxDepth) continue;
    visited.add(url);

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      const title = await page.title();
      const links = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[]) => 
        anchors.map(a => a.href)
      );

      const pageData: CrawlPage = {
        url,
        title,
        statusCode: response?.status() || 0,
        links: [...new Set(links)],
        brokenLinks: [],
        depth
      };

      // Filter links to same origin
      const sameOriginLinks = pageData.links.filter(link => {
        try {
          const linkUrl = new URL(link);
          return linkUrl.origin === baseUrl.origin;
        } catch {
          return false;
        }
      });

      // Add new links to queue
      for (const link of sameOriginLinks) {
        if (!visited.has(link)) {
          queue.push({ url: link, depth: depth + 1 });
        }
      }

      // Validate links if requested
      if (validateLinks) {
        for (const link of pageData.links.slice(0, 20)) { // Limit to 20 per page
          try {
            const checkPage = await page.context().newPage();
            const checkResponse = await checkPage.goto(link, { timeout: 10000 });
            if (!checkResponse || checkResponse.status() >= 400) {
              pageData.brokenLinks.push(link);
            }
            await checkPage.close();
          } catch {
            pageData.brokenLinks.push(link);
          }
        }
      }

      // Screenshot if requested
      if (screenshotEach) {
        const screenshotPath = join(resultsDir, 'screenshots', `crawl-${visited.size}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        pageData.screenshot = screenshotPath;
      }

      pages.push(pageData);
      info(`[${visited.size}] ${url} (${title})`);

    } catch (err) {
      warning(`Failed to crawl: ${url}`);
    }
  }

  // Save crawl report
  const reportPath = join(resultsDir, 'crawl-reports', `crawl-${Date.now()}.json`);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(pages, null, 2));

  success(`Crawled ${pages.length} pages`);
  info(`Report saved: ${reportPath}`);

  if (validateLinks) {
    const totalBroken = pages.reduce((sum, p) => sum + p.brokenLinks.length, 0);
    if (totalBroken > 0) {
      warning(`Found ${totalBroken} broken links`);
    }
  }
}

async function runAccessibilityAudit(
  page: Page,
  url: string,
  options: BrowseOptions,
  resultsDir: string
): Promise<void> {
  step('Running accessibility audit...');

  // Inject axe-core
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js'
  });

  // Wait for axe to load
  await page.waitForTimeout(500);

  // Run audit
  const results = await page.evaluate((standard: string) => {
    return new Promise((resolve) => {
      (window as any).axe.run({
        runOnly: {
          type: 'tag',
          values: [standard]
        }
      }).then((results: any) => resolve(results));
    });
  }, options.standard || 'wcag2aa');

  const violations = (results as any).violations as A11yViolation[];

  // Display results
  if (violations.length === 0) {
    success('No accessibility violations found');
  } else {
    warning(`Found ${violations.length} accessibility violations`);
    
    for (const violation of violations) {
      const impactColor = {
        critical: '\x1b[31m',
        serious: '\x1b[31m',
        moderate: '\x1b[33m',
        minor: '\x1b[36m'
      }[violation.impact] || '';

      console.log(`\n${impactColor}[${violation.impact.toUpperCase()}]\x1b[0m ${violation.description}`);
      console.log(`  Help: ${violation.help}`);
      console.log(`  URL: ${violation.helpUrl}`);
      console.log(`  Affected: ${violation.nodes.length} nodes`);
    }
  }

  // Save report
  const reportPath = join(resultsDir, 'a11y-reports', `a11y-${Date.now()}.json`);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  info(`Report saved: ${reportPath}`);
}

async function capturePerformanceMetrics(page: Page, url: string): Promise<void> {
  step('Capturing performance metrics...');

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      ttfb: navigation?.responseStart || 0,
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      lcp: 0, // Requires PerformanceObserver
      cls: 0  // Requires LayoutShift entries
    };
  });

  // Try to get LCP and CLS from web vitals if available
  try {
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.entryType === 'largest-contentful-paint') {
              (window as any).__LCP = entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              (window as any).__CLS = ((window as any).__CLS || 0) + entry.value;
            }
          });
        }).observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });

        setTimeout(resolve, 3000);
      });
    });

    const webVitals = await page.evaluate(() => ({
      lcp: (window as any).__LCP || 0,
      cls: (window as any).__CLS || 0
    }));

    metrics.lcp = webVitals.lcp;
    metrics.cls = webVitals.cls;
  } catch {
    // Web vitals not available
  }

  const performanceData: PerformanceMetrics = {
    url,
    ttfb: metrics.ttfb,
    fcp: metrics.fcp,
    lcp: metrics.lcp,
    cls: metrics.cls
  };

  header('Performance Metrics');
  console.log(`TTFB: ${performanceData.ttfb.toFixed(2)}ms`);
  console.log(`FCP:  ${performanceData.fcp.toFixed(2)}ms`);
  console.log(`LCP:  ${performanceData.lcp.toFixed(2)}ms`);
  console.log(`CLS:  ${performanceData.cls.toFixed(4)}`);

  // Rate performance
  if (performanceData.lcp > 4000) {
    warning('LCP needs improvement (>4s)');
  } else if (performanceData.lcp > 2500) {
    warning('LCP could be better (>2.5s)');
  } else if (performanceData.lcp > 0) {
    success('LCP is good (<2.5s)');
  }
}

async function generatePDF(page: Page, url: string, resultsDir: string): Promise<void> {
  step('Generating PDF...');

  const filename = `page-${Date.now()}.pdf`;
  const outputPath = join(resultsDir, 'pdfs', filename);
  
  mkdirSync(dirname(outputPath), { recursive: true });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });

  success(`PDF saved: ${outputPath}`);
}
