import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface QAOptions {
  mode?: 'targeted' | 'smoke' | 'full';
  coverage?: boolean;
  watch?: boolean;
}

type TestFramework = 'vitest' | 'jest' | 'mocha' | 'unknown';

interface FrameworkConfig {
  name: TestFramework;
  configFiles: string[];
  packageScripts: string[];
  runCommand: string;
  coverageFlag: string;
  watchFlag: string;
}

const frameworks: FrameworkConfig[] = [
  {
    name: 'vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
    packageScripts: ['test', 'vitest'],
    runCommand: 'npx vitest run',
    coverageFlag: '--coverage',
    watchFlag: '--watch'
  },
  {
    name: 'jest',
    configFiles: ['jest.config.ts', 'jest.config.js', 'jest.config.json'],
    packageScripts: ['test', 'jest'],
    runCommand: 'npx jest',
    coverageFlag: '--coverage',
    watchFlag: '--watch'
  },
  {
    name: 'mocha',
    configFiles: ['.mocharc.json', '.mocharc.js', 'mocha.opts'],
    packageScripts: ['test', 'mocha'],
    runCommand: 'npx mocha',
    coverageFlag: '',
    watchFlag: '--watch'
  }
];

function detectFramework(): TestFramework {
  // Check for config files
  for (const fw of frameworks) {
    for (const configFile of fw.configFiles) {
      if (existsSync(join(process.cwd(), configFile))) {
        return fw.name;
      }
    }
  }
  
  // Check package.json scripts
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const scripts = packageJson.scripts || {};
    
    for (const fw of frameworks) {
      for (const script of fw.packageScripts) {
        if (scripts[script] && scripts[script].includes(fw.name)) {
          return fw.name;
        }
      }
    }
  }
  
  // Check node_modules
  for (const fw of frameworks) {
    if (existsSync(join(process.cwd(), 'node_modules', fw.name))) {
      return fw.name;
    }
  }
  
  return 'unknown';
}

function getChangedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

function mapSourceToTest(file: string): string | null {
  // Map src/file.ts to test/file.test.ts or __tests__/file.test.ts
  const patterns = [
    { from: /^src\/(.*)\.ts$/, to: 'test/$1.test.ts' },
    { from: /^src\/(.*)\.ts$/, to: '__tests__/$1.test.ts' },
    { from: /^src\/(.*)\.ts$/, to: 'tests/$1.test.ts' },
    { from: /^src\/(.*)\.ts$/, to: '$1.test.ts' },
    { from: /^(.*)\.ts$/, to: '$1.test.ts' }
  ];
  
  for (const pattern of patterns) {
    const match = file.match(pattern.from);
    if (match) {
      return pattern.to.replace('$1', match[1]);
    }
  }
  return null;
}

function getFrameworkConfig(framework: TestFramework): FrameworkConfig {
  return frameworks.find(f => f.name === framework) || frameworks[0];
}

async function runTests(
  framework: TestFramework,
  options: QAOptions,
  testFiles?: string[]
): Promise<{ success: boolean; output: string }> {
  const config = getFrameworkConfig(framework);
  let command = config.runCommand;
  
  if (options.coverage && config.coverageFlag) {
    command += ` ${config.coverageFlag}`;
  }
  
  if (options.watch && config.watchFlag) {
    command += ` ${config.watchFlag}`;
  }
  
  if (testFiles && testFiles.length > 0 && framework === 'vitest') {
    // For vitest, we can filter by test name pattern
    command += ` ${testFiles.join(' ')}`;
  }
  
  if (testFiles && testFiles.length > 0 && framework === 'jest') {
    command += ` ${testFiles.join(' ')}`;
  }
  
  return new Promise((resolve) => {
    const child = spawn('sh', ['-c', command], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    let output = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output
      });
    });
  });
}

export const qaCommand = new Command('qa')
  .description('Systematic testing as QA Lead - targeted, smoke, or full regression')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-w, --watch', 'Watch mode for development')
  .action(async (options: QAOptions) => {
    const spinner = ora('Detecting test framework...').start();
    
    const framework = detectFramework();
    
    if (framework === 'unknown') {
      spinner.fail(chalk.red('No test framework detected. Install vitest, jest, or mocha.'));
      process.exit(1);
    }
    
    spinner.succeed(chalk.green(`Framework detected: ${framework}`));
    
    let testFiles: string[] | undefined;
    
    if (options.mode === 'targeted') {
      spinner.start('Analyzing git diff for targeted tests...');
      const changedFiles = getChangedFiles();
      const sourceFiles = changedFiles.filter(f => 
        f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.jsx')
      );
      
      testFiles = sourceFiles
        .map(mapSourceToTest)
        .filter((f): f is string => f !== null)
        .filter(f => existsSync(join(process.cwd(), f)));
      
      if (testFiles.length === 0) {
        spinner.warn(chalk.yellow('No test files mapped from changes. Running smoke tests.'));
        options.mode = 'smoke';
      } else {
        spinner.succeed(chalk.green(`Found ${testFiles.length} relevant test files`));
        console.log(chalk.gray(testFiles.map(f => `  - ${f}`).join('\n')));
      }
    } else if (options.mode === 'smoke') {
      spinner.info(chalk.blue('Running smoke tests (quick validation)...'));
    } else {
      spinner.info(chalk.blue('Running full regression suite...'));
    }
    
    const testSpinner = ora(`Running ${options.mode} tests...`).start();
    
    try {
      const result = await runTests(framework, options, testFiles);
      
      if (result.success) {
        testSpinner.succeed(chalk.green('All tests passed!'));
        if (options.coverage) {
          console.log(chalk.blue('\nCoverage report generated'));
        }
      } else {
        testSpinner.fail(chalk.red('Tests failed'));
        console.log(result.output);
        process.exit(1);
      }
    } catch (error) {
      testSpinner.fail(chalk.red(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
