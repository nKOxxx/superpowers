/**
 * QA Skill - Systematic testing with smart test selection
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execAsync, Logger, ConsoleLogger, formatDuration, SkillResult } from '@openclaw/superpowers-shared';

export type TestFramework = 'jest' | 'vitest' | 'mocha' | 'pytest' | 'unknown';

export interface QaOptions {
  changed?: boolean;
  coverage?: boolean;
  watch?: boolean;
  file?: string;
  grep?: string;
  framework?: TestFramework;
  coverageThreshold?: number;
  parallel?: boolean;
}

export interface TestResult {
  framework: TestFramework;
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: CoverageReport;
  failures: TestFailure[];
  output: string;
}

export interface TestFailure {
  testName: string;
  filePath: string;
  error: string;
  line?: number;
  column?: number;
}

export interface CoverageReport {
  lines: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  statements: { total: number; covered: number; percentage: number };
  overall: number;
}

export class QaSkill {
  private logger: Logger;
  private cwd: string;

  constructor(cwd?: string, logger?: Logger) {
    this.cwd = cwd || process.cwd();
    this.logger = logger || new ConsoleLogger();
  }

  async detectFramework(): Promise<TestFramework> {
    try {
      const files = await fs.readdir(this.cwd);
      const packageJsonPath = path.join(this.cwd, 'package.json');
      
      // Check for config files
      if (files.some(f => f.startsWith('vitest.config'))) return 'vitest';
      if (files.some(f => f.startsWith('jest.config'))) return 'jest';
      if (files.some(f => f.startsWith('.mocharc'))) return 'mocha';
      if (files.some(f => f === 'pytest.ini' || f === 'pyproject.toml')) {
        const pyproject = await fs.readFile(path.join(this.cwd, 'pyproject.toml'), 'utf-8').catch(() => '');
        if (pyproject.includes('[tool.pytest]')) return 'pytest';
      }

      // Check package.json
      try {
        const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps.vitest) return 'vitest';
        if (deps.jest) return 'jest';
        if (deps.mocha) return 'mocha';
        if (deps.pytest) return 'pytest';
      } catch {
        // No package.json
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async run(options: QaOptions = {}): Promise<TestResult> {
    const startTime = Date.now();
    const framework = options.framework || await this.detectFramework();

    if (framework === 'unknown') {
      return {
        framework: 'unknown',
        passed: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        failures: [{ testName: 'Framework Detection', filePath: '', error: 'Could not detect test framework' }],
        output: ''
      };
    }

    this.logger.info(`Detected framework: ${framework}`);

    // Get changed files if requested
    let testFiles: string[] | undefined;
    if (options.changed) {
      testFiles = await this.getChangedTestFiles();
      if (testFiles.length === 0) {
        this.logger.info('No test files changed, running full suite');
      } else {
        this.logger.info(`Running ${testFiles.length} changed test files`);
      }
    }

    // Run tests based on framework
    switch (framework) {
      case 'jest':
        return this.runJest(options, testFiles);
      case 'vitest':
        return this.runVitest(options, testFiles);
      case 'mocha':
        return this.runMocha(options, testFiles);
      case 'pytest':
        return this.runPytest(options, testFiles);
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }

  private async runJest(options: QaOptions, testFiles?: string[]): Promise<TestResult> {
    const args: string[] = [];
    
    if (options.coverage) args.push('--coverage');
    if (options.watch) args.push('--watch');
    if (options.grep) args.push(`--testNamePattern="${options.grep}"`);
    if (options.file) args.push(options.file);
    if (testFiles && testFiles.length > 0) args.push(...testFiles);
    if (!options.watch) args.push('--json');

    const command = `npx jest ${args.join(' ')}`;
    this.logger.debug(`Running: ${command}`);

    const { stdout, stderr, exitCode } = await execAsync(command, { cwd: this.cwd });
    const output = stdout + stderr;

    // Parse Jest JSON output
    let result: TestResult;
    try {
      const jsonMatch = stdout.match(/\{[\s\S]*"numTotalTests":[\s\S]*\}/);
      if (jsonMatch) {
        const jestResult = JSON.parse(jsonMatch[0]);
        result = {
          framework: 'jest',
          passed: exitCode === 0,
          totalTests: jestResult.numTotalTests || 0,
          passedTests: jestResult.numPassedTests || 0,
          failedTests: jestResult.numFailedTests || 0,
          skippedTests: jestResult.numPendingTests || 0,
          duration: jestResult.testResults?.reduce((sum: number, r: { endTime: number; startTime: number }) => 
            sum + (r.endTime - r.startTime), 0) || 0,
          failures: jestResult.testResults?.flatMap((r: { name: string; failureMessages: string[] }) =>
            (r.failureMessages || []).map((msg: string) => ({
              testName: r.name,
              filePath: r.name,
              error: msg
            }))
          ) || [],
          output
        };
      } else {
        result = this.parseGenericOutput('jest', output, exitCode);
      }
    } catch {
      result = this.parseGenericOutput('jest', output, exitCode);
    }

    // Parse coverage if requested
    if (options.coverage) {
      result.coverage = await this.parseJestCoverage();
    }

    return result;
  }

  private async runVitest(options: QaOptions, testFiles?: string[]): Promise<TestResult> {
    const args: string[] = ['run'];
    
    if (options.coverage) args.push('--coverage');
    if (options.grep) args.push(`-t "${options.grep}"`);
    if (options.file) args.push(options.file);
    if (testFiles && testFiles.length > 0) args.push(...testFiles);
    if (!options.watch) args.push('--reporter=json');

    const command = `npx vitest ${args.join(' ')}`;
    this.logger.debug(`Running: ${command}`);

    const { stdout, stderr, exitCode } = await execAsync(command, { cwd: this.cwd });
    const output = stdout + stderr;

    // Parse Vitest JSON output
    let result: TestResult;
    try {
      const jsonMatch = stdout.match(/\{[\s\S]*"numTotalTests":[\s\S]*\}/);
      if (jsonMatch) {
        const vitestResult = JSON.parse(jsonMatch[0]);
        result = {
          framework: 'vitest',
          passed: exitCode === 0,
          totalTests: vitestResult.numTotalTests || 0,
          passedTests: vitestResult.numPassedTests || 0,
          failedTests: vitestResult.numFailedTests || 0,
          skippedTests: vitestResult.numSkippedTests || 0,
          duration: 0,
          failures: [],
          output
        };
      } else {
        result = this.parseGenericOutput('vitest', output, exitCode);
      }
    } catch {
      result = this.parseGenericOutput('vitest', output, exitCode);
    }

    return result;
  }

  private async runMocha(options: QaOptions, testFiles?: string[]): Promise<TestResult> {
    const args: string[] = [];
    
    if (options.grep) args.push(`--grep "${options.grep}"`);
    if (options.file) args.push(options.file);
    if (testFiles && testFiles.length > 0) args.push(...testFiles);

    const command = `npx mocha ${args.join(' ')}`;
    this.logger.debug(`Running: ${command}`);

    const { stdout, stderr, exitCode } = await execAsync(command, { cwd: this.cwd });
    const output = stdout + stderr;

    return this.parseGenericOutput('mocha', output, exitCode);
  }

  private async runPytest(options: QaOptions, testFiles?: string[]): Promise<TestResult> {
    const args: string[] = [];
    
    if (options.coverage) args.push('--cov');
    if (options.grep) args.push(`-k "${options.grep}"`);
    if (options.file) args.push(options.file);
    if (testFiles && testFiles.length > 0) args.push(...testFiles);

    const command = `pytest ${args.join(' ')}`;
    this.logger.debug(`Running: ${command}`);

    const { stdout, stderr, exitCode } = await execAsync(command, { cwd: this.cwd });
    const output = stdout + stderr;

    return this.parseGenericOutput('pytest', output, exitCode);
  }

  private parseGenericOutput(framework: TestFramework, output: string, exitCode: number): TestResult {
    // Extract test counts from output
    const passedMatch = output.match(/(\d+) passing/);
    const failedMatch = output.match(/(\d+) failing/);
    const pendingMatch = output.match(/(\d+) pending/);

    const passedTests = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    const failedTests = failedMatch ? parseInt(failedMatch[1], 10) : 0;
    const skippedTests = pendingMatch ? parseInt(pendingMatch[1], 10) : 0;

    return {
      framework,
      passed: exitCode === 0,
      totalTests: passedTests + failedTests + skippedTests,
      passedTests,
      failedTests,
      skippedTests,
      duration: 0,
      failures: [],
      output
    };
  }

  private async parseJestCoverage(): Promise<CoverageReport | undefined> {
    try {
      const coveragePath = path.join(this.cwd, 'coverage', 'coverage-summary.json');
      const coverage = JSON.parse(await fs.readFile(coveragePath, 'utf-8'));
      const total = coverage.total;

      return {
        lines: {
          total: total.lines.total,
          covered: total.lines.covered,
          percentage: total.lines.pct
        },
        functions: {
          total: total.functions.total,
          covered: total.functions.covered,
          percentage: total.functions.pct
        },
        branches: {
          total: total.branches.total,
          covered: total.branches.covered,
          percentage: total.branches.pct
        },
        statements: {
          total: total.statements.total,
          covered: total.statements.covered,
          percentage: total.statements.pct
        },
        overall: Math.round((total.lines.pct + total.functions.pct + total.branches.pct) / 3)
      };
    } catch {
      return undefined;
    }
  }

  private async getChangedTestFiles(): Promise<string[]> {
    try {
      // Get changed files from git
      const { stdout } = await execAsync('git diff --name-only HEAD~1', { cwd: this.cwd });
      const changedFiles = stdout.split('\n').filter(f => f.trim());

      // Map to test files
      const testFiles: string[] = [];
      for (const file of changedFiles) {
        if (file.match(/\.(test|spec)\.(ts|js|tsx|jsx|py)$/)) {
          testFiles.push(file);
        } else if (file.match(/\.(ts|js|tsx|jsx|py)$/)) {
          // Find corresponding test file
          const base = file.replace(/\.(ts|js|tsx|jsx|py)$/, '');
          const possibleTests = [
            `${base}.test.ts`,
            `${base}.test.js`,
            `${base}.spec.ts`,
            `${base}.spec.js`,
            `tests/${base}.test.py`
          ];
          
          for (const testFile of possibleTests) {
            try {
              await fs.access(path.join(this.cwd, testFile));
              testFiles.push(testFile);
              break;
            } catch {
              // File doesn't exist
            }
          }
        }
      }

      return [...new Set(testFiles)];
    } catch {
      return [];
    }
  }
}

// Export convenience function
export async function qa(options: QaOptions = {}, cwd?: string): Promise<TestResult> {
  const skill = new QaSkill(cwd);
  return skill.run(options);
}