import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

export type TestMode = 'targeted' | 'smoke' | 'full';
export type TestFramework = 'vitest' | 'jest' | 'mocha' | 'unknown';

export interface QAOptions {
  mode?: TestMode;
  coverage?: boolean;
  watch?: boolean;
  testPathPattern?: string;
}

export interface QAResult {
  success: boolean;
  framework: TestFramework;
  mode: TestMode;
  output: string;
  error?: string;
  duration: number;
  testCount?: number;
  passedCount?: number;
  failedCount?: number;
}

interface GitChange {
  file: string;
  status: 'added' | 'modified' | 'deleted';
}

function detectFramework(): TestFramework {
  if (existsSync('vitest.config.ts') || existsSync('vitest.config.js')) {
    return 'vitest';
  }
  if (existsSync('jest.config.js') || existsSync('jest.config.ts')) {
    return 'jest';
  }
  if (existsSync('.mocharc.json') || existsSync('.mocharc.js')) {
    return 'mocha';
  }
  // Check package.json
  try {
    const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
    if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) return 'vitest';
    if (pkg.devDependencies?.jest || pkg.dependencies?.jest) return 'jest';
    if (pkg.devDependencies?.mocha || pkg.dependencies?.mocha) return 'mocha';
  } catch {
    // ignore
  }
  return 'unknown';
}

function getGitChanges(): GitChange[] {
  try {
    const output = execSync('git diff --name-status HEAD~1 HEAD', { encoding: 'utf8', cwd: process.cwd() });
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [status, file] = line.split('\t');
        return {
          file,
          status: status === 'A' ? 'added' : status === 'D' ? 'deleted' : 'modified',
        };
      });
  } catch {
    return [];
  }
}

function mapSourceToTest(file: string): string | null {
  // Map source files to their corresponding test files
  if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) return file;
  if (file.endsWith('.ts')) {
    const base = file.replace('.ts', '');
    return `${base}.test.ts`;
  }
  if (file.endsWith('.js')) {
    const base = file.replace('.js', '');
    return `${base}.test.js`;
  }
  return null;
}

function buildTestCommand(framework: TestFramework, options: QAOptions, testFiles?: string[]): { command: string; args: string[] } {
  const args: string[] = [];

  switch (framework) {
    case 'vitest':
      args.push('run');
      if (options.coverage) args.push('--coverage');
      if (testFiles && testFiles.length > 0) {
        args.push(...testFiles);
      }
      return { command: 'npx', args: ['vitest', ...args] };

    case 'jest':
      if (options.coverage) args.push('--coverage');
      if (testFiles && testFiles.length > 0) {
        args.push('--testPathPattern', testFiles.join('|'));
      }
      return { command: 'npx', args: ['jest', ...args] };

    case 'mocha':
      if (testFiles && testFiles.length > 0) {
        args.push(...testFiles);
      } else {
        args.push('"src/**/*.test.js"');
      }
      return { command: 'npx', args: ['mocha', ...args] };

    default:
      throw new Error('No supported test framework detected');
  }
}

export async function runQA(options: QAOptions = {}): Promise<QAResult> {
  const startTime = Date.now();
  const mode = options.mode || 'targeted';
  
  try {
    const framework = detectFramework();
    if (framework === 'unknown') {
      throw new Error('No supported test framework detected. Install vitest, jest, or mocha.');
    }

    let testFiles: string[] | undefined;

    if (mode === 'targeted') {
      const changes = getGitChanges();
      testFiles = changes
        .map(c => mapSourceToTest(c.file))
        .filter((f): f is string => f !== null)
        .filter(f => existsSync(f));
      
      if (testFiles.length === 0) {
        console.log('No test files mapped from recent changes. Running smoke tests...');
      }
    }

    const { command, args } = buildTestCommand(framework, options, testFiles);

    console.log(`Running ${mode} tests with ${framework}...`);
    const output = execSync(`${command} ${args.join(' ')}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    const duration = Date.now() - startTime;

    // Parse test results
    const testMatch = output.match(/(\d+) tests?/);
    const passedMatch = output.match(/(\d+) passing/);
    const failedMatch = output.match(/(\d+) failing/);

    return {
      success: !output.includes('FAIL') && !output.includes('failing'),
      framework,
      mode,
      output,
      duration,
      testCount: testMatch ? parseInt(testMatch[1], 10) : undefined,
      passedCount: passedMatch ? parseInt(passedMatch[1], 10) : undefined,
      failedCount: failedMatch ? parseInt(failedMatch[1], 10) : 0,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a test failure vs execution error
    const isTestFailure = errorMessage.includes('failing') || errorMessage.includes('exit code 1');
    
    return {
      success: false,
      framework: detectFramework(),
      mode,
      output: errorMessage,
      error: isTestFailure ? 'Tests failed' : errorMessage,
      duration,
      failedCount: isTestFailure ? 1 : undefined,
    };
  }
}