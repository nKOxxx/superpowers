import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { QAOptions, TestResult, FrameworkConfig, TestFailure } from './types';
import { FrameworkDetector } from './framework-detector';
import { SmartTestSelector } from './smart-selector';

export class QAController {
  private options: QAOptions;
  private detector: FrameworkDetector;
  private selector: SmartTestSelector;

  constructor(options: QAOptions) {
    this.options = options;
    this.detector = new FrameworkDetector();
    this.selector = new SmartTestSelector();
  }

  async execute(): Promise<TestResult> {
    // Detect framework
    const framework = this.options.framework 
      ? this.getFrameworkConfig(this.options.framework)
      : await this.detector.detect();

    if (!framework) {
      throw new Error('No test framework detected. Install Jest, Vitest, Mocha, or pytest.');
    }

    // Get test files
    let testFiles: string[] = [];
    
    if (this.options.file) {
      testFiles = [this.options.file];
    } else if (this.options.changed && !this.options.full) {
      testFiles = await this.selector.getChangedTests(framework);
    } else {
      testFiles = this.getAllTestFiles(framework);
    }

    if (testFiles.length === 0 && this.options.changed) {
      // No changed tests - return success
      return {
        success: true,
        framework: framework.name,
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        pending: 0,
        duration: 0,
        failures: [],
        changedFiles: []
      };
    }

    // Build command
    const { command, args } = this.buildCommand(framework, testFiles);

    // Run tests
    const startTime = Date.now();
    const output = await this.runTests(command, args);
    const duration = Date.now() - startTime;

    // Parse results
    const result = this.parseResults(output, framework, duration);
    result.changedFiles = testFiles;

    return result;
  }

