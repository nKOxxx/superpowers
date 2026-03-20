import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';
import { QAOptions, QAResult } from './cli';

export class QAController {
  private git = simpleGit();

  async run(options: QAOptions): Promise<QAResult> {
    const framework = options.framework || await this.detectFramework();
    
    if (!framework) {
      throw new Error('No test framework detected. Please specify with --framework');
    }

    // Get changed files if needed
    let testFiles: string[] | undefined;
    if (options.changed) {
      testFiles = await this.getChangedTestFiles(framework);
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

  private async detectFramework(): Promise<string | null> {
    // Check for config files
    const files = fs.readdirSync('.');
    
    // Jest
    if (files.some(f => f.startsWith('jest.config')) || 
        this.hasDependency('jest')) {
      return 'jest';
    }
    
    // Vitest
    if (files.some(f => f.startsWith('vitest.config')) || 
        this.hasDependency('vitest')) {
      return 'vitest';
    }
    
    // Mocha
    if (files.some(f => f.startsWith('.mocharc')) || 
        this.hasDependency('mocha')) {
      return 'mocha';
    }
    
    // pytest (Python)
    if (files.some(f => f === 'pytest.ini' || f === 'pyproject.toml') ||
        fs.existsSync('setup.py') || fs.existsSync('requirements.txt')) {
      return 'pytest';
    }

    return null;
  }

  private hasDependency(name: string): boolean {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      return name in deps;
    } catch {
      return false;
    }
  }

  private async getChangedTestFiles(framework: string): Promise<string[]> {
    const status = await this.git.status();
    const changedFiles = [...status.modified, ...status.created];
    
    // Map source files to test files
    const testFiles: string[] = [];
    const testPatterns = this.getTestPatterns(framework);
    
    for (const file of changedFiles) {
      // Skip test files themselves
      if (testPatterns.some(pattern => file.includes(pattern))) {
        testFiles.push(file);
        continue;
      }
      
      // Find corresponding test file
      const testFile = this.findTestFile(file, framework);
      if (testFile && fs.existsSync(testFile)) {
        testFiles.push(testFile);
      }
    }
    
    return [...new Set(testFiles)];
  }

  private getTestPatterns(framework: string): string[] {
    switch (framework) {
      case 'jest':
      case 'vitest':
        return ['.test.', '.spec.'];
      case 'mocha':
        return ['.test.', '.spec.'];
      case 'pytest':
        return ['test_', '_test.py'];
      default:
        return [];
    }
  }

  private findTestFile(sourceFile: string, framework: string): string | null {
    const ext = path.extname(sourceFile);
    const base = sourceFile.replace(ext, '');
    const dir = path.dirname(sourceFile);
    const name = path.basename(base);
    
    switch (framework) {
      case 'jest':
      case 'vitest':
      case 'mocha':
        // Check common patterns
        const patterns = [
          path.join(dir, `${name}.test${ext}`),
          path.join(dir, `${name}.spec${ext}`),
          path.join(dir, '__tests__', `${name}.test${ext}`),
          path.join(dir, '__tests__', `${name}.spec${ext}`)
        ];
        
        for (const pattern of patterns) {
          if (fs.existsSync(pattern)) {
            return pattern;
          }
        }
        break;
        
      case 'pytest':
        const pyPatterns = [
          path.join(dir, `test_${name}.py`),
          path.join('tests', `${name}_test.py`)
        ];
        
        for (const pattern of pyPatterns) {
          if (fs.existsSync(pattern)) {
            return pattern;
          }
        }
        break;
    }
    
    return null;
  }

  private runJest(options: QAOptions, testFiles?: string[]): Promise<QAResult> {
    const args: string[] = [];
    
    if (options.coverage) args.push('--coverage');
    if (options.watch) args.push('--watch');
    if (options.verbose) args.push('--verbose');
    if (options.grep) args.push('--testNamePattern', options.grep);
    
    if (testFiles && testFiles.length > 0) {
      args.push(...testFiles);
    } else if (options.file) {
      args.push(options.file);
    }

    return this.executeTest('npx', ['jest', ...args], 'jest');
  }

  private runVitest(options: QAOptions, testFiles?: string[]): Promise<QAResult> {
    const args: string[] = [];
    
    if (options.coverage) args.push('--coverage');
    if (options.watch) args.push('--watch');
    if (options.grep) args.push('--testNamePattern', options.grep);
    
    if (testFiles && testFiles.length > 0) {
      args.push(...testFiles);
    } else if (options.file) {
      args.push(options.file);
    }

    return this.executeTest('npx', ['vitest', 'run', ...args], 'vitest');
  }

  private runMocha(options: QAOptions, testFiles?: string[]): Promise<QAResult> {
    const args: string[] = [];
    
    if (options.grep) args.push('--grep', options.grep);
    
    if (testFiles && testFiles.length > 0) {
      args.push(...testFiles);
    } else if (options.file) {
      args.push(options.file);
    } else {
      args.push('"**/*.test.{js,ts}"');
    }

    return this.executeTest('npx', ['mocha', ...args], 'mocha');
  }

  private runPytest(options: QAOptions, testFiles?: string[]): Promise<QAResult> {
    const args: string[] = [];
    
    if (options.coverage) args.push('--cov');
    if (options.grep) args.push('-k', options.grep);
    if (options.verbose) args.push('-v');
    
    if (testFiles && testFiles.length > 0) {
      args.push(...testFiles);
    } else if (options.file) {
      args.push(options.file);
    }

    return this.executeTest('pytest', args, 'pytest');
  }

  private executeTest(command: string, args: string[], framework: string): Promise<QAResult> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
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
        const result = this.parseTestOutput(stdout + stderr, framework);
        result.success = code === 0;
        result.framework = framework;
        resolve(result);
      });
    });
  }

  private parseTestOutput(output: string, framework: string): QAResult {
    const result: QAResult = {
      success: false,
      framework,
      summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      failures: []
    };

    // Parse based on framework
    switch (framework) {
      case 'jest':
        this.parseJestOutput(output, result);
        break;
      case 'vitest':
        this.parseVitestOutput(output, result);
        break;
      case 'mocha':
        this.parseMochaOutput(output, result);
        break;
      case 'pytest':
        this.parsePytestOutput(output, result);
        break;
    }

    return result;
  }

  private parseJestOutput(output: string, result: QAResult): void {
    // Test summary pattern
    const summaryMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed,\s+(\d+)\s+total/);
    if (summaryMatch) {
      result.summary!.passed = parseInt(summaryMatch[1], 10);
      result.summary!.failed = parseInt(summaryMatch[2], 10);
      result.summary!.total = parseInt(summaryMatch[3], 10);
    }

    // Coverage
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      result.coverage = {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4])
      };
    }
  }

  private parseVitestOutput(output: string, result: QAResult): void {
    const summaryMatch = output.match(/(\d+)\s+passed\s+\((\d+)\s+failed\)/);
    if (summaryMatch) {
      result.summary!.passed = parseInt(summaryMatch[1], 10);
      result.summary!.failed = parseInt(summaryMatch[2], 10);
    }
  }

  private parseMochaOutput(output: string, result: QAResult): void {
    const summaryMatch = output.match(/(\d+)\s+passing|(\d+)\s+failing/);
    if (summaryMatch) {
      // Mocha output parsing varies
    }
  }

  private parsePytestOutput(output: string, result: QAResult): void {
    const summaryMatch = output.match(/(\d+)\s+passed,?\s*(\d+)\s+failed,?\s*(\d+)\s+skipped/);
    if (summaryMatch) {
      result.summary!.passed = parseInt(summaryMatch[1], 10);
      result.summary!.failed = parseInt(summaryMatch[2], 10);
      result.summary!.skipped = parseInt(summaryMatch[3], 10);
    }
  }
}
