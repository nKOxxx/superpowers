#!/usr/bin/env node
/**
 * /browse - Browser Automation Skill
 * Visual testing and browser automation using Playwright
 */

import { chromium, Browser, Page, BrowserContext, ViewportSize } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from './lib/args.js';
import { loadConfig } from './lib/config.js';
import { captureScreenshot, ScreenshotOptions } from './lib/screenshot.js';
import { runFlow, FlowConfig } from './lib/flows.js';

interface BrowseOptions {
  url: string;
  viewport?: string;
  width?: number;
  height?: number;
  flows?: string[];
  outputDir?: string;
  fullPage?: boolean;
  waitFor?: string;
}

const DEFAULT_VIEWPORT: ViewportSize = { width: 1280, height: 720 };
const VIEWPORTS: Record<string, ViewportSize> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  '1440p': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 }
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const options = parseBrowseArgs(args);
  const config = await loadConfig();
  
  console.log(`🌐 Browse: ${options.url}`);
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const viewport = getViewport(options);
    const context = await browser.newContext({ viewport });
    
    if (options.flows && options.flows.length > 0) {
      await runFlows(context, options, config);
    } else {
      await captureSingleScreenshot(context, options);
    }
    
    console.log('✅ Browse complete');
  } finally {
    await browser.close();
  }
}

function parseBrowseArgs(args: string[]): BrowseOptions {
  const url = args[0] || '';
  const options: BrowseOptions = { url, fullPage: true };
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--viewport' || arg === '-v') {
      options.viewport = args[++i];
    } else if (arg === '--width' || arg === '-w') {
      const width = args[++i];
      if (width) options.width = parseInt(width, 10);
    } else if (arg === '--height' || arg === '-h') {
      const height = args[++i];
      if (height) options.height = parseInt(height, 10);
    } else if (arg === '--flows' || arg === '-f') {
      const flows = args[++i];
      if (flows) options.flows = flows.split(',').map(f => f.trim());
    } else if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg === '--no-full-page') {
      options.fullPage = false;
    } else if (arg === '--wait-for') {
      options.waitFor = args[++i];
    }
  }
  
  return options;
}

function getViewport(options: BrowseOptions): ViewportSize {
  if (options.width && options.height) {
    return { width: options.width, height: options.height };
  }
  if (options.viewport && VIEWPORTS[options.viewport]) {
    return VIEWPORTS[options.viewport]!;
  }
  return DEFAULT_VIEWPORT;
}

async function captureSingleScreenshot(
  context: BrowserContext, 
  options: BrowseOptions
): Promise<void> {
  const page = await context.newPage();
  
  try {
    await page.goto(options.url, { waitUntil: 'networkidle' });
    
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 5000 });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hostname = new URL(options.url).hostname.replace(/[^a-zA-Z0-9]/g, '_');
    const outputDir = options.outputDir || './screenshots';
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `${hostname}_${timestamp}.png`;
    const filepath = path.join(outputDir, filename);
    
    await page.screenshot({ 
      path: filepath, 
      fullPage: options.fullPage 
    });
    
    console.log(`📸 Screenshot saved: ${filepath}`);
  } finally {
    await page.close();
  }
}

async function runFlows(
  context: BrowserContext,
  options: BrowseOptions,
  config: any
): Promise<void> {
  const flows = config?.browser?.flows || {};
  
  for (const flowName of options.flows || []) {
    const flowConfig: FlowConfig | undefined = flows[flowName];
    
    if (!flowConfig) {
      console.warn(`⚠️ Flow "${flowName}" not found in config`);
      continue;
    }
    
    console.log(`🔄 Running flow: ${flowName}`);
    await runFlow(context, options.url, flowConfig, {
      outputDir: options.outputDir,
      viewport: getViewport(options)
    });
  }
}

function printHelp(): void {
  console.log(`
/browse - Browser Automation

Usage:
  browse <url> [options]

Options:
  --viewport, -v     Viewport preset (mobile, tablet, desktop, 1440p, 4k)
  --width, -w        Custom viewport width
  --height, -h       Custom viewport height
  --flows, -f        Comma-separated flow names from config
  --output, -o       Output directory for screenshots
  --no-full-page     Capture viewport only (not full page)
  --wait-for         CSS selector to wait for before screenshot
  --help             Show this help

Examples:
  browse https://example.com
  browse https://example.com --viewport=mobile
  browse https://example.com --flows=critical,auth
  browse https://example.com --width=1920 --height=1080
`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
