import { QAMode, QAOptions, QAResults, TestResult } from '../types/index.js';
import { Logger, execSync, loadConfig } from '../utils/index.js';
import * as path from 'path';
import * as fs from 'fs';

export class QASkill {
  private logger: Logger;
  private config: any;

  constructor(verbose = false) {
    this.logger = new Logger(verbose);
    this.config = loadConfig();
  }

  async run(options: QAOptions): Promise<QAResults> {
    this.logger.header(`QA Mode: ${options.mode.toUpperCase()}`);

    const startTime = Date.now();
    let filesChanged: string[] = [];
    let testsToRun: string[] = [];

    // Get changed files for targeted mode
    if (options.mode === 'targeted') {
      filesChanged = this.getChangedFiles(options.diffRange || 'HEAD~1');
      testsToRun = this.mapFilesToTests(filesChanged);
      
      this.logger.section('Files Changed');
      filesChanged.forEach(f => this.logger.info(f));
      
      this.logger.section('Tests Selected');
      testsToRun.forEach(t => this.logger.info(t));
    } else if (options.mode === 'smoke') {
      testsToRun = this.getSmokeTests();
      this.logger.info('Running smoke tests...');
    } else {
      this.logger.info('Running full test suite...');
    }

    // Run tests
    const results = await this.executeTests(testsToRun, options);
    const duration = Date.now() - startTime;

    // Print results
    this.printResults(results, duration);

    return {
      mode: options.mode,
      filesChanged,
      testsRun: results,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration,
      coverage: options.coverage ? this.parseCoverage() : undefined
    };
  }

  private getChangedFiles(diffRange: string): string[] {
    try {
      const output = execSync(`git diff --name-only ${diffRange}`);
      return output.split('\n').filter(f => f.trim() && !f.trim().startsWith('-'));
    } catch (error) {
      this.logger.warn('Could not get changed files, running all tests');
      return [];
    }
  }

  private mapFilesToTests(changedFiles: string[]): string[] {
    const testFiles = new Set<string>();
    
    for (const file of changedFiles) {
      // Skip non-source files
      if (!file.match(/\.(ts|tsx|js|jsx)$/)) continue;
      if (file.includes('.test.') || file.includes('.spec.')) continue;
      
      // Map source file to test file
      const testFile = this.findTestFile(file);
      if (testFile) {
        testFiles.add(testFile);
      }
    }
    
    return Array.from(testFiles);
  }

  private findTestFile(sourceFile: string): string | null {
    const dir = path.dirname(sourceFile);
    const basename = path.basename(sourceFile, path.extname(sourceFile));
    const ext = path.extname(sourceFile);
    
    // Common test file patterns
    const patterns = [
      path.join(dir, `${basename}.test${ext}`),
      path.join(dir, `${basename}.spec${ext}`),
      path.join(dir, '__tests__', `${basename}.test${ext}`),
      path.join('tests', sourceFile.replace(/^src\//, '').replace(ext, `.test${ext}`)),
      path.join('test', sourceFile.replace(/^src\//, '').replace(ext, `.test${ext}`))
    ];
    
    for (const pattern of patterns) {
      if (fs.existsSync(pattern)) {
        return pattern;
      }
    }
    
    return null;
  }

  private getSmokeTests(): string[] {
    // Try to find smoke tests
    try {
      const { execSync } = require('child_process');
      const output = execSync('find . -name "*.test.*" -o -name "*.spec.*" | head -20', { encoding: 'utf-8' });
      return output.split('\n').filter(f => f.includes('smoke') || f.includes('basic') || f.includes('critical'));
    } catch {
      return [];
    }
  }

  private async executeTests(testFiles: string[], options: QAOptions): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Detect test framework
    const framework = this.detectTestFramework();
    this.logger.info(`Detected test framework: ${framework}`);

    try {
      let command: string;
      
      if (testFiles.length > 0 && options.mode === 'targeted') {
        // Run specific test files
        command = this.buildTargetedCommand(framework, testFiles, options);
      } else {
        // Run all tests
        command = this.buildFullCommand(framework, options);
      }

      this.logger.info(`Running: ${command}`);
      
      const { execSync } = require('child_process');
      const startTime = Date.now();
      
      try {
        execSync(command, { 
          stdio: 'inherit',
          timeout: 300000 // 5 minute timeout
        });
        
        results.push({
          file: command,
          passed: true,
          duration: Date.now() - startTime
        });
      } catch (error: any) {
        results.push({
          file: command,
          passed: false,
          duration: Date.now() - startTime,
          error: error.message
        });
      }
    } catch (error: any) {
      this.logger.error(`Failed to run tests: ${error.message}`);
    }

    return results;
  }

  private detectTestFramework(): 'vitest' | 'jest' | 'mocha' | 'unknown' {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return 'unknown';
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.vitest) return 'vitest';
    if (deps.jest) return 'jest';
    if (deps.mocha) return 'mocha';
    
    return 'unknown';
  }

  private buildTargetedCommand(framework: string, testFiles: string[], options: QAOptions): string {
    const coverage = options.coverage ? ' --coverage' : '';
    const parallel = options.parallel ? ' --parallel' : '';
    
    switch (framework) {
      case 'vitest':
        return `npx vitest run ${testFiles.join(' ')}${coverage}${parallel}`;
      case 'jest':
        return `npx jest ${testFiles.join(' ')}${coverage}${parallel}`;
      case 'mocha':
        return `npx mocha ${testFiles.join(' ')}`;
      default:
        return `npm test -- ${testFiles.join(' ')}`;
    }
  }

  private buildFullCommand(framework: string, options: QAOptions): string {
    const coverage = options.coverage ? ' --coverage' : '';
    
    if (options.mode === 'smoke') {
      switch (framework) {
        case 'vitest':
          return `npx vitest run --reporter=verbose${coverage}`;
        case 'jest':
          return `npx jest --testNamePattern="smoke|basic|critical"${coverage}`;
        default:
          return `npm test${coverage}`;
      }
    }
    
    return `npm test${coverage}`;
  }

  private parseCoverage(): number | undefined {
    // Try to parse coverage report
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      try {
        const summary = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
        return summary.total?.lines?.pct;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private printResults(results: TestResult[], duration: number): void {
    this.logger.section('Results');
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    results.forEach(r => {
      const icon = r.passed ? '✓' : '✗';
      console.log(`  ${icon} ${r.file} (${r.duration}ms)`);
      if (r.error) {
        console.log(`    Error: ${r.error}`);
      }
    });

    console.log('\n' + '-'.repeat(40));
    console.log(`Passed: ${passed}/${results.length} (${Math.round((passed / results.length) * 100) || 0}%)`);
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`Status: ${failed === 0 ? 'PASSED ✓' : 'FAILED ✗'}`);
  }
}
