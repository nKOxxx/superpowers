import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Types
type TestMode = 'targeted' | 'smoke' | 'full';
type TestFramework = 'vitest' | 'jest' | 'mocha' | 'node' | 'unknown';

interface QAOptions {
  mode: TestMode;
  files?: string;
  coverage: boolean;
  watch: boolean;
  ci: boolean;
}

interface TestResult {
  success: boolean;
  mode: TestMode;
  framework: TestFramework;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  duration: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  filesTested: string[];
  output: string;
}

interface SkillContext {
  args: string[];
  options: Record<string, string | boolean>;
  cwd?: string;
}

interface SkillResult {
  success: boolean;
  message: string;
  data?: TestResult;
  error?: string;
}

// Parse command line arguments
function parseArgs(args: string[]): QAOptions {
  const options: QAOptions = {
    mode: 'targeted',
    coverage: false,
    watch: false,
    ci: false
  };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      
      switch (key) {
        case 'mode':
          options.mode = (value as TestMode) || 'targeted';
          break;
        case 'files':
          options.files = value;
          break;
        case 'coverage':
          options.coverage = true;
          break;
        case 'watch':
          options.watch = true;
          break;
        case 'ci':
          options.ci = true;
          break;
      }
    }
  }

  return options;
}

// Detect test framework
function detectFramework(cwd: string): TestFramework {
  // Check for vitest
  if (
    fs.existsSync(path.join(cwd, 'vitest.config.ts')) ||
    fs.existsSync(path.join(cwd, 'vitest.config.js')) ||
    fs.existsSync(path.join(cwd, 'vitest.config.mjs'))
  ) {
    return 'vitest';
  }

  // Check for jest
  if (
    fs.existsSync(path.join(cwd, 'jest.config.js')) ||
    fs.existsSync(path.join(cwd, 'jest.config.ts')) ||
    fs.existsSync(path.join(cwd, 'jest.config.json'))
  ) {
    return 'jest';
  }

  // Check package.json for test scripts
  const packagePath = path.join(cwd, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    const testScript = pkg.scripts?.test || '';
    
    if (testScript.includes('vitest')) return 'vitest';
    if (testScript.includes('jest')) return 'jest';
    if (testScript.includes('mocha')) return 'mocha';
    if (testScript.includes('node --test')) return 'node';
  }

  // Check for mocha
  if (
    fs.existsSync(path.join(cwd, '.mocharc.js')) ||
    fs.existsSync(path.join(cwd, '.mocharc.json')) ||
    fs.existsSync(path.join(cwd, 'test/mocha.opts'))
  ) {
    return 'mocha';
  }

  return 'unknown';
}

