#!/usr/bin/env node
/**
 * QA CLI script - /qa command handler
 */

import { QaSkill, type QaOptions, type TestResult } from '../src/index.js';
import { parseArgs, ConsoleLogger } from '@openclaw/superpowers-shared';

function formatCoverage(coverage: { percentage: number }): string {
  const color = coverage.percentage >= 80 ? '\x1b[32m' : 
                coverage.percentage >= 60 ? '\x1b[33m' : '\x1b[31m';
  return `${color}${coverage.percentage.toFixed(1)}%\x1b[0m`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const logger = new ConsoleLogger(args.verbose ? 'debug' : 'info');

  if (args.help) {
    console.log('Usage: qa [options]');
    console.log('');
    console.log('Options:');
    console.log('  --changed         Run tests only for changed files');
    console.log('  --coverage        Generate coverage report');
    console.log('  --watch           Watch mode');
    console.log('  --file <path>     Run specific test file');
    console.log('  --grep <pattern>  Filter by pattern');
    console.log('  --framework <n>   Force framework (jest, vitest, mocha, pytest)');
    console.log('  --verbose         Enable verbose logging');
    process.exit(0);
  }

  const options: QaOptions = {
    changed: !!args.changed,
    coverage: !!args.coverage,
    watch: !!args.watch,
    file: args.file as string,
    grep: args.grep as string,
    framework: args.framework as QaOptions['framework']
  };

  logger.info('Starting QA run...');

  const skill = new QaSkill(process.cwd(), logger);
  const result = await skill.run(options);

  // Output results
  console.log('');
  console.log('═══ Test Results ═══');
  console.log(`Framework: ${result.framework}`);
  console.log(`Status:    ${result.passed ? '\x1b[32m✓ PASSED\x1b[0m' : '\x1b[31m✗ FAILED\x1b[0m'}`);
  console.log('');
  console.log(`Total:     ${result.totalTests}`);
  console.log(`\x1b[32mPassed:    ${result.passedTests}\x1b[0m`);
  console.log(`\x1b[31mFailed:    ${result.failedTests}\x1b[0m`);
  console.log(`Skipped:   ${result.skippedTests}`);

  if (result.coverage) {
    console.log('');
    console.log('═══ Coverage Report ═══');
    console.log(`Lines:      ${formatCoverage(result.coverage.lines)} (${result.coverage.lines.covered}/${result.coverage.lines.total})`);
    console.log(`Functions:  ${formatCoverage(result.coverage.functions)} (${result.coverage.functions.covered}/${result.coverage.functions.total})`);
    console.log(`Branches:   ${formatCoverage(result.coverage.branches)} (${result.coverage.branches.covered}/${result.coverage.branches.total})`);
    console.log(`Overall:    ${formatCoverage({ percentage: result.coverage.overall })}`);
  }

  if (result.failures.length > 0) {
    console.log('');
    console.log('═══ Failures ═══');
    for (const failure of result.failures.slice(0, 10)) {
      console.log(`  \x1b[31m✗ ${failure.testName}\x1b[0m`);
      if (failure.filePath) {
        console.log(`    File: ${failure.filePath}`);
      }
      console.log(`    ${failure.error.split('\n')[0]}`);
    }
    if (result.failures.length > 10) {
      console.log(`  ... and ${result.failures.length - 10} more failures`);
    }
  }

  console.log('');
  console.log(`Duration: ${result.duration}ms`);

  // Exit with appropriate code
  process.exit(result.passed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});