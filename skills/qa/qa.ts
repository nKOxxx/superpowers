#!/usr/bin/env node
/**
 * qa.ts - Systematic testing based on code changes
 * 
 * Features:
 * - Diff-based test selection
 * - Auto-detect test runners (jest, vitest, mocha)
 * - Coverage analysis
 * - Intelligent test file mapping
 * - Telegram notifications
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync, spawn } from 'child_process';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, relative, resolve } from 'path';
import simpleGit from 'simple-git';

const program = new Command();
const git = simpleGit();

interface QAOptions {
  diff?: string;
  testRunner?: 'jest' | 'vitest' | 'mocha' | 'auto';
  selective?: boolean;
  coverage?: boolean;
  watch?: boolean;
  failFast?: boolean;
  parallel?: boolean;
  pattern?: string;
  output?: string;
  telegram?: boolean;
  verbose?: boolean;
}

interface TestRunner {
  name: string;
  detect: () => boolean;
  testCommand: (files: string[], options: QAOptions) => string[];
  coverageCommand: (files: string[], options: QAOptions) => string[];
}

const testRunners: TestRunner[] = [
  {
    name: 'vitest',
    detect: () => existsSync('vitest.config.ts') || existsSync('vitest.config.js') || 
                   existsSync('vite.config.ts') || existsSync('vite.config.js'),
    testCommand: (files, opts) => ['npx', 'vitest', 'run', ...(opts.failFast ? ['--bail=1'] : []), ...files],
    coverageCommand: (files, opts) => ['npx', 'vitest', 'run', '--coverage', ...(opts.failFast ? ['--bail=1'] : []), ...files]
  },
  {
    name: 'jest',
    detect: () => existsSync('jest.config.js') || existsSync('jest.config.ts') || 
                   existsSync('package.json') && JSON.parse(readFileSync('package.json') || '{}').jest !== undefined,
    testCommand: (files, opts) => ['npx', 'jest', ...(opts.failFast ? ['--bail'] : []), ...files],
    coverageCommand: (files, opts) => ['npx', 'jest', '--coverage', ...(opts.failFast ? ['--bail'] : []), ...files]
  },
  {
    name: 'mocha',
    detect: () => existsSync('.mocharc.js') || existsSync('.mocharc.json') ||
                   existsSync('mocha.opts'),
    testCommand: (files, opts) => ['npx', 'mocha', ...(opts.failFast ? ['--bail'] : []), ...files],
    coverageCommand: (files, opts) => ['npx', 'nyc', 'mocha', ...(opts.failFast ? ['--bail'] : []), ...files]
  }
];

function readFileSync(path: string): string | null {
  try {
    return require('fs').readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

program
  .name('qa')
  .description('Systematic testing based on code changes')
  .option('--diff <ref>', 'git reference to diff against', 'HEAD~1')
  .option('--test-runner <runner>', 'test runner (jest, vitest, mocha, auto)', 'auto')
  .option('-s, --selective', 'run only affected tests')
  .option('-c, --coverage', 'generate coverage report')
  .option('-w, --watch', 'watch mode')
  .option('--fail-fast', 'stop on first failure')
  .option('-p, --parallel', 'run tests in parallel')
  .option('--pattern <glob>', 'test file pattern', '**/*.{test,spec}.{ts,tsx,js,jsx}')
  .option('-o, --output <dir>', 'output directory', './qa-reports')
  .option('--telegram', 'send results to Telegram')
  .option('-v, --verbose', 'verbose output')
  .action(async (options: QAOptions) => {
    const spinner = ora('Analyzing repository...').start();
    const startTime = Date.now();

    try {
      // Ensure we're in a git repo
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        throw new Error('Not a git repository');
      }

      // Get changed files
      spinner.text = `Getting diff against ${options.diff}`;
      const diffSummary = await git.diffSummary([options.diff || 'HEAD~1']);
      const changedFiles = diffSummary.files.map(f => f.file);
      
      if (changedFiles.length === 0) {
        spinner.succeed('No files changed');
        return;
      }

      spinner.info(`${changedFiles.length} files changed`);
      if (options.verbose) {
        changedFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
      }

      // Detect test runner
      let runner: TestRunner;
      if (options.testRunner === 'auto') {
        runner = testRunners.find(r => r.detect()) || testRunners[0];
      } else {
        runner = testRunners.find(r => r.name === options.testRunner) || testRunners[0];
      }
      spinner.info(`Using test runner: ${chalk.cyan(runner.name)}`);

      // Find test files
      let testFiles: string[] = [];
      if (options.selective) {
        spinner.text = 'Mapping changed files to tests...';
        testFiles = await findRelatedTests(changedFiles, options.pattern);
        
        if (testFiles.length === 0) {
          spinner.warn('No test files found for changed files');
          console.log(chalk.yellow('\nRecommendations:'));
          changedFiles.forEach(f => {
            if (!f.includes('.test.') && !f.includes('.spec.')) {
              console.log(chalk.yellow(`  - Consider adding tests for: ${f}`));
            }
          });
          return;
        }
      } else {
        // Find all test files
        testFiles = await findAllTestFiles(options.pattern);
      }

      spinner.info(`${testFiles.length} test files to run`);
      if (options.verbose) {
        testFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
      }

      // Ensure output directory
      await mkdir(options.output || './qa-reports', { recursive: true });

      // Run tests
      spinner.text = 'Running tests...';
      const cmd = options.coverage 
        ? runner.coverageCommand(testFiles, options)
        : runner.testCommand(testFiles, options);

      const testResult = await runTests(cmd, options);

      // Generate report
      spinner.text = 'Generating report...';
      const report = await generateReport({
        runner: runner.name,
        changedFiles,
        testFiles,
        testResult,
        duration: Date.now() - startTime,
        options
      });

      const reportPath = join(options.output || './qa-reports', `report-${Date.now()}.json`);
      await writeFile(reportPath, JSON.stringify(report, null, 2));

      if (testResult.success) {
        spinner.succeed(chalk.green(`All tests passed (${testResult.passed}/${testResult.total})`));
      } else {
        spinner.fail(chalk.red(`Tests failed (${testResult.failed}/${testResult.total})`));
      }

      console.log(chalk.blue(`\nReport saved: ${reportPath}`));

      // Telegram notification
      if (options.telegram) {
        await sendTelegramNotification(report);
      }

      process.exit(testResult.success ? 0 : 1);

    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

// Find related tests for changed files
async function findRelatedTests(changedFiles: string[], pattern: string): Promise<string[]> {
  const testFiles = new Set<string>();
  
  for (const file of changedFiles) {
    // Skip test files themselves
    if (file.includes('.test.') || file.includes('.spec.')) {
      testFiles.add(file);
      continue;
    }

    // Map source file to test file
    const possibleTests = [
      file.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
      file.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
      file.replace(/\/([^/]+)\.(ts|tsx|js|jsx)$/, '/__tests__/$1.test.$2'),
      file.replace(/\/src\//, '/tests/').replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
    ];

    for (const testPath of possibleTests) {
      if (existsSync(testPath)) {
        testFiles.add(testPath);
      }
    }

    // Check for co-located __tests__ folder
    const dir = file.substring(0, file.lastIndexOf('/'));
    const testDir = join(dir, '__tests__');
    if (existsSync(testDir)) {
      const dirTests = await findTestFilesInDir(testDir);
      dirTests.forEach(t => testFiles.add(t));
    }
  }

  return Array.from(testFiles);
}

// Find all test files
async function findAllTestFiles(pattern: string): Promise<string[]> {
  const { glob } = await import('glob');
  return glob(pattern, { ignore: ['node_modules/**'] });
}

// Find test files in directory
async function findTestFilesInDir(dir: string): Promise<string[]> {
  const { glob } = await import('glob');
  return glob(join(dir, '*.{test,spec}.{ts,tsx,js,jsx}'));
}

// Run tests and capture results
interface TestRunResult {
  success: boolean;
  passed: number;
  failed: number;
  total: number;
  output: string;
}

async function runTests(cmd: string[], options: QAOptions): Promise<TestRunResult> {
  return new Promise((resolve) => {
    let output = '';
    let passed = 0;
    let failed = 0;

    const child = spawn(cmd[0], cmd.slice(1), {
      stdio: options.verbose ? 'inherit' : 'pipe',
      shell: true
    });

    if (!options.verbose && child.stdout) {
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
    }

    if (!options.verbose && child.stderr) {
      child.stderr.on('data', (data) => {
        output += data.toString();
      });
    }

    child.on('close', (code) => {
      // Parse test results from output
      const passedMatch = output.match(/(\d+) passing|✓\s*(\d+) test/i);
      const failedMatch = output.match(/(\d+) failing|✗\s*(\d+) test/i);
      
      passed = parseInt(passedMatch?.[1] || passedMatch?.[2] || '0');
      failed = parseInt(failedMatch?.[1] || failedMatch?.[2] || '0');

      resolve({
        success: code === 0,
        passed,
        failed,
        total: passed + failed,
        output
      });
    });
  });
}

// Generate report
interface ReportData {
  runner: string;
  changedFiles: string[];
  testFiles: string[];
  testResult: TestRunResult;
  duration: number;
  options: QAOptions;
}

async function generateReport(data: ReportData): Promise<any> {
  return {
    timestamp: new Date().toISOString(),
    runner: data.runner,
    summary: {
      duration: data.duration,
      filesChanged: data.changedFiles.length,
      testsRun: data.testResult.total,
      passed: data.testResult.passed,
      failed: data.testResult.failed,
      success: data.testResult.success
    },
    changedFiles: data.changedFiles,
    testFiles: data.testFiles,
    recommendations: generateRecommendations(data)
  };
}

function generateRecommendations(data: ReportData): string[] {
  const recs: string[] = [];
  
  // Check for untested files
  const untested = data.changedFiles.filter(f => {
    if (f.includes('.test.') || f.includes('.spec.')) return false;
    return !data.testFiles.some(t => t.includes(f.replace(/\.[^.]+$/, '')));
  });

  if (untested.length > 0) {
    recs.push(`Consider adding tests for: ${untested.slice(0, 3).join(', ')}${untested.length > 3 ? '...' : ''}`);
  }

  if (data.testResult.failed > 0) {
    recs.push('Fix failing tests before merging');
  }

  return recs;
}

// Send Telegram notification
async function sendTelegramNotification(report: any): Promise<void> {
  try {
    const status = report.summary.success ? '✅ PASSED' : '❌ FAILED';
    const message = `
${status} QA Report

📊 Summary:
• Tests: ${report.summary.testsRun} (${report.summary.passed} passed, ${report.summary.failed} failed)
• Files changed: ${report.summary.filesChanged}
• Duration: ${(report.summary.duration / 1000).toFixed(1)}s

${report.recommendations.length > 0 ? '💡 ' + report.recommendations[0] : ''}
    `.trim();

    execSync(`openclaw message send --channel telegram --message "${message}"`, {
      stdio: 'pipe'
    });
  } catch (error) {
    console.log(chalk.yellow('Failed to send Telegram notification'));
  }
}

program.parse();