// Get changed files from git
function getChangedFiles(cwd: string): string[] {
  try {
    const output = execSync('git diff --name-only HEAD', { cwd, encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

// Map source files to test files
function mapToTestFiles(files: string[], framework: TestFramework, cwd: string): string[] {
  const testFiles: string[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    // Skip test files themselves
    if (file.includes('.test.') || file.includes('.spec.') || file.includes('_test.')) {
      if (!seen.has(file)) {
        testFiles.push(file);
        seen.add(file);
      }
      continue;
    }

    // Get file extension and base name
    const ext = path.extname(file);
    const base = file.replace(ext, '');
    const dir = path.dirname(file);

    // Possible test file patterns
    const patterns = [
      `${base}.test${ext}`,
      `${base}.spec${ext}`,
      `${base}_test${ext}`,
      path.join(dir, `__tests__/${path.basename(base)}.test${ext}`),
      path.join('tests', `${base}.test${ext}`),
      path.join('test', `${base}.test${ext}`)
    ];

    for (const pattern of patterns) {
      const testPath = path.join(cwd, pattern);
      if (fs.existsSync(testPath) && !seen.has(pattern)) {
        testFiles.push(pattern);
        seen.add(pattern);
      }
    }
  }

  return testFiles;
}

// Find smoke test files
function findSmokeTests(cwd: string): string[] {
  const patterns = [
    '**/*.smoke.test.{ts,js}',
    '**/smoke.test.{ts,js}',
    '**/smoke.spec.{ts,js}'
  ];
  
  const smokeFiles: string[] = [];
  
  for (const pattern of patterns) {
    const basePattern = pattern.replace(/\{[^}]+\}/g, '*');
    const parts = basePattern.split('/');
    
    // Simple glob matching
    try {
      const { execSync } = require('child_process');
      const result = execSync(`find . -name "*.smoke.test.*" -o -name "smoke.test.*" -o -name "smoke.spec.*" 2>/dev/null | head -20`, { cwd, encoding: 'utf-8' });
      if (result) {
        smokeFiles.push(...result.trim().split('\n').filter(f => f));
      }
    } catch {
      // Ignore
    }
  }
  
  return smokeFiles;
}

// Build test command
function buildTestCommand(
  framework: TestFramework,
  mode: TestMode,
  files: string[],
  options: QAOptions
): { command: string; args: string[] } {
  const args: string[] = [];

  switch (framework) {
    case 'vitest':
      args.push('vitest');
      args.push('run');
      if (options.coverage) args.push('--coverage');
      if (options.watch) args.push('--watch');
      if (files.length > 0) args.push(...files);
      break;

    case 'jest':
      args.push('jest');
      if (options.coverage) args.push('--coverage');
      if (options.watch) args.push('--watch');
      if (options.ci) args.push('--ci');
      if (files.length > 0) args.push(...files);
      break;

    case 'mocha':
      args.push('mocha');
      if (files.length > 0) {
        args.push(...files);
      } else {
        args.push('**/*.test.{ts,js}');
      }
      break;

    case 'node':
      args.push('node');
      args.push('--test');
      if (files.length > 0) args.push(...files);
      break;

    default:
      // Fallback to npm test
      args.push('npm');
      args.push('test');
  }

  return { command: 'npx', args };
}

// Run tests
async function runTests(
  command: string,
  args: string[],
  cwd: string
): Promise<{ output: string; exitCode: number; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';

    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        output,
        exitCode: code || 0,
        duration: Date.now() - startTime
      });
    });

    child.on('error', (err) => {
      resolve({
        output: `Error: ${err.message}`,
        exitCode: 1,
        duration: Date.now() - startTime
      });
    });
  });
}

// Parse test output
function parseTestOutput(output: string, framework: TestFramework): Partial<TestResult> {
  const result: Partial<TestResult> = {
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    testsSkipped: 0
  };

  // Vitest parsing
  if (output.includes('Vitest')) {
    const match = output.match(/(\d+) passed\s*(?:,\s*(\d+) failed)?\s*(?:,\s*(\d+) skipped)?/);
    if (match) {
      result.testsPassed = parseInt(match[1], 10);
      result.testsFailed = parseInt(match[2] || '0', 10);
      result.testsSkipped = parseInt(match[3] || '0', 10);
      result.testsRun = result.testsPassed + result.testsFailed + result.testsSkipped;
    }
  }
  // Jest parsing
  else if (output.includes('PASS') || output.includes('FAIL')) {
    const testsMatch = output.match(/Tests:\s+(\d+)\s+total/);
    const passedMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);
    const skippedMatch = output.match(/(\d+)\s+(?:skipped|pending)/);

    result.testsRun = parseInt(testsMatch?.[1] || '0', 10);
    result.testsPassed = parseInt(passedMatch?.[1] || '0', 10);
    result.testsFailed = parseInt(failedMatch?.[1] || '0', 10);
    result.testsSkipped = parseInt(skippedMatch?.[1] || '0', 10);
  }
  // Mocha parsing
  else if (output.includes('passing') || output.includes('failing')) {
    const passingMatch = output.match(/(\d+)\s+passing/);
    const failingMatch = output.match(/(\d+)\s+failing/);
    const pendingMatch = output.match(/(\d+)\s+pending/);

    result.testsPassed = parseInt(passingMatch?.[1] || '0', 10);
    result.testsFailed = parseInt(failingMatch?.[1] || '0', 10);
    result.testsSkipped = parseInt(pendingMatch?.[1] || '0', 10);
    result.testsRun = result.testsPassed + result.testsFailed + result.testsSkipped;
  }
  // Node test runner
  else if (output.includes('✔') || output.includes('✖')) {
    const passed = (output.match(/✔/g) || []).length;
    const failed = (output.match(/✖/g) || []).length;
    result.testsPassed = passed;
    result.testsFailed = failed;
    result.testsRun = passed + failed;
  }

  // Coverage parsing (generic)
  if (output.includes('Coverage')) {
    const stmtMatch = output.match(/Statements\s*:\s*(\d+(?:\.\d+)?)%/);
    const branchMatch = output.match(/Branches\s*:\s*(\d+(?:\.\d+)?)%/);
    const funcMatch = output.match(/Functions?\s*:\s*(\d+(?:\.\d+)?)%/);
    const linesMatch = output.match(/Lines\s*:\s*(\d+(?:\.\d+)?)%/);

    result.coverage = {
      statements: parseFloat(stmtMatch?.[1] || '0'),
      branches: parseFloat(branchMatch?.[1] || '0'),
      functions: parseFloat(funcMatch?.[1] || '0'),
      lines: parseFloat(linesMatch?.[1] || '0')
    };
  }

  return result;
}

