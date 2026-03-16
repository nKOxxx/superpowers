import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { resolve } from 'path';
import { loadConfig, getQAConfig } from '../lib/config.js';
import { sendMessage, formatQAResult } from '../lib/telegram.js';
import {
  getChangedFiles,
  getStagedFiles,
  getUnstagedFiles,
  getGitStatus
} from '../lib/git.js';
import {
  header,
  success,
  error,
  step,
  info,
  warning,
  list,
  table,
  formatDuration,
  progressBar
} from '../lib/format.js';
import type { QAResult } from '../types.js';

interface QAOptions {
  mode?: string;
  since?: string;
  staged?: boolean;
  unstaged?: boolean;
  files?: string;
  parallel?: string;
  failFast?: boolean;
  retry?: string;
  notify?: boolean;
  analyze?: boolean;
  coverage?: boolean;
  format?: string;
  threshold?: string;
  regress?: string;
  init?: boolean;
  watch?: boolean;
}

export async function qaCommand(options: QAOptions): Promise<void> {
  const startTime = Date.now();

  if (options.init) {
    await initializeQA();
    return;
  }

  header('QA - Intelligent Diff-Based Testing');

  const config = loadConfig();
  const qaConfig = getQAConfig(config);

  try {
    // Get changed files
    let changedFiles: string[] = [];

    if (options.files) {
      // Use glob pattern
      changedFiles = await glob(options.files);
    } else if (options.staged) {
      changedFiles = getStagedFiles();
    } else if (options.unstaged) {
      changedFiles = getUnstagedFiles();
    } else {
      changedFiles = getChangedFiles(options.since);
    }

    if (changedFiles.length === 0) {
      info('No changes detected. Running smoke tests...');
      options.mode = 'smoke';
    } else {
      step(`Changed files: ${changedFiles.length}`);
      if (changedFiles.length <= 20) {
        list(changedFiles);
      }
    }

    // Determine test mode
    const mode = (options.mode || qaConfig.defaultMode) as 'targeted' | 'smoke' | 'full';

    if (options.analyze) {
      await analyzeTestImpact(changedFiles, qaConfig);
      return;
    }

    // Run tests based on mode
    let result: QAResult;

    switch (mode) {
      case 'targeted':
        result = await runTargetedTests(changedFiles, qaConfig, options);
        break;
      case 'smoke':
        result = await runSmokeTests(changedFiles, qaConfig, options);
        break;
      case 'full':
        result = await runFullTests(qaConfig, options);
        break;
      default:
        error(`Unknown mode: ${mode}`);
        process.exit(1);
    }

    // Generate coverage if requested
    if (options.coverage) {
      await generateCoverageReport(options);
    }

    // Report results
    result.duration = Date.now() - startTime;
    await reportResults(result, options);

    // Exit with appropriate code
    if (result.failed > 0) {
      process.exit(1);
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    error(`QA failed: ${message}`);
    process.exit(1);
  }
}

async function runTargetedTests(
  changedFiles: string[],
  config: any,
  options: QAOptions
): Promise<QAResult> {
  step('Running targeted tests...');

  const testFiles = await findRelatedTests(changedFiles, config);
  
  if (testFiles.length === 0) {
    info('No related tests found');
    return {
      mode: 'targeted',
      changedFiles,
      selectedTests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
  }

  step(`Selected ${testFiles.length} tests`);

  return runTestFiles(testFiles, config, options, changedFiles);
}

async function runSmokeTests(
  changedFiles: string[],
  config: any,
  options: QAOptions
): Promise<QAResult> {
  step('Running smoke tests...');

  // Run targeted tests + critical smoke tests
  const targetedTests = await findRelatedTests(changedFiles, config);
  const smokeTests = await findSmokeTests(config);
  
  const allTests = [...new Set([...targetedTests, ...smokeTests])];
  
  step(`Selected ${allTests.length} tests (${targetedTests.length} targeted + ${smokeTests.length} smoke)`);

  return runTestFiles(allTests, config, options, changedFiles);
}

async function runFullTests(config: any, options: QAOptions): Promise<QAResult> {
  step('Running full test suite...');

  const allTests = await glob(config.testPatterns.unit, { absolute: true });
  
  step(`Found ${allTests.length} test files`);

  return runTestFiles(allTests, config, options, []);
}

async function findRelatedTests(changedFiles: string[], config: any): Promise<string[]> {
  const testFiles = new Set<string>();
  
  // Find tests that import changed files
  const allTests = await glob(config.testPatterns.unit, { absolute: true });
  
  for (const changedFile of changedFiles) {
    // Skip non-source files
    if (!isSourceFile(changedFile)) continue;

    // Find corresponding test file
    const possibleTests = [
      changedFile.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1'),
      changedFile.replace(/\.(ts|js|tsx|jsx)$/, '.spec.$1'),
      changedFile.replace(/\/([^/]+)\.(ts|js|tsx|jsx)$/, '/__tests__/$1.test.$2'),
      changedFile.replace(/\/([^/]+)\.(ts|js|tsx|jsx)$/, '/tests/$1.test.$2')
    ];

    for (const testPath of possibleTests) {
      if (existsSync(testPath)) {
        testFiles.add(testPath);
      }
    }

    // Search for tests that import this file
    for (const testFile of allTests) {
      if (await testImportsFile(testFile, changedFile)) {
        testFiles.add(testFile);
      }
    }
  }

  return [...testFiles];
}

async function findSmokeTests(config: any): Promise<string[]> {
  // Find tests marked as smoke tests
  const patterns = [
    '**/*.smoke.test.{ts,js}',
    '**/smoke/**/*.test.{ts,js}',
    '**/e2e/**/*.spec.{ts,js}'
  ];

  const smokeTests: string[] = [];
  for (const pattern of patterns) {
    const tests = await glob(pattern, { absolute: true });
    smokeTests.push(...tests);
  }

  return smokeTests;
}

async function testImportsFile(testFile: string, sourceFile: string): Promise<boolean> {
  try {
    const content = readFileSync(testFile, 'utf-8');
    const sourceName = sourceFile.replace(/\.(ts|js|tsx|jsx)$/, '');
    const importPattern = new RegExp(
      `(import|require)\\s*\\(?'"\`]?.*?${escapeRegex(sourceName)}`,
      'i'
    );
    return importPattern.test(content);
  } catch {
    return false;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isSourceFile(file: string): boolean {
  return /\.(ts|js|tsx|jsx)$/.test(file) && !/\.(test|spec)\./.test(file);
}

async function runTestFiles(
  testFiles: string[],
  config: any,
  options: QAOptions,
  changedFiles: string[]
): Promise<QAResult> {
  const framework = detectFramework();
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Run tests based on framework
  if (framework === 'jest') {
    const result = await runJestTests(testFiles, options);
    passed = result.passed;
    failed = result.failed;
    skipped = result.skipped;
  } else if (framework === 'vitest') {
    const result = await runVitestTests(testFiles, options);
    passed = result.passed;
    failed = result.failed;
    skipped = result.skipped;
  } else {
    // Generic test runner
    const result = await runGenericTests(testFiles, config, options);
    passed = result.passed;
    failed = result.failed;
    skipped = result.skipped;
  }

  return {
    mode: options.mode || 'targeted',
    changedFiles,
    selectedTests: testFiles,
    passed,
    failed,
    skipped,
    duration: 0
  };
}

function detectFramework(): 'jest' | 'vitest' | 'mocha' | 'unknown' {
  if (existsSync('jest.config.js') || existsSync('jest.config.ts')) return 'jest';
  if (existsSync('vitest.config.ts') || existsSync('vitest.config.js')) return 'vitest';
  if (existsSync('.mocharc.js') || existsSync('.mocharc.json')) return 'mocha';
  
  // Check package.json
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    if (pkg.devDependencies?.jest) return 'jest';
    if (pkg.devDependencies?.vitest) return 'vitest';
    if (pkg.devDependencies?.mocha) return 'mocha';
  } catch {
    // Ignore
  }
  
  return 'unknown';
}

async function runJestTests(
  testFiles: string[],
  options: QAOptions
): Promise<{ passed: number; failed: number; skipped: number }> {
  const args = [
    'jest',
    ...testFiles,
    '--passWithNoTests'
  ];

  if (options.failFast) args.push('--bail');
  if (options.coverage) args.push('--coverage');
  if (options.retry) args.push(`--testRetries=${options.retry}`);

  return runTestCommand('npx', args);
}

async function runVitestTests(
  testFiles: string[],
  options: QAOptions
): Promise<{ passed: number; failed: number; skipped: number }> {
  const args = [
    'vitest',
    'run',
    ...testFiles
  ];

  if (options.failFast) args.push('--bail');
  if (options.coverage) args.push('--coverage');
  if (options.retry) args.push(`--retry=${options.retry}`);

  return runTestCommand('npx', args);
}

async function runGenericTests(
  testFiles: string[],
  config: any,
  options: QAOptions
): Promise<{ passed: number; failed: number; skipped: number }> {
  // Run using configured test command
  const cmd = config.testCommand || 'npm test';
  const args = testFiles;
  
  const parts = cmd.split(' ');
  return runTestCommand(parts[0], [...parts.slice(1), ...args]);
}

async function runTestCommand(
  command: string,
  args: string[]
): Promise<{ passed: number; failed: number; skipped: number }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      // Parse results from output
      const passed = (stdout.match(/✓|PASS|passed/g) || []).length;
      const failed = (stdout.match(/✗|FAIL|failed/g) || []).length;
      const skipped = (stdout.match(/skipped|pending|todo/g) || []).length;

      resolve({
        passed: Math.max(0, passed - failed), // Adjust for double counting
        failed: code !== 0 ? Math.max(1, failed) : failed,
        skipped
      });
    });
  });
}

