#!/usr/bin/env node
/**
 * QA CLI - Command line interface for QA skill
 */

import { QaSkill, type QaOptions, type TestFramework } from '../src/index.js';
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
    }
  }
  
  return result;
}

function showHelp(): void {
  console.log(`
QA - Systematic testing with smart test selection

Usage: qa [options]

Options:
  --changed           Run tests only for changed files
  --coverage          Generate coverage report
  --watch             Watch mode
  --file <path>       Run specific test file
  --grep <pattern>    Filter by pattern
  --framework <name>  Force framework (jest, vitest, mocha, pytest)
  --telegram          Output formatted for Telegram
  --help              Show this help

Examples:
  qa
  qa --changed
  qa --coverage
  qa --file src/utils.test.ts
  qa --grep "auth"
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  const skill = new QaSkill();
  
  const options: QaOptions = {
    changed: args.changed === true,
    coverage: args.coverage === true,
    watch: args.watch === true,
    file: args.file as string,
    grep: args.grep as string,
    framework: args.framework as TestFramework,
  };
  
  try {
    const result = await skill.run(options);
    
    if (args.telegram) {
      const telegramResult = TelegramFormatter.formatQaResult(result);
      console.log(JSON.stringify(telegramResult, null, 2));
    } else {
      console.log('\n═══ Test Results ═══');
      console.log(`Framework: ${result.framework}`);
      console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
      console.log(`\nTotal: ${result.totalTests}`);
      console.log(`Passed: ${result.passedTests}`);
      console.log(`Failed: ${result.failedTests}`);
      console.log(`Skipped: ${result.skippedTests}`);
      
      if (result.coverage) {
        console.log(`\nCoverage:`);
        console.log(`  Lines: ${result.coverage.lines.percentage.toFixed(1)}%`);
        console.log(`  Functions: ${result.coverage.functions.percentage.toFixed(1)}%`);
        console.log(`  Branches: ${result.coverage.branches.percentage.toFixed(1)}%`);
        console.log(`  Overall: ${result.coverage.overall.toFixed(1)}%`);
      }
      
      if (result.failures.length > 0) {
        console.log(`\nFailures:`);
        for (const failure of result.failures) {
          console.log(`  ${failure.testName}: ${failure.error}`);
        }
      }
    }
    
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('QA failed:', error);
    process.exit(1);
  }
}

main();