// Format output message
function formatResult(result: TestResult): string {
  let message = `🧪 QA Results (${result.mode.toUpperCase()} Mode)\n\n`;
  
  message += `Framework: ${result.framework}\n`;
  message += `Tests: ${result.testsRun} run | `;
  message += `✅ ${result.testsPassed} passed | `;
  message += `❌ ${result.testsFailed} failed | `;
  message += `⏭️ ${result.testsSkipped} skipped\n`;
  message += `Duration: ${(result.duration / 1000).toFixed(2)}s\n\n`;

  if (result.coverage) {
    message += `📊 Coverage:\n`;
    message += `  Statements: ${result.coverage.statements.toFixed(1)}%\n`;
    message += `  Branches: ${result.coverage.branches.toFixed(1)}%\n`;
    message += `  Functions: ${result.coverage.functions.toFixed(1)}%\n`;
    message += `  Lines: ${result.coverage.lines.toFixed(1)}%\n\n`;
  }

  if (result.filesTested.length > 0) {
    message += `Files tested:\n`;
    for (const file of result.filesTested.slice(0, 10)) {
      message += `  • ${file}\n`;
    }
    if (result.filesTested.length > 10) {
      message += `  ... and ${result.filesTested.length - 10} more\n`;
    }
  }

  return message;
}

// Main handler function
export async function handler(context: SkillContext): Promise<SkillResult> {
  const cwd = context.cwd || process.cwd();
  const startTime = Date.now();

  try {
    // Parse arguments
    const options = parseArgs(context.args);

    // Detect framework
    const framework = detectFramework(cwd);
    if (framework === 'unknown') {
      return {
        success: false,
        message: 'No test framework detected. Supported: Vitest, Jest, Mocha, Node test runner',
        error: 'Unknown framework'
      };
    }

    // Determine test files based on mode
    let testFiles: string[] = [];

    if (options.mode === 'targeted') {
      const changedFiles = getChangedFiles(cwd);
      if (changedFiles.length > 0) {
        testFiles = mapToTestFiles(changedFiles, framework, cwd);
      }
      if (testFiles.length === 0) {
        // Fallback: find all test files
        try {
          const result = execSync('find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | head -20', { cwd, encoding: 'utf-8' });
          testFiles = result.trim().split('\n').filter(f => f);
        } catch {
          // Ignore
        }
      }
    } else if (options.mode === 'smoke') {
      testFiles = findSmokeTests(cwd);
      if (testFiles.length === 0) {
        return {
          success: false,
          message: 'No smoke tests found. Create files matching *.smoke.test.* pattern.',
          error: 'No smoke tests'
        };
      }
    }
    // full mode: run all tests (no file filter)

    // Build and run test command
    const { command, args } = buildTestCommand(framework, options.mode, testFiles, options);
    const { output, exitCode, duration } = await runTests(command, args, cwd);

    // Parse results
    const parsed = parseTestOutput(output, framework);
    
    const result: TestResult = {
      success: exitCode === 0,
      mode: options.mode,
      framework,
      testsRun: parsed.testsRun || 0,
      testsPassed: parsed.testsPassed || 0,
      testsFailed: parsed.testsFailed || 0,
      testsSkipped: parsed.testsSkipped || 0,
      duration,
      coverage: parsed.coverage,
      filesTested: testFiles,
      output: output.slice(-2000) // Last 2000 chars
    };

    return {
      success: result.success,
      message: formatResult(result),
      data: result
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `QA failed: ${errorMessage}`,
      error: errorMessage
    };
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const context: SkillContext = {
    args,
    options: {},
    cwd: process.cwd()
  };

  handler(context).then(result => {
    console.log(result.message);
    if (result.data) {
      console.log('\n--- JSON ---\n');
      console.log(JSON.stringify(result.data, null, 2));
    }
    process.exit(result.success ? 0 : 1);
  });
}
