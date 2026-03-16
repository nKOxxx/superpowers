#!/usr/bin/env node
import { chromium, Browser, Page } from 'playwright';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { BrowseOptions, FlowResult, ScreenshotResult } from '../shared/types.js';
import { loadConfig, formatDate, ensureDir, Logger, parseArgs } from '../shared/utils.js';

const logger = new Logger();

const DEFAULT_VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
};

const DEFAULT_TIMEOUT = 30000;

interface BrowseReport {
  url: string;
  timestamp: string;
  loadTime: number;
  statusCode: number | null;
  screenshots: ScreenshotResult[];
  flows: FlowResult[];
  consoleErrors: string[];
  warnings: string[];
  overall: 'PASS' | 'FAIL' | 'WARNING';
}

async function runBrowse(options: BrowseOptions): Promise<BrowseReport> {
  const config = await loadConfig();
  const browserConfig = config.browser || {};
  
  const viewports: ('mobile' | 'desktop')[] = 
    options.viewport === 'both' || !options.viewport 
      ? ['desktop', 'mobile']
      : [options.viewport];
  
  const outputDir = options.outputDir || './screenshots';
  const timeout = options.timeout || browserConfig.defaultTimeout || DEFAULT_TIMEOUT;
  
  ensureDir(outputDir);
  
  const report: BrowseReport = {
    url: options.url,
    timestamp: new Date().toISOString(),
    loadTime: 0,
    statusCode: null,
    screenshots: [],
    flows: [],
    consoleErrors: [],
    warnings: [],
    overall: 'PASS',
  };

  let browser: Browser | null = null;

  try {
    logger.section('Browser Test');
    logger.log(`Testing: ${chalk.cyan(options.url)}`);
    
    browser = await chromium.launch({ headless: true });
    
    // Test page load
    const context = await browser.newContext({
      viewport: DEFAULT_VIEWPORTS.desktop,
      userAgent: 'Superpowers-Bot/1.0',
    });
    
    const page = await context.newPage();
    
    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      report.consoleErrors.push(error.message);
    });
    
    // Navigate and measure
    const startTime = Date.now();
    const response = await page.goto(options.url, { 
      waitUntil: 'networkidle',
      timeout,
    });
    report.loadTime = Date.now() - startTime;
    report.statusCode = response?.status() || null;
    
    if (response && response.status() >= 400) {
      report.warnings.push(`HTTP ${response.status()} received`);
      report.overall = 'WARNING';
    }
    
    logger.success(`Page loaded in ${report.loadTime}ms`);
    
    // Take screenshots for each viewport
    logger.section('Screenshots');
    
    for (const viewportName of viewports) {
      const viewport = browserConfig.viewports?.[viewportName] || DEFAULT_VIEWPORTS[viewportName];
      
      const screenshotContext = await browser.newContext({
        viewport,
        userAgent: viewportName === 'mobile' 
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      });
      
      const screenshotPage = await screenshotContext.newPage();
      await screenshotPage.goto(options.url, { waitUntil: 'networkidle', timeout });
      
      const filename = `${slugifyUrl(options.url)}-${viewportName}-${formatDate()}.png`;
      const filepath = path.join(outputDir, filename);
      
      await screenshotPage.screenshot({ 
        path: filepath,
        fullPage: true,
      });
      
      report.screenshots.push({
        viewport: viewportName,
        path: filepath,
        success: true,
      });
      
      logger.success(`${viewportName}: ${filepath}`);
      
      await screenshotContext.close();
    }
    
    // Run flows if specified
    if (options.flows && options.flows.length > 0) {
      logger.section('Flow Tests');
      
      const flows = browserConfig.flows || {};
      
      for (const flowName of options.flows) {
        const flowUrls = flows[flowName];
        
        if (!flowUrls) {
          logger.warn(`Unknown flow: ${flowName}`);
          report.warnings.push(`Unknown flow: ${flowName}`);
          continue;
        }
        
        for (const flowUrl of flowUrls) {
          const fullUrl = flowUrl.startsWith('http') 
            ? flowUrl 
            : new URL(flowUrl, options.url).toString();
          
          const result = await testFlow(browser, fullUrl, flowName, timeout);
          report.flows.push(result);
          
          if (result.success) {
            logger.success(`${flowName}: ${flowUrl} (${result.duration}ms)`);
          } else {
            logger.error(`${flowName}: ${flowUrl} - ${result.error}`);
            report.overall = 'FAIL';
          }
        }
      }
    }
    
    // Check for error selectors
    const errorSelectors = ['.error', '.alert-error', '[data-testid="error"]'];
    for (const selector of errorSelectors) {
      const hasError = await page.locator(selector).count() > 0;
      if (hasError) {
        report.warnings.push(`Error element found: ${selector}`);
      }
    }
    
    await context.close();
    
  } catch (error) {
    report.overall = 'FAIL';
    report.warnings.push(`Browser error: ${error instanceof Error ? error.message : String(error)}`);
    logger.error(error instanceof Error ? error.message : String(error));
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return report;
}

