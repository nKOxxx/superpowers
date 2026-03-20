#!/usr/bin/env node
/**
 * Browse CLI - Command line interface for browse skill
 */

import { BrowseSkill, type BrowseOptions } from '../src/index.js';
import { TelegramFormatter } from '@openclaw/superpowers-shared';

function parseArgs(args: string[]): Record<string, string | boolean | undefined> {
  const result: Record<string, string | boolean | undefined> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result[key] = nextArg;
        i++;
      } else {
        result[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      result[key] = true;
    } else if (!result.url) {
      result.url = arg;
    }
  }
  
  return result;
}

function showHelp(): void {
  console.log(`
Browse - Browser automation with Playwright

Usage: browse <url> [options]

Options:
  --screenshot          Capture full-page screenshot
  --viewport <WxH>      Set viewport size (default: 1280x720)
  --audit               Run accessibility audit (axe-core)
  --wait-for <selector> Wait for element before capturing
  --timeout <ms>        Navigation timeout (default: 30000)
  --compare <path>      Compare against baseline image
  --mobile              Emulate mobile device
  --dark-mode           Enable dark mode
  --browser <type>      Browser type: chromium, firefox, webkit
  --telegram            Output formatted for Telegram
  --help                Show this help

Examples:
  browse https://example.com
  browse https://example.com --screenshot --audit
  browse https://example.com --mobile --viewport 375x667
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  
  if (args.help || (!args.url && process.argv.length <= 2)) {
    showHelp();
    process.exit(0);
  }
  
  if (!args.url || typeof args.url !== 'string') {
    console.error('Error: URL is required');
    showHelp();
    process.exit(1);
  }
  
  const skill = new BrowseSkill();
  
  const options: BrowseOptions = {
    url: args.url,
    screenshot: args.screenshot === true,
    audit: args.audit === true,
    mobile: args.mobile === true,
    darkMode: args.darkMode === true,
    timeout: args.timeout ? parseInt(args.timeout as string, 10) : undefined,
    browser: (args.browser as 'chromium' | 'firefox' | 'webkit') || 'chromium',
  };
  
  if (args.viewport && typeof args.viewport === 'string') {
    const [width, height] = args.viewport.split('x').map(Number);
    if (width && height) {
      options.viewport = { width, height };
    }
  }
  
  if (args.waitFor && typeof args.waitFor === 'string') {
    options.waitFor = args.waitFor;
  }
  
  if (args.compare && typeof args.compare === 'string') {
    options.compareBaseline = args.compare;
  }
  
  try {
    const result = await skill.browse(options);
    
    if (args.telegram) {
      const telegramResult = TelegramFormatter.formatBrowseResult(result);
      console.log(JSON.stringify(telegramResult, null, 2));
    } else {
      console.log('\n═══ Browse Results ═══');
      console.log(`URL: ${result.url}`);
      console.log(`Title: ${result.title || 'N/A'}`);
      console.log(`Load Time: ${result.loadTime}ms`);
      
      if (result.screenshotPath) {
        console.log(`Screenshot: ${result.screenshotPath}`);
      }
      
      if (result.auditResults) {
        console.log(`\nAccessibility Score: ${result.auditResults.score}/100`);
        if (result.auditResults.violations.length > 0) {
          console.log(`Violations: ${result.auditResults.violations.length}`);
        }
      }
      
      if (result.comparisonResult) {
        console.log(`\nVisual Diff: ${result.comparisonResult.diffPercentage.toFixed(2)}%`);
        console.log(`Match: ${result.comparisonResult.matched ? 'Yes' : 'No'}`);
      }
      
      if (result.errors.length > 0) {
        console.log(`\nErrors: ${result.errors.join(', ')}`);
      }
    }
    
    process.exit(result.errors.length > 0 && !result.screenshotPath ? 1 : 0);
  } catch (error) {
    console.error('Browse failed:', error);
    process.exit(1);
  }
}

main();
