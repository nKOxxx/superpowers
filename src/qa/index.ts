import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import pc from 'picocolors';
import ora from 'ora';

interface QAOptions {
  mode: string;
  diff: string;
  coverage: boolean;
  parallel: boolean;
}

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

export async function qaCommand(options: QAOptions): Promise<void> {
  console.log(pc.blue('══════════════════════════════════════════════════'));
  console.log(pc.blue(`QA Mode: ${options.mode.toUpperCase()}`));
  console.log(pc.blue('══════════════════════════════════════════════════\n'));
  
  const spinner = ora('Analyzing repository...').start();
  
  try {
    // Check if we're in a git repo
    let changedFiles: string[] = [];
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      
      if (options.mode === 'targeted') {
        spinner.text = 'Analyzing git diff...';
        const diffOutput = execSync(`git diff ${options.diff} --name-only`, { 
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        changedFiles = diffOutput.split('\n').filter(f => f.trim() !== '');
      }
    } catch {
      spinner.warn('Not a git repository or git command failed');
    }
    
    // Detect test framework
    spinner.text = 'Detecting test framework...';
    const framework = await detectTestFramework();
    
    spinner.stop();
    
    if (options.mode === 'targeted') {
      await runTargetedTests(changedFiles, framework, options);
    } else if (options.mode === 'smoke') {
      await runSmokeTests(framework, options);
    } else if (options.mode === 'full') {
      await runFullTests(framework, options);
    }
    
  } catch (error) {
    spinner.fail(pc.red(`QA failed: ${error instanceof Error ? error.message : String(error)}`));
    throw error;
  }
}

async function detectTestFramework(): Promise<'vitest' | 'jest' | 'mocha' | 'unknown'> {
  try {
    await fs.access('node_modules/vitest');
    return 'vitest';
  } catch {
    try {
      await fs.access('node_modules/jest');
      return 'jest';
    } catch {
      try {
        await fs.access('node_modules/mocha');
        return 'mocha';
      } catch {
        return 'unknown';
      }
    }
  }
}

async function runTargetedTests(
  changedFiles: string[], 
  framework: string, 
  options: QAOptions
): Promise<void> {
  if (changedFiles.length === 0) {
    console.log(pc.yellow('No changed files detected. Running smoke tests instead...'));
    await runSmokeTests(framework, options);
    return;
  }
  
  console.log(pc.cyan(`Files Changed: ${changedFiles.length}`));
  for (const file of changedFiles.slice(0, 10)) {
    console.log(pc.gray(`  - ${file}`));
  }
  if (changedFiles.length > 10) {
    console.log(pc.gray(`  ... and ${changedFiles.length - 10} more`));
  }
  console.log();
  
  // Map changed files to test files
  const testFiles = mapFilesToTests(changedFiles);
  
  if (testFiles.length === 0) {
    console.log(pc.yellow('No test files mapped. Running smoke tests instead...'));
    await runSmokeTests(framework, options);
    return;
  }
  
  console.log(pc.cyan(`Tests Selected: ${testFiles.length}`));
  for (const file of testFiles) {
    console.log(pc.gray(`  - ${file}`));
  }
  console.log();
  
  // Run the tests
  await runTestCommand(framework, testFiles, options);
}

function mapFilesToTests(changedFiles: string[]): string[] {
  const testFiles = new Set<string>();
  
  for (const file of changedFiles) {
    // Map src files to test files
    if (file.startsWith('src/')) {
      const ext = path.extname(file);
      const base = file.replace(/^src\//, '').replace(ext, '');
      
      // Try common test file patterns
      const patterns = [
        `tests/${base}.test${ext}`,
        `tests/${base}.spec${ext}`,
        `__tests__/${base}.test${ext}`,
        `src/${base}.test${ext}`,
        `src/${base}.spec${ext}`,
        `test/${base}.test${ext}`
      ];
      
      for (const pattern of patterns) {
        testFiles.add(pattern);
      }
    }
    
    // If it's already a test file, include it
    if (file.includes('.test.') || file.includes('.spec.')) {
      testFiles.add(file);
    }
  }
  
  return Array.from(testFiles);
}

async function runSmokeTests(framework: string, options: QAOptions): Promise<void> {
  console.log(pc.cyan('Running smoke tests...\n'));
  
  // For smoke tests, just run a basic build check if no specific smoke tests
  try {
    const spinner = ora('Running build check...').start();
    execSync('npm run build --if-present', { stdio: 'pipe' });
    spinner.succeed('Build check passed');
    
    console.log(pc.blue('──────────────────────────────────────────────────'));
    console.log(pc.green('Passed: Build successful'));
    console.log(`Status: ${pc.green('PASSED')}`);
    console.log(pc.blue('──────────────────────────────────────────────────'));
  } catch {
    // Fall back to running tests
    await runTestCommand(framework, [], options);
  }
}

async function runFullTests(framework: string, options: QAOptions): Promise<void> {
  console.log(pc.cyan('Running full test suite...\n'));
  await runTestCommand(framework, [], options);
}

async function runTestCommand(
  framework: string, 
  testFiles: string[], 
  options: QAOptions,
  extraArgs: string[] = []
): Promise<void> {
  let command: string;
  let args: string[] = [];
  
  if (framework === 'vitest') {
    command = 'npx';
    args = ['vitest', 'run'];
    if (testFiles.length > 0) {
      args.push(...testFiles);
    }
    if (options.coverage) {
      args.push('--coverage');
    }
    if (options.parallel) {
      // vitest runs parallel by default
    } else {
      args.push('--pool=forks', '--poolOptions.threads.singleThread');
    }
    args.push(...extraArgs);
  } else if (framework === 'jest') {
    command = 'npx';
    args = ['jest'];
    if (testFiles.length > 0) {
      args.push(...testFiles);
    }
    if (options.coverage) {
      args.push('--coverage');
    }
    args.push(...extraArgs);
  } else {
    // Fallback to npm test
    command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    args = ['test'];
    if (options.coverage) {
      args.push('--', '--coverage');
    }
  }
  
  return new Promise((resolve, reject) => {
    const spinner = ora('Running tests...').start();
    
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: process.platform === 'win32'
    });
    
    let output = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      spinner.stop();
      
      // Print the output
      console.log(output);
      
      // Parse results
      const results = parseTestResults(output);
      printResults(results);
      
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      spinner.fail(pc.red(`Failed to run tests: ${error.message}`));
      reject(error);
    });
  });
}

