#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { QAController } from './qa-controller';
import { QAOptions } from './types';

const program = new Command();

program
  .name('qa')
  .description('Systematic testing with smart test selection')
  .version('1.0.0');

program
  .option('-c, --changed', 'Run tests only for changed files', false)
  .option('--coverage', 'Generate coverage report', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('-f, --file <path>', 'Run specific test file')
  .option('-g, --grep <pattern>', 'Filter by pattern')
  .option('--framework <name>', 'Force framework (jest, vitest, mocha, pytest)')
  .option('--full', 'Run full test suite', false)
  .option('--security', 'Run security-focused tests', false)
  .option('--e2e', 'Run end-to-end tests', false)
  .option('--unit', 'Run unit tests only', false)
  .option('--integration', 'Run integration tests', false)
  .option('--fail-fast', 'Stop on first failure', false)
  .option('--parallel', 'Run tests in parallel', true)
  .option('--max-workers <n>', 'Maximum parallel workers', '4')
  .option('--silent', 'Silent mode', false)
  .option('--json', 'Output JSON results', false)
  .action(async (options: any) => {
    try {
      const qaOptions: QAOptions = {
        changed: options.changed,
        coverage: options.coverage,
        watch: options.watch,
        file: options.file,
        grep: options.grep,
        framework: options.framework,
        full: options.full,
        security: options.security,
        e2e: options.e2e,
        unit: options.unit,
        integration: options.integration,
        failFast: options.failFast,
        parallel: options.parallel,
        maxWorkers: parseInt(options.maxWorkers, 10),
        silent: options.silent,
        json: options.json
      };

      const controller = new QAController(qaOptions);
      
      if (!options.silent) {
        console.log(chalk.blue('🧪 QA:'), chalk.white('Running tests...'));
      }

      const result = await controller.execute();

      if (!options.silent) {
        printResults(result);
      } else if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      }

      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function printResults(result: any) {
  console.log('');
  
  // Status
  const statusIcon = result.success ? chalk.green('✓') : chalk.red('✗');
  const statusText = result.success ? chalk.green('PASSED') : chalk.red('FAILED');
  console.log(statusIcon, chalk.blue('Status:'), statusText);

  // Summary
  console.log(chalk.blue('📊 Summary:'));
  console.log(chalk.gray(`  Total: ${result.totalTests}`));
  console.log(chalk.green(`  Passed: ${result.passed}`));
  if (result.failed > 0) console.log(chalk.red(`  Failed: ${result.failed}`));
  if (result.skipped > 0) console.log(chalk.yellow(`  Skipped: ${result.skipped}`));
  if (result.pending > 0) console.log(chalk.gray(`  Pending: ${result.pending}`));

  // Duration
  if (result.duration) {
    console.log(chalk.blue('⏱️  Duration:'), chalk.gray(`${result.duration}ms`));
  }

  // Framework detected
  console.log(chalk.blue('🔧 Framework:'), chalk.gray(result.framework || 'auto-detected'));

  // Coverage
  if (result.coverage) {
    console.log(chalk.blue('📈 Coverage:'));
    const cov = result.coverage;
    const formatPct = (pct: number) => {
      if (pct >= 80) return chalk.green(`${pct}%`);
      if (pct >= 60) return chalk.yellow(`${pct}%`);
      return chalk.red(`${pct}%`);
    };
    console.log(chalk.gray(`  Statements: ${formatPct(cov.statements)}`));
    console.log(chalk.gray(`  Branches: ${formatPct(cov.branches)}`));
    console.log(chalk.gray(`  Functions: ${formatPct(cov.functions)}`));
    console.log(chalk.gray(`  Lines: ${formatPct(cov.lines)}`));
  }

  // Failures
  if (result.failures && result.failures.length > 0) {
    console.log('');
    console.log(chalk.red('Failures:'));
    result.failures.forEach((failure: any, idx: number) => {
      console.log(chalk.red(`  ${idx + 1}. ${failure.title}`));
      console.log(chalk.gray(`     ${failure.file}`));
      if (failure.message) {
        console.log(chalk.gray(`     ${failure.message.split('\n')[0]}`));
      }
    });
  }

  // Smart selection info
  if (result.changedFiles) {
    console.log('');
    console.log(chalk.blue('📝 Changed files analyzed:'), result.changedFiles.length);
  }
}

program.parse();
