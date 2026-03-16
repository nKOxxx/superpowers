/**
 * Test execution engine
 */
import { spawn } from 'child_process';
import type { TestSelection } from './analyzer.js';

export interface TestResult {
  command: string;
  exitCode: number;
  passed: boolean;
  output: string;
  errorOutput: string;
  duration: number;
  stats?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage?: number;
  };
}

export interface TestRunOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  silent?: boolean;
}

/**
 * Run a test command and capture results
 */
export async function runTests(
  command: string,
  options: TestRunOptions = {}
): Promise<TestResult> {
  const {
    cwd = process.cwd(),
    env = process.env,
    timeout = 300000, // 5 minutes
    silent = false
  } = options;

  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    
    const child = spawn(cmd, args, {
      cwd,
      env: { ...env, FORCE_COLOR: '1' },
      stdio: silent ? 'pipe' : 'inherit',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
      });
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      errorOutput += '\nTest execution timed out';
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      const stats = parseTestOutput(output + errorOutput);

      resolve({
        command,
        exitCode: code ?? 1,
        passed: code === 0,
        output,
        errorOutput,
        duration,
        stats
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      
      resolve({
        command,
        exitCode: 1,
        passed: false,
        output,
        errorOutput: errorOutput || error.message,
        duration: Date.now() - startTime,
        stats: { total: 0, passed: 0, failed: 0, skipped: 0 }
      });
    });
  });
}

/**
 * Parse test output to extract statistics
 */
function parseTestOutput(output: string): TestResult['stats'] {
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    coverage: undefined as number | undefined
  };

  // Try various test runner patterns
  
  // Jest/Vitest pattern: "Tests: 10 passed, 2 failed, 1 skipped"
  const jestMatch = output.match(/(\d+)\s+passed.*?[,;]\s*(\d+)\s+failed.*?[,;]\s*(\d+)\s+skipped/i);
  if (jestMatch) {
    stats.passed = parseInt(jestMatch[1], 10);
    stats.failed = parseInt(jestMatch[2], 10);
    stats.skipped = parseInt(jestMatch[3], 10);
    stats.total = stats.passed + stats.failed + stats.skipped;
  }

  // Mocha pattern: "passing (10) failing (2) pending (1)"
  const mochaMatch = output.match(/passing\s*\((\d+)\).*?failing\s*\((\d+)\).*?pending\s*\((\d+)\)/i);
  if (mochaMatch) {
    stats.passed = parseInt(mochaMatch[1], 10);
    stats.failed = parseInt(mochaMatch[2], 10);
    stats.skipped = parseInt(mochaMatch[3], 10);
    stats.total = stats.passed + stats.failed + stats.skipped;
  }

  // TAP pattern: "# pass 10 # fail 2 # skip 1"
  const tapMatch = output.match(/#\s*pass\s*(\d+).*?#\s*fail\s*(\d+).*?#\s*skip\s*(\d+)/is);
  if (tapMatch) {
    stats.passed = parseInt(tapMatch[1], 10);
    stats.failed = parseInt(tapMatch[2], 10);
    stats.skipped = parseInt(tapMatch[3], 10);
    stats.total = stats.passed + stats.failed + stats.skipped;
  }

  // Generic pattern: "10 tests passed"
  const genericPassMatch = output.match(/(\d+)\s+tests?\s+passed/i);
  const genericFailMatch = output.match(/(\d+)\s+tests?\s+failed/i);
  if (genericPassMatch) stats.passed = parseInt(genericPassMatch[1], 10);
  if (genericFailMatch) stats.failed = parseInt(genericFailMatch[1], 10);

  // Coverage pattern: "Coverage: 87%" or "Statements: 87%"
  const coverageMatch = output.match(/(?:coverage|statements|lines)[:\s]*(\d+(?:\.\d+)?)%/i);
  if (coverageMatch) {
    stats.coverage = parseFloat(coverageMatch[1]);
  }

  // If we only have total count
  if (stats.total === 0) {
    const totalMatch = output.match(/(\d+)\s+tests?\s+total/i);
    if (totalMatch) {
      stats.total = parseInt(totalMatch[1], 10);
    }
  }

  return stats;
}

/**
 * Run tests for multiple selections
 */
export async function runTestSelections(
  selections: TestSelection[],
  baseCommand: string,
  options: TestRunOptions = {}
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const selection of selections) {
    const testFiles = selection.files.join(' ');
    const command = `${baseCommand} ${testFiles}`;
    
    const result = await runTests(command, options);
    results.push(result);

    // Stop on first failure if it's a critical test
    if (!result.passed && selection.type === 'e2e') {
      break;
    }
  }

  return results;
}

/**
 * Format test results for display
 */
export function formatTestResults(results: TestResult[]): string {
  const lines: string[] = [
    'Test Results',
    '============',
    ''
  ];

  let totalDuration = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    lines.push(`${status} ${result.command}`);
    lines.push(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.stats) {
      const { passed = 0, failed = 0, skipped = 0, coverage } = result.stats;
      lines.push(`   Tests: ${passed} passed, ${failed} failed, ${skipped} skipped`);
      if (coverage !== undefined) {
        lines.push(`   Coverage: ${coverage.toFixed(1)}%`);
      }
      
      totalPassed += passed;
      totalFailed += failed;
      totalSkipped += skipped;
    }
    
    totalDuration += result.duration;
    lines.push('');
  }

  const allPassed = results.every(r => r.passed);
  
  lines.push('Summary');
  lines.push('=======');
  lines.push(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  lines.push(`Total Tests: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped`);
  lines.push(`Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);

  return lines.join('\n');
}

/**
 * Check if tests pass the coverage threshold
 */
export function checkCoverage(
  results: TestResult[],
  threshold: number
): { passed: boolean; actual: number; threshold: number } {
  let totalCoverage = 0;
  let coverageCount = 0;

  for (const result of results) {
    if (result.stats?.coverage !== undefined) {
      totalCoverage += result.stats.coverage;
      coverageCount++;
    }
  }

  const actual = coverageCount > 0 ? totalCoverage / coverageCount : 0;
  
  return {
    passed: actual >= threshold,
    actual,
    threshold
  };
}
