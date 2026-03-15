import { browseCommand } from './browse/index.js';
import { qaCommand } from './qa/index.js';
import { shipCommand } from './ship/index.js';
import { planCeoReviewCommand } from './plan-ceo-review/index.js';
import chalk from 'chalk';

async function runTests(): Promise<void> {
  console.log(chalk.blue('🧪 Superpowers Skills Test Suite\n'));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: plan-ceo-review (no external deps)
  try {
    console.log(chalk.cyan('Test 1: /plan-ceo-review'));
    await planCeoReviewCommand('Test Feature: A premium secure messaging platform', {
      brand: '4',
      attention: '5',
      trust: '3'
    });
    console.log(chalk.green('✅ /plan-ceo-review PASSED\n'));
    passed++;
  } catch (error) {
    console.error(chalk.red('❌ /plan-ceo-review FAILED:'), error);
    failed++;
  }
  
  // Test 2: browse (requires Playwright)
  try {
    console.log(chalk.cyan('Test 2: /browse'));
    await browseCommand('https://example.com', {
      viewport: 'desktop',
      base64: false
    });
    console.log(chalk.green('✅ /browse PASSED\n'));
    passed++;
  } catch (error) {
    console.error(chalk.red('❌ /browse FAILED:'), error);
    failed++;
  }
  
  // Test 3: qa (requires git repo)
  try {
    console.log(chalk.cyan('Test 3: /qa'));
    await qaCommand({ mode: 'smoke' });
    console.log(chalk.green('✅ /qa PASSED\n'));
    passed++;
  } catch (error) {
    console.error(chalk.red('❌ /qa FAILED:'), error);
    failed++;
  }
  
  // Test 4: ship (dry run)
  try {
    console.log(chalk.cyan('Test 4: /ship'));
    await shipCommand({ version: 'patch', dryRun: true });
    console.log(chalk.green('✅ /ship PASSED\n'));
    passed++;
  } catch (error) {
    console.error(chalk.red('❌ /ship FAILED:'), error);
    failed++;
  }
  
  console.log(chalk.blue('Test Results:'));
  console.log(chalk.green(`  Passed: ${passed}`));
  console.log(chalk.red(`  Failed: ${failed}`));
  console.log(chalk.gray(`  Total: ${passed + failed}`));
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