async function testFlow(
  browser: Browser, 
  url: string, 
  flowName: string,
  timeout: number
): Promise<FlowResult> {
  const startTime = Date.now();
  const context = await browser.newContext();
  
  try {
    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout });
    
    // Check for common error indicators
    const errorText = await page.locator('body').innerText();
    const hasErrorPage = errorText.includes('404') || 
                         errorText.includes('Error') || 
                         errorText.includes('Not Found');
    
    await context.close();
    
    return {
      name: flowName,
      url,
      success: response?.ok() === true && !hasErrorPage,
      duration: Date.now() - startTime,
      error: hasErrorPage ? 'Error page detected' : undefined,
    };
  } catch (error) {
    await context.close();
    return {
      name: flowName,
      url,
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function slugifyUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/\./g, '-');
  } catch {
    return url.replace(/[^a-z0-9]/gi, '-');
  }
}

function generateReport(report: BrowseReport): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold(`\n🌐 Browser Test Report: ${report.url}\n`));
  
  if (report.overall === 'PASS') {
    lines.push(chalk.green('✅ OVERALL: PASS\n'));
  } else if (report.overall === 'WARNING') {
    lines.push(chalk.yellow('⚠️ OVERALL: WARNING\n'));
  } else {
    lines.push(chalk.red('❌ OVERALL: FAIL\n'));
  }
  
  lines.push(`⏱️ Load time: ${report.loadTime}ms`);
  lines.push(`📊 Status: ${report.statusCode || 'unknown'}\n`);
  
  if (report.screenshots.length > 0) {
    lines.push(chalk.bold('📸 Screenshots:'));
    for (const screenshot of report.screenshots) {
      lines.push(`   ${screenshot.viewport}: ${screenshot.path}`);
    }
    lines.push('');
  }
  
  if (report.flows.length > 0) {
    lines.push(chalk.bold('🔍 Flow Results:'));
    for (const flow of report.flows) {
      const icon = flow.success ? '✅' : '❌';
      lines.push(`   ${icon} ${flow.name}: ${flow.url} (${flow.duration}ms)`);
      if (flow.error) {
        lines.push(`      Error: ${flow.error}`);
      }
    }
    lines.push('');
  }
  
  if (report.consoleErrors.length > 0) {
    lines.push(chalk.bold('⚠️ Console Errors:'));
    for (const error of report.consoleErrors.slice(0, 5)) {
      lines.push(`   - ${error.substring(0, 100)}${error.length > 100 ? '...' : ''}`);
    }
    if (report.consoleErrors.length > 5) {
      lines.push(`   ... and ${report.consoleErrors.length - 5} more`);
    }
    lines.push('');
  }
  
  if (report.warnings.length > 0) {
    lines.push(chalk.bold('⚠️ Warnings:'));
    for (const warning of report.warnings) {
      lines.push(`   - ${warning}`);
    }
  }
  
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  const url = args._ as string || args.url as string;
  
  if (!url) {
    console.error(chalk.red('Error: URL is required'));
    console.log('Usage: browse <url> [--viewport=mobile|desktop|both] [--flows=name1,name2] [--output-dir=./screenshots]');
    process.exit(1);
  }
  
  const options: BrowseOptions = {
    url,
    viewport: (args.viewport as 'mobile' | 'desktop' | 'both') || 'both',
    flows: args.flows ? String(args.flows).split(',') : undefined,
    outputDir: args['output-dir'] as string || './screenshots',
    timeout: args.timeout ? parseInt(args.timeout as string, 10) : undefined,
    silent: args.silent === true,
  };
  
  try {
    const report = await runBrowse(options);
    console.log(generateReport(report));
    process.exit(report.overall === 'FAIL' ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  }
}

main();
