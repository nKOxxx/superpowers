import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface QAOptions {
  mode?: 'targeted' | 'smoke' | 'full';
  diff?: string;
  coverage?: boolean;
  parallel?: boolean;
}

export interface TestResult {
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export class QASkill {
  private framework: 'vitest' | 'jest' | 'mocha' | 'unknown' = 'unknown';

  async detectFramework(): Promise<string> {
    try {
      await fs.access('node_modules/vitest');
      this.framework = 'vitest';
      return 'vitest';
    } catch {}

    try {
      await fs.access('node_modules/jest');
      this.framework = 'jest';
      return 'jest';
    } catch {}

    try {
      await fs.access('node_modules/mocha');
      this.framework = 'mocha';
      return 'mocha';
    } catch {}

    // Check package.json
    try {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) return 'vitest';
      if (pkg.devDependencies?.jest || pkg.dependencies?.jest) return 'jest';
      if (pkg.devDependencies?.mocha || pkg.dependencies?.mocha) return 'mocha';
    } catch {}

    return 'unknown';
  }

  async run(options: QAOptions = {}): Promise<{ results: TestResult[]; summary: string }> {
    const mode = options.mode || 'targeted';
    const framework = await this.detectFramework();

    if (framework === 'unknown') {
      throw new Error('No test framework detected. Please install vitest, jest, or mocha.');
    }

    let testFiles: string[] = [];

    switch (mode) {
      case 'targeted':
        testFiles = await this.getTargetedTests(options.diff || 'HEAD~1');
        break;
      case 'smoke':
        testFiles = await this.getSmokeTests();
        break;
      case 'full':
        testFiles = await this.getAllTests();
        break;
    }

    if (testFiles.length === 0 && mode === 'targeted') {
      return {
        results: [],
        summary: 'No test files affected by changes.'
      };
    }

    const results = await this.executeTests(testFiles, framework, options);
    const summary = this.generateSummary(results, mode);

    return { results, summary };
  }

  private async getTargetedTests(diffRange: string): Promise<string[]> {
    try {
      const diffOutput = execSync(`git diff --name-only ${diffRange}`, { encoding: 'utf-8' });
      const changedFiles = diffOutput.trim().split('\n').filter(f => f);

      const testFiles: string[] = [];
      
      for (const file of changedFiles) {
        // Map source files to test files
        if (file.startsWith('src/') || file.startsWith('lib/')) {
          const possibleTests = [
            file.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1'),
            file.replace(/\.(ts|js|tsx|jsx)$/, '.spec.$1'),
            `tests/${path.basename(file).replace(/\.(ts|js|tsx|jsx)$/, '.test.$1')}`,
            `test/${path.basename(file).replace(/\.(ts|js|tsx|jsx)$/, '.test.$1')}`
          ];

          for (const testFile of possibleTests) {
            try {
              await fs.access(testFile);
              testFiles.push(testFile);
            } catch {}
          }
        }

        // Include directly modified test files
        if (file.includes('.test.') || file.includes('.spec.')) {
          testFiles.push(file);
        }
      }

      return [...new Set(testFiles)];
    } catch (error) {
      console.warn('Could not get git diff, running all tests');
      return this.getAllTests();
    }
  }

  private async getSmokeTests(): Promise<string[]> {
    const allTests = await this.getAllTests();
    // Filter for smoke tests by looking for 'smoke' in filename or content
    const smokeTests: string[] = [];
    
    for (const test of allTests) {
      if (test.toLowerCase().includes('smoke')) {
        smokeTests.push(test);
        continue;
      }

      try {
        const content = await fs.readFile(test, 'utf-8');
        if (content.toLowerCase().includes('smoke') || 
            content.toLowerCase().includes('@critical') ||
            content.toLowerCase().includes('describe(\'basic') ||
            content.toLowerCase().includes('describe(\"basic')) {
          smokeTests.push(test);
        }
      } catch {}
    }

    return smokeTests.length > 0 ? smokeTests : allTests.slice(0, 3);
  }

  private async getAllTests(): Promise<string[]> {
    const patterns = [
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.test.tsx',
      '**/*.test.jsx',
      '**/*.spec.ts',
      '**/*.spec.js'
    ];

    const tests: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const files = await this.glob(pattern);
        tests.push(...files);
      } catch {}
    }

    return [...new Set(tests)];
  }

  private async glob(pattern: string): Promise<string[]> {
    const { glob } = await import('glob');
    return glob(pattern, { ignore: ['node_modules/**'] });
  }

  private async executeTests(
    testFiles: string[], 
    framework: string, 
    options: QAOptions
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      let command = '';

      switch (framework) {
        case 'vitest':
          command = `npx vitest run ${testFiles.join(' ')}`;
          if (options.coverage) command += ' --coverage';
          break;
        case 'jest':
          command = `npx jest ${testFiles.join(' ')}`;
          if (options.coverage) command += ' --coverage';
          if (options.parallel) command += ' --maxWorkers=4';
          break;
        case 'mocha':
          command = `npx mocha ${testFiles.join(' ')}`;
          break;
      }

      const startTime = Date.now();
      execSync(command, { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      // If we get here, all tests passed
      for (const file of testFiles) {
        results.push({
          file,
          status: 'passed',
          duration: Date.now() - startTime
        });
      }
    } catch (error: any) {
      // Parse test failures from output
      const output = error.stdout || error.message || '';
      
      for (const file of testFiles) {
        const filePattern = new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const hasError = filePattern.test(output) || output.includes('FAIL');
        
        results.push({
          file,
          status: hasError ? 'failed' : 'passed',
          duration: 0,
          error: hasError ? output : undefined
        });
      }
    }

    return results;
  }

  private generateSummary(results: TestResult[], mode: string): string {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const total = results.length;

    return `
══════════════════════════════════════════════════
QA Mode: ${mode.toUpperCase()}
══════════════════════════════════════════════════

Tests Run: ${total}
  ✓ Passed: ${passed}
  ✗ Failed: ${failed}
  ○ Skipped: ${skipped}

Status: ${failed === 0 ? 'PASSED ✓' : 'FAILED ✗'}
`;
  }
}

export default QASkill;
