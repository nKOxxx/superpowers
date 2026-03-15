import { Command } from 'commander';
import pc from 'picocolors';
import { loadConfig, mergeWithDefaults } from '../lib/config.js';
import { isGitRepo, getChangedFiles, runTests } from '../lib/git.js';
import { existsSync } from 'fs';
import { join } from 'path';

interface QAOptions {
  mode?: 'targeted' | 'smoke' | 'full';
  diff?: string;
  coverage?: boolean;
  parallel?: boolean;
}

export function qaCommand(program: Command): void {
  program
    .command('qa')
    .description('Systematic testing as QA Lead')
    .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
    .option('-d, --diff <range>', 'Git diff range for targeted mode', 'HEAD~1')
    .option('-c, --coverage', 'Enable coverage reporting')
    .option('-p, --parallel', 'Run tests in parallel')
    .action(async (options: QAOptions) => {
      try {
        await runQA(options);
      } catch (error) {
        console.error(pc.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}

async function runQA(options: QAOptions): Promise<void> {
  const config = mergeWithDefaults(loadConfig());
  const mode = options.mode || config.qa.defaultMode || 'targeted';

  console.log(pc.cyan('══════════════════════════════════════════════════'));
  console.log(pc.cyan(`QA Mode: ${mode.toUpperCase()}`));
  console.log(pc.cyan('══════════════════════════════════════════════════'));
  console.log();

  // Check for git repo in targeted mode
  if (mode === 'targeted' && !isGitRepo()) {
    console.error(pc.red('Error: Targeted mode requires a git repository'));
    process.exit(1);
  }

  // Determine test command
  let testCommand = config.qa.testCommand || 'npm test';
  if (options.coverage && config.qa.coverageCommand) {
    testCommand = config.qa.coverageCommand;
  }

  // Run tests based on mode
  switch (mode) {
    case 'targeted':
      await runTargetedTests(options, config, testCommand);
      break;
    case 'smoke':
      await runSmokeTests(testCommand);
      break;
    case 'full':
      await runFullTests(testCommand, options);
      break;
  }
}

async function runTargetedTests(
  options: QAOptions,
  config: ReturnType<typeof mergeWithDefaults>,
  testCommand: string
): Promise<void> {
  const changedFiles = getChangedFiles(options.diff || 'HEAD~1');
  
  if (changedFiles.length === 0) {
    console.log(pc.yellow('No files changed. Running smoke tests instead.'));
    await runSmokeTests(testCommand);
    return;
  }

  console.log(pc.blue(`Files Changed: ${changedFiles.length}`));
  changedFiles.forEach(f => console.log(`  - ${f}`));
  console.log();

  // Map changed files to test files
  const testFiles = mapFilesToTests(changedFiles);
  
  if (testFiles.length === 0) {
    console.log(pc.yellow('No test files found for changed files. Running smoke tests.'));
    await runSmokeTests(testCommand);
    return;
  }

  console.log(pc.blue(`Tests Selected: ${testFiles.length}`));
  testFiles.forEach(f => console.log(`  - ${f}`));
  console.log();

  // Run tests
  const results: { file: string; passed: boolean; output: string }[] = [];
  
  for (const testFile of testFiles) {
    process.stdout.write(`  Testing ${testFile}... `);
    const { success, output } = await runTests(`${testCommand} ${testFile}`);
    results.push({ file: testFile, passed: success, output });
    
    if (success) {
      console.log(pc.green('✓'));
    } else {
      console.log(pc.red('✗'));
    }
  }

  printResults(results, config.qa.coverageThreshold);
}

async function runSmokeTests(testCommand: string): Promise<void> {
  console.log(pc.blue('Running smoke tests...'));
  console.log();

  // Try to run smoke-specific tests first
  let command = testCommand;
  
  // Check for smoke test patterns
  const smokePatterns = [
    '--grep="smoke"',
    '--tags=@smoke',
    '--testNamePattern="smoke"',
  ];

  for (const pattern of smokePatterns) {
    const { success, output } = await runTests(`${testCommand} ${pattern}`);
    if (success || output.includes('smoke') || output.includes('pass')) {
      command = `${testCommand} ${pattern}`;
      break;
    }
  }

  const { success, output } = await runTests(command);
  
  console.log(success ? pc.green('✓ Smoke tests passed') : pc.red('✗ Smoke tests failed'));
  
  if (!success) {
    console.log();
    console.log(output.slice(-500)); // Show last 500 chars
  }

  if (!success) {
    process.exit(1);
  }
}

async function runFullTests(testCommand: string, options: QAOptions): Promise<void> {
  console.log(pc.blue('Running full test suite...'));
  console.log();

  const command = options.parallel ? `${testCommand} --parallel` : testCommand;
  const { success, output } = await runTests(command);

  console.log(success ? pc.green('✓ All tests passed') : pc.red('✗ Some tests failed'));
  console.log();

  // Parse and display summary
  const summary = parseTestOutput(output);
  console.log(`  Passed: ${pc.green(summary.passed.toString())}`);
  console.log(`  Failed: ${summary.failed > 0 ? pc.red(summary.failed.toString()) : summary.failed}`);
  console.log(`  Duration: ${summary.duration}`);

  if (!success) {
    process.exit(1);
  }
}

function mapFilesToTests(changedFiles: string[]): string[] {
  const testFiles = new Set<string>();

  for (const file of changedFiles) {
    // Skip test files themselves
    if (file.includes('.test.') || file.includes('.spec.')) {
      continue;
    }

    // Map source files to test files
    const mappings = [
      // src/file.ts -> tests/file.test.ts or src/file.test.ts
      { pattern: /^src\/(.*)\.ts$/, replacements: ['tests/$1.test.ts', 'src/$1.test.ts'] },
      // src/components/X.tsx -> src/components/X.test.tsx
      { pattern: /^src\/(.*)\.tsx$/, replacements: ['src/$1.test.tsx'] },
      // lib/file.js -> test/file.test.js
      { pattern: /^(.*)\.js$/, replacements: ['test/$1.test.js', '$1.test.js'] },
    ];

    for (const { pattern, replacements } of mappings) {
      const match = file.match(pattern);
      if (match) {
        for (const replacement of replacements) {
          const testPath = file.replace(pattern, replacement);
          if (existsSync(testPath)) {
            testFiles.add(testPath);
          }
        }
      }
    }
  }

  return Array.from(testFiles);
}

function parseTestOutput(output: string): { passed: number; failed: number; duration: string } {
  // Try to parse various test runner outputs
  
  // Jest/Vitest pattern: "Tests: 5 passed, 1 failed"
  const jestMatch = output.match(/(\d+)\s+passed.*?(\d+)\s+failed/);
  if (jestMatch) {
    return {
      passed: parseInt(jestMatch[1]) || 0,
      failed: parseInt(jestMatch[2]) || 0,
      duration: extractDuration(output),
    };
  }

  // Mocha pattern: "passing (5)" / "failing (1)"
  const mochaPass = output.match(/passing\s*\((\d+)\)/);
  const mochaFail = output.match(/failing\s*\((\d+)\)/);
  if (mochaPass || mochaFail) {
    return {
      passed: mochaPass ? parseInt(mochaPass[1]) : 0,
      failed: mochaFail ? parseInt(mochaFail[1]) : 0,
      duration: extractDuration(output),
    };
  }

  return { passed: 0, failed: 0, duration: extractDuration(output) };
}

function extractDuration(output: string): string {
  const match = output.match(/(?:Time|Duration):?\s*([\d.ms]+)/i);
  return match ? match[1] : 'unknown';
}

function printResults(
  results: { file: string; passed: boolean; output: string }[],
  coverageThreshold?: number
): void {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log();
  console.log(pc.cyan('──────────────────────────────────────────────────'));
  console.log(`Passed: ${pc.green(passed.toString())}/${results.length} (${Math.round(passed / results.length * 100)}%)`);
  
  if (failed > 0) {
    console.log(`Failed: ${pc.red(failed.toString())}`);
  }
  
  console.log(pc.cyan('──────────────────────────────────────────────────'));
  console.log(`Status: ${failed === 0 ? pc.green('PASSED') : pc.red('FAILED')}`);

  if (failed > 0) {
    console.log();
    console.log(pc.red('Failed tests:'));
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ✗ ${r.file}`);
    });
    process.exit(1);
  }
}