async function analyzeTestImpact(changedFiles: string[], config: any): Promise<void> {
  step('Analyzing test impact...');

  const testFiles = await findRelatedTests(changedFiles, config);

  header('Test Impact Analysis');
  info(`Changed files: ${changedFiles.length}`);
  info(`Related tests: ${testFiles.length}`);

  if (testFiles.length > 0) {
    section('Selected Tests:');
    list(testFiles.map(t => t.replace(process.cwd(), '.')));
  }
}

async function generateCoverageReport(options: QAOptions): Promise<void> {
  step('Generating coverage report...');

  const format = options.format || 'html';
  
  // Run tests with coverage
  const framework = detectFramework();
  
  if (framework === 'jest') {
    execSync('npx jest --coverage --coverageReporters=' + format, { stdio: 'inherit' });
  } else if (framework === 'vitest') {
    execSync('npx vitest run --coverage', { stdio: 'inherit' });
  }

  success(`Coverage report generated`);
}

async function reportResults(result: QAResult, options: QAOptions): Promise<void> {
  header('Test Results');

  const total = result.passed + result.failed + result.skipped;

  table([
    { Metric: 'Mode', Value: result.mode },
    { Metric: 'Changed Files', Value: result.changedFiles.length },
    { Metric: 'Selected Tests', Value: result.selectedTests.length },
    { Metric: 'Passed', Value: result.passed },
    { Metric: 'Failed', Value: result.failed },
    { Metric: 'Skipped', Value: result.skipped },
    { Metric: 'Total', Value: total },
    { Metric: 'Duration', Value: formatDuration(result.duration) }
  ]);

  if (result.failed === 0) {
    success('All tests passed');
  } else {
    error(`${result.failed} tests failed`);
  }

  // Send notification if requested
  if (options.notify) {
    try {
      await sendMessage(formatQAResult(result));
    } catch {
      warning('Failed to send Telegram notification');
    }
  }
}

async function initializeQA(): Promise<void> {
  step('Initializing QA configuration...');

  const configPath = resolve(process.cwd(), '.qa.config.js');

  if (existsSync(configPath)) {
    warning('QA config already exists');
    return;
  }

  const framework = detectFramework();

  const config = `module.exports = {
  // Test framework: 'jest', 'vitest', 'mocha'
  framework: '${framework}',
  
  // File patterns
  sourceFiles: ['src/**/*.{js,ts,tsx}'],
  testFiles: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}'],
  
  // Ignore patterns
  ignorePatterns: ['node_modules', 'dist', 'build'],
  
  // Coverage settings
  coverage: {
    thresholds: {
      global: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  
  // Test selection
  selection: {
    includePatterns: ['**/*.test.{js,ts}'],
    alwaysRun: ['src/critical/**/*'],
    excludeFromChanges: ['**/*.md', '**/*.json']
  },
  
  // Execution
  execution: {
    parallel: true,
    maxWorkers: 4,
    timeout: 30000
  }
};
`;

  writeFileSync(configPath, config);
  success(`Created ${configPath}`);
}