  private getFrameworkConfig(name: string): FrameworkConfig | null {
    const configs: Record<string, FrameworkConfig> = {
      jest: {
        name: 'jest',
        command: 'npx',
        args: ['jest'],
        detectFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json'],
        detectPatterns: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}']
      },
      vitest: {
        name: 'vitest',
        command: 'npx',
        args: ['vitest', 'run'],
        detectFiles: ['vitest.config.js', 'vitest.config.ts', 'vitest.config.mjs'],
        detectPatterns: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}']
      },
      mocha: {
        name: 'mocha',
        command: 'npx',
        args: ['mocha'],
        detectFiles: ['.mocharc.js', '.mocharc.json', 'mocha.opts'],
        detectPatterns: ['**/test/**/*.js', '**/*.test.js']
      },
      pytest: {
        name: 'pytest',
        command: 'python',
        args: ['-m', 'pytest'],
        detectFiles: ['pytest.ini', 'pyproject.toml', 'setup.cfg'],
        detectPatterns: ['**/test_*.py', '**/*_test.py', '**/tests/**/*.py']
      }
    };

    return configs[name.toLowerCase()] || null;
  }

  private getAllTestFiles(framework: FrameworkConfig): string[] {
    const files: string[] = [];
    for (const pattern of framework.detectPatterns) {
      const matches = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/.git/**'] });
      files.push(...matches);
    }
    return [...new Set(files)];
  }

  private buildCommand(framework: FrameworkConfig, testFiles: string[]): { command: string; args: string[] } {
    const args = [...framework.args];

    // Add test files
    if (testFiles.length > 0) {
      args.push(...testFiles);
    }

    // Coverage
    if (this.options.coverage) {
      if (framework.name === 'jest') {
        args.push('--coverage');
      } else if (framework.name === 'vitest') {
        args.push('--coverage');
      } else if (framework.name === 'pytest') {
        args.push('--cov');
      }
    }

    // Watch mode
    if (this.options.watch) {
      if (framework.name === 'jest') {
        args.push('--watch');
      } else if (framework.name === 'vitest') {
        args.push('--watch');
      } else if (framework.name === 'mocha') {
        args.push('--watch');
      }
    }

    // Grep pattern
    if (this.options.grep) {
      if (framework.name === 'jest') {
        args.push('--testNamePattern', this.options.grep);
      } else if (framework.name === 'vitest') {
        args.push('--reporter', 'verbose');
        args.push('-t', this.options.grep);
      } else if (framework.name === 'mocha') {
        args.push('--grep', this.options.grep);
      } else if (framework.name === 'pytest') {
        args.push('-k', this.options.grep);
      }
    }

    // Fail fast
    if (this.options.failFast) {
      if (framework.name === 'jest') {
        args.push('--bail');
      } else if (framework.name === 'vitest') {
        args.push('--bail');
      } else if (framework.name === 'mocha') {
        args.push('--bail');
      } else if (framework.name === 'pytest') {
        args.push('-x');
      }
    }

    // Parallel/Workers
    if (this.options.parallel) {
      if (framework.name === 'jest') {
        args.push('--maxWorkers', this.options.maxWorkers.toString());
      } else if (framework.name === 'vitest') {
        args.push('--pool.threads.singleThread');
      } else if (framework.name === 'pytest') {
        args.push('-n', this.options.maxWorkers.toString());
      }
    }

    // JSON output for parsing
    if (framework.name === 'jest') {
      args.push('--json', '--outputFile=/tmp/jest-results.json');
    }

    return { command: framework.command, args };
  }

  private async runTests(command: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      if (this.options.silent) {
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      });
    });
  }

  private parseResults(output: { stdout: string; stderr: string; exitCode: number }, framework: FrameworkConfig, duration: number): TestResult {
    // Try to parse JSON results first
    if (framework.name === 'jest' && fs.existsSync('/tmp/jest-results.json')) {
      try {
        const jestResults = JSON.parse(fs.readFileSync('/tmp/jest-results.json', 'utf-8'));
        return this.parseJestResults(jestResults, duration);
      } catch {
        // Fall through to generic parsing
      }
    }

    // Generic parsing from output
    return this.parseGenericResults(output, framework, duration);
  }

  private parseJestResults(results: any, duration: number): TestResult {
    const numTotalTests = results.numTotalTests || 0;
    const numPassedTests = results.numPassedTests || 0;
    const numFailedTests = results.numFailedTests || 0;
    const numPendingTests = results.numPendingTests || 0;

    const failures: TestFailure[] = [];
    if (results.testResults) {
      for (const suite of results.testResults) {
        if (suite.status === 'failed') {
          for (const test of suite.assertionResults || []) {
            if (test.status === 'failed') {
              failures.push({
                title: test.title,
                file: suite.name,
                line: test.location?.line,
                column: test.location?.column,
                message: test.failureMessages?.[0] || 'Test failed'
              });
            }
          }
        }
      }
    }

    return {
      success: numFailedTests === 0,
      framework: 'jest',
      totalTests: numTotalTests,
      passed: numPassedTests,
      failed: numFailedTests,
      skipped: results.numTotalTests - numPassedTests - numFailedTests - numPendingTests,
      pending: numPendingTests,
      duration,
      coverage: this.extractCoverage(results),
      failures
    };
  }

  private parseGenericResults(output: { stdout: string; stderr: string; exitCode: number }, framework: FrameworkConfig, duration: number): TestResult {
    const stdout = output.stdout;
    
    // Extract numbers from output (generic patterns)
    const passingMatch = stdout.match(/(\d+) passing/);
    const failingMatch = stdout.match(/(\d+) failing/);
    const pendingMatch = stdout.match(/(\d+) pending/);
    
    const passed = passingMatch ? parseInt(passingMatch[1], 10) : 0;
    const failed = failingMatch ? parseInt(failingMatch[1], 10) : 0;
    const pending = pendingMatch ? parseInt(pendingMatch[1], 10) : 0;

    return {
      success: output.exitCode === 0 && failed === 0,
      framework: framework.name,
      totalTests: passed + failed + pending,
      passed,
      failed,
      skipped: 0,
      pending,
      duration,
      failures: []
    };
  }

  private extractCoverage(results: any): any {
    if (!results.coverageMap) return undefined;

    // Calculate aggregate coverage
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;

    for (const file of Object.values(results.coverageMap) as any[]) {
      if (file.statementMap) {
        const s = file.s;
        totalStatements += Object.keys(s).length;
        coveredStatements += Object.values(s).filter((v: any) => v > 0).length;
      }
      if (file.branchMap) {
        const b = file.b;
        for (const key of Object.keys(b)) {
          totalBranches += b[key].length;
          coveredBranches += b[key].filter((v: any) => v > 0).length;
        }
      }
      if (file.fnMap) {
        const f = file.f;
        totalFunctions += Object.keys(f).length;
        coveredFunctions += Object.values(f).filter((v: any) => v > 0).length;
      }
    }

    return {
      statements: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0,
      branches: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0,
      functions: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0,
      lines: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0
    };
  }
}
