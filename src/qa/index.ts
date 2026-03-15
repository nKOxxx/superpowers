import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export type QAMode = 'targeted' | 'smoke' | 'full';

export interface QAOptions {
  mode: QAMode;
  coverage?: boolean;
  testPath?: string;
}

export interface QAResult {
  success: boolean;
  framework: string;
  mode: QAMode;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  duration: number;
  output: string;
  coverage?: string;
}

export class QASkill {
  private detectFramework(projectPath: string = process.cwd()): string {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return 'unknown';
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (deps.vitest) return 'vitest';
    if (deps.jest) return 'jest';
    if (deps.mocha) return 'mocha';
    if (deps.ava) return 'ava';
    if (deps['tap']) return 'tap';

    // Check for config files
    if (fs.existsSync(path.join(projectPath, 'vitest.config.ts')) ||
        fs.existsSync(path.join(projectPath, 'vitest.config.js'))) {
      return 'vitest';
    }
    if (fs.existsSync(path.join(projectPath, 'jest.config.ts')) ||
        fs.existsSync(path.join(projectPath, 'jest.config.js'))) {
      return 'jest';
    }
    if (fs.existsSync(path.join(projectPath, '.mocharc.js')) ||
        fs.existsSync(path.join(projectPath, '.mocharc.json'))) {
      return 'mocha';
    }

    return 'unknown';
  }

  private getChangedFiles(): string[] {
    try {
      const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
      return output.trim().split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
    } catch {
      return [];
    }
  }

  private findTestFiles(sourceFiles: string[]): string[] {
    const testFiles: string[] = [];
    
    for (const file of sourceFiles) {
      const dir = path.dirname(file);
      const base = path.basename(file, path.extname(file));
      
      // Common test file patterns
      const patterns = [
        path.join(dir, `${base}.test.ts`),
        path.join(dir, `${base}.test.js`),
        path.join(dir, `${base}.spec.ts`),
        path.join(dir, `${base}.spec.js`),
        path.join(dir, '__tests__', `${base}.test.ts`),
        path.join('test', `${base}.test.ts`),
        path.join('tests', `${base}.test.ts`),
      ];

      for (const pattern of patterns) {
        if (fs.existsSync(pattern)) {
          testFiles.push(pattern);
          break;
        }
      }
    }

    return [...new Set(testFiles)];
  }

  private buildCommand(framework: string, options: QAOptions, testFiles?: string[]): string {
    const coverageFlag = options.coverage ? '--coverage' : '';
    
    switch (framework) {
      case 'vitest': {
        let cmd = `npx vitest run ${coverageFlag}`;
        if (testFiles && testFiles.length > 0) {
          cmd += ' ' + testFiles.join(' ');
        }
        return cmd;
      }
      case 'jest': {
        let cmd = `npx jest ${coverageFlag}`;
        if (testFiles && testFiles.length > 0) {
          cmd += ' ' + testFiles.join(' ');
        }
        return cmd;
      }
      case 'mocha': {
        let cmd = 'npx mocha';
        if (testFiles && testFiles.length > 0) {
          cmd += ' ' + testFiles.join(' ');
        } else {
          cmd += ' "test/**/*.test.js"';
        }
        return cmd;
      }
      default:
        throw new Error(`Unsupported test framework: ${framework}`);
    }
  }

  async runTests(options: QAOptions): Promise<QAResult> {
    const framework = this.detectFramework();
    
    if (framework === 'unknown') {
      throw new Error('Could not detect test framework. Please ensure vitest, jest, or mocha is installed.');
    }

    let testFiles: string[] | undefined;

    // Determine which tests to run based on mode
    if (options.mode === 'targeted') {
      const changedFiles = this.getChangedFiles();
      if (changedFiles.length > 0) {
        testFiles = this.findTestFiles(changedFiles);
        console.log(`Detected changes in: ${changedFiles.join(', ')}`);
        console.log(`Mapped to test files: ${testFiles.join(', ') || 'None found'}`);
      }
    } else if (options.mode === 'smoke') {
      // Run only smoke tests or a subset
      testFiles = ['test/smoke.test.ts', 'test/smoke.test.js'].filter(f => fs.existsSync(f));
    }
    // 'full' mode runs all tests (no filter)

    const command = this.buildCommand(framework, options, testFiles);
    
    console.log(`Running: ${command}`);
    
    const startTime = Date.now();
    let output = '';
    let success = false;
    let testsRun = 0;
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      output = execSync(command, { 
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 300000, // 5 minute timeout
      });
      success = true;
      
      // Parse test results
      const resultMatch = output.match(/(\d+)\s+passed|Tests:\s+(\d+)\s+passed/);
      if (resultMatch) {
        testsPassed = parseInt(resultMatch[1] || resultMatch[2], 10);
        testsRun = testsPassed;
      }
    } catch (error: any) {
      output = error.stdout || error.message;
      success = false;
      
      // Parse failed results
      const failMatch = output.match(/(\d+)\s+failed|(\d+)\s+passed/);
      if (failMatch) {
        testsFailed = parseInt(failMatch[1], 10) || 0;
        testsPassed = parseInt(failMatch[2], 10) || 0;
        testsRun = testsPassed + testsFailed;
      }
    }

    const duration = Date.now() - startTime;

    return {
      success,
      framework,
      mode: options.mode,
      testsRun,
      testsPassed,
      testsFailed,
      duration,
      output,
    };
  }
}

// CLI entry point
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    
    const options: QAOptions = {
      mode: 'targeted',
    };

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--mode=targeted' || arg === '-m=targeted') {
        options.mode = 'targeted';
      } else if (arg === '--mode=smoke') {
        options.mode = 'smoke';
      } else if (arg === '--mode=full') {
        options.mode = 'full';
      } else if (arg === '--coverage' || arg === '-c') {
        options.coverage = true;
      } else if (arg.startsWith('--path=')) {
        options.testPath = arg.split('=')[1];
      }
    }

    const skill = new QASkill();
    try {
      const result = await skill.runTests(options);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }, null, 2));
      process.exit(1);
    }
  }

  main();
}