function parseTestResults(output: string): TestResult[] {
  // Simple parsing for vitest/jest output
  const results: TestResult[] = [];
  
  // Match patterns like "✓ test-name (245ms)" or "✗ test-name (112ms)"
  const passPattern = /[✓√]\s+(.+?)\s+\((\d+)m?s\)/g;
  const failPattern = /[✗×✕]\s+(.+?)\s+\((\d+)m?s\)/g;
  
  let match;
  while ((match = passPattern.exec(output)) !== null) {
    results.push({
      name: match[1].trim(),
      passed: true,
      duration: parseInt(match[2], 10) || 0
    });
  }
  
  while ((match = failPattern.exec(output)) !== null) {
    results.push({
      name: match[1].trim(),
      passed: false,
      duration: parseInt(match[2], 10) || 0
    });
  }
  
  return results;
}

function printResults(results: TestResult[]): void {
  console.log(pc.blue('──────────────────────────────────────────────────'));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(pc.green(`Passed: ${passed}/${results.length}`));
  if (failed > 0) {
    console.log(pc.red(`Failed: ${failed}/${results.length}`));
  }
  
  const status = failed === 0 ? pc.green('PASSED') : pc.red('FAILED');
  console.log(`Status: ${status}`);
  console.log(pc.blue('──────────────────────────────────────────────────'));
}
