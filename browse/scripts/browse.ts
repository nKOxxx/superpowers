#!/usr/bin/env node
/**
 * Browse CLI script - /browse command handler
 */

import { BrowseSkill, type BrowseOptions, type BrowseResult } from '../src/index.js';
import { parseArgs, ConsoleLogger } from '@openclaw/superpowers-shared';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const logger = new ConsoleLogger(args.verbose ? 'debug' : 'info');

  // Get URL
  const url = args._ as string || args.url as string;
  
  if (!url) {
    console.error('Usage: browse <url> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --screenshot          Capture full-page screenshot');
    console.error('  --viewport <WxH>      Set viewport size (default: 1280x720)');
    console.error('  --audit               Run accessibility audit');
    console.error('  --wait-for <selector> Wait for element before capturing');
    console.error('  --timeout <ms>        Navigation timeout (default: 30000)');
    console.error('  --compare <path>      Compare against baseline image');
    console.error('  --mobile              Emulate mobile device');
    console.error('  --dark-mode           Enable dark mode');
    console.error('  --browser <type>      Browser: chromium, firefox, webkit');
    console.error('  --verbose             Enable verbose logging');
    process.exit(1);
  }

  // Parse viewport
  let viewport: { width: number; height: number } | undefined;
  if (args.viewport) {
    const [width, height] = String(args.viewport).split('x').map(Number);
    if (width && height) {
      viewport = { width, height };
    }
  }

  // Parse timeout
  const timeout = args.timeout ? parseInt(String(args.timeout), 10) : undefined;

  const options: BrowseOptions = {
    url,
    screenshot: !!args.screenshot,
    viewport,
    audit: !!args.audit,
    waitFor: args['wait-for'] as string,
    timeout,
    compareBaseline: args.compare as string,
    mobile: !!args.mobile,
    darkMode: !!args['dark-mode'],
    browser: (args.browser as 'chromium' | 'firefox' | 'webkit') || 'chromium',
    fullPage: true
  };

  logger.info(`Starting browse: ${url}`);

  const skill = new BrowseSkill(logger);
  const result = await skill.browse(options);

  // Output results
  console.log('');
  console.log('═══ Browse Results ═══');
  console.log(`URL:      ${result.url}`);
  console.log(`Title:    ${result.title || '(no title)'}`);
  console.log(`Load Time: ${result.loadTime}ms`);
  
  if (result.screenshotPath) {
    console.log(`Screenshot: ${result.screenshotPath}`);
  }

  if (result.auditResults) {
    console.log('');
    console.log('═══ Accessibility Audit ═══');
    console.log(`Score: ${result.auditResults.score}/100`);
    console.log(`Violations: ${result.auditResults.violations.length}`);
    console.log(`Passes: ${result.auditResults.passes}`);
    
    if (result.auditResults.violations.length > 0) {
      console.log('');
      console.log('Violations:');
      for (const v of result.auditResults.violations.slice(0, 5)) {
        console.log(`  [${v.impact.toUpperCase()}] ${v.description}`);
        console.log(`    Help: ${v.help}`);
        console.log(`    URL: ${v.helpUrl}`);
      }
      if (result.auditResults.violations.length > 5) {
        console.log(`  ... and ${result.auditResults.violations.length - 5} more`);
      }
    }
  }

  if (result.comparisonResult) {
    console.log('');
    console.log('═══ Visual Comparison ═══');
    console.log(`Difference: ${result.comparisonResult.diffPercentage.toFixed(2)}%`);
    console.log(`Match: ${result.comparisonResult.matched ? '✓ YES' : '✗ NO'}`);
  }

  if (result.errors.length > 0) {
    console.log('');
    console.log('═══ Errors ═══');
    for (const error of result.errors) {
      console.log(`  ✗ ${error}`);
    }
  }

  // Exit with appropriate code
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});