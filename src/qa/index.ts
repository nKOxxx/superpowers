import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface TestFramework {
  name: string;
  configFiles: string[];
  testCommands: {
    targeted: string;
    smoke: string;
    full: string;
    coverage: string;
  };
}

interface TestResult {
  success: boolean;
  output: string;
  coverage?: string;
  duration: number;
}

interface QAMode {
  name: 'targeted' | 'smoke' | 'full';
  description: string;
}

const TEST_FRAMEWORKS: TestFramework[] = [
  {
    name: 'vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
    testCommands: {
      targeted: 'npx vitest run --reporter=verbose',
      smoke: 'npx vitest run --reporter=verbose --testNamePattern="smoke"',
      full: 'npx vitest run --reporter=verbose',
      coverage: 'npx vitest run --coverage --reporter=verbose'
    }
  },
  {
    name: 'jest',
    configFiles: ['jest.config.ts', 'jest.config.js', 'jest.config.mjs', 'package.json'],
    testCommands: {
      targeted: 'npx jest --verbose',
      smoke: 'npx jest --verbose --testNamePattern="smoke"',
      full: 'npx jest --verbose',
      coverage: 'npx jest --coverage --verbose'
    }
  },
  {
    name: 'mocha',
    configFiles: ['.mocharc.json', '.mocharc.js', 'package.json'],
    testCommands: {
      targeted: 'npx mocha --reporter spec',
      smoke: 'npx mocha --reporter spec --grep "smoke"',
      full: 'npx mocha --reporter spec',
      coverage: 'npx c8 npx mocha --reporter spec'
    }
  }
];

const QA_MODES: QAMode[] = [
  { name: 'targeted', description: 'Analyze git diff and run relevant tests' },
  { name: 'smoke', description: 'Quick validation smoke tests' },
  { name: 'full', description: 'Complete regression test suite' }
];

function detectFramework(): TestFramework | null {
  for (const fw of TEST_FRAMEWORKS) {
    for (const configFile of fw.configFiles) {
      if (existsSync(join(process.cwd(), configFile))) {
        // For package.json, check if it has the framework
        if (configFile === 'package.json') {
          const pkg = JSON.parse(readFileSync(join(process.cwd(), configFile), 'utf-8'));
          if (pkg.devDependencies?.[fw.name] || pkg.dependencies?.[fw.name]) {
            return fw;
          }
        } else {
          return fw;
        }
      }
    }
  }
  return null;
}

function getGitDiff(): string[] {
  try {
    const diffOutput = execSync('git diff HEAD~1 --name-only', { encoding: 'utf-8', cwd: process.cwd() });
    return diffOutput.trim().split('\n').filter(f => f.length > 0);
  } catch {
    try {
      const diffOutput = execSync('git diff --name-only', { encoding: 'utf-8', cwd: process.cwd() });
      return diffOutput.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }
}

function mapFilesToTests(files: string[], _fw: TestFramework): string[] {
  const testFiles: string[] = [];
  
  for (const file of files) {
    // Skip test files themselves
    if (file.includes('.test.') || file.includes('.spec.')) {
      continue;
    }
    
    // Map source files to their test counterparts
    const extensions = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
    const basePath = file
      .replace(/^src\//, '')
      .replace(/\.[^.]+$/, '');
    
    for (const ext of extensions) {
      const possibleTests = [
        `${basePath}${ext}`,
        `test/${basePath}${ext}`,
        `tests/${basePath}${ext}`,
        `__tests__/${basePath}${ext}`,
        file.replace(/\.[^.]+$/, ext)
      ];
      
      for (const testPath of possibleTests) {
        if (existsSync(join(process.cwd(), testPath))) {
          testFiles.push(testPath);
          break;
        }
      }
    }
  }
  
  return [...new Set(testFiles)];
}

function runTests(command: string, cwd: string): TestResult {
  const startTime = Date.now();
  
  try {
    const output = execSync(command, { 
      encoding: 'utf-8', 
      cwd,
      stdio: 'pipe'
    });
    
    return {
      success: true,
      output,
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || error.message,
      duration: Date.now() - startTime
    };
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function runQAMode(mode: 'targeted' | 'smoke' | 'full', options: { coverage?: boolean }): Promise<void> {
  const spinner = ora(`Running QA mode: ${mode}...`).start();
  
  try {
    // Detect test framework
    const fw = detectFramework();
    
    if (!fw) {
      spinner.fail(chalk.red('No test framework detected. Supported: vitest, jest, mocha'));
      process.exit(1);
    }
    
    spinner.text = `Detected framework: ${chalk.cyan(fw.name)}`;
    
    let command: string;
    
    if (mode === 'targeted') {
      const changedFiles = getGitDiff();
      
      if (changedFiles.length === 0) {
        spinner.warn(chalk.yellow('No git changes detected. Running full test suite instead.'));
        command = fw.testCommands.full;
      } else {
        spinner.text = `Analyzing ${changedFiles.length} changed files...`;
        const testFiles = mapFilesToTests(changedFiles, fw);
        
        if (testFiles.length === 0) {
          spinner.warn(chalk.yellow('No related test files found. Running full test suite.'));
          command = fw.testCommands.full;
        } else {
          spinner.text = `Found ${testFiles.length} related test files`;
          console.log(chalk.gray('\n  Changed files:'));
          changedFiles.slice(0, 5).forEach(f => console.log(chalk.gray(`    - ${f}`)));
          if (changedFiles.length > 5) {
            console.log(chalk.gray(`    ... and ${changedFiles.length - 5} more`));
          }
          console.log(chalk.gray('\n  Mapped test files:'));
          testFiles.forEach(f => console.log(chalk.gray(`    - ${f}`)));
          
          // Run specific test files
          const testPattern = testFiles.join(' ');
          command = `${fw.testCommands.targeted} ${testPattern}`;
        }
      }
    } else if (mode === 'smoke') {
      command = fw.testCommands.smoke;
    } else {
      command = fw.testCommands.full;
    }
    
    if (options.coverage) {
      command = fw.testCommands.coverage;
    }
    
    spinner.text = 'Running tests...';
    const result = runTests(command, process.cwd());
    
    spinner.stop();
    
    // Print results
    console.log('\n' + chalk.cyan('═'.repeat(60)));
    console.log(chalk.bold(`  QA Test Results: ${mode.toUpperCase()} Mode`));
    console.log(chalk.cyan('═'.repeat(60)));
    
    if (result.success) {
      console.log(chalk.green(`\n  ✓ All tests passed`));
    } else {
      console.log(chalk.red(`\n  ✗ Tests failed`));
    }
    
    console.log(chalk.gray(`  Duration: ${formatDuration(result.duration)}`));
    console.log(chalk.gray(`  Framework: ${fw.name}`));
    
    // Extract test counts from output
    const testMatch = result.output.match(/(\d+)\s+passing|Tests:\s+(\d+)\s+passed/);
    const failMatch = result.output.match(/(\d+)\s+failing|Tests:\s+.*?(\d+)\s+failed/);
    
    if (testMatch) {
      console.log(chalk.green(`  Passing: ${testMatch[1] || testMatch[2]}`));
    }
    if (failMatch) {
      console.log(chalk.red(`  Failing: ${failMatch[1] || failMatch[2]}`));
    }
    
    console.log(chalk.cyan('\n─'.repeat(60)));
    console.log(chalk.gray(result.output));
    console.log(chalk.cyan('─'.repeat(60) + '\n'));
    
    if (!result.success) {
      process.exit(1);
    }
    
  } catch (error) {
    spinner.fail(chalk.red(`QA run failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

const program = new Command();

program
  .name('qa')
  .description('Systematic testing as QA Lead')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('--list-frameworks', 'List detected test frameworks')
  .action(async (options) => {
    if (options.listFrameworks) {
      const fw = detectFramework();
      console.log(chalk.cyan('Detected Test Framework:'));
      if (fw) {
        console.log(`  ${chalk.green('✓')} ${fw.name}`);
      } else {
        console.log(`  ${chalk.red('✗')} None detected`);
        console.log(chalk.gray('  Supported: vitest, jest, mocha'));
      }
      return;
    }
    
    const mode = options.mode as 'targeted' | 'smoke' | 'full';
    
    if (!QA_MODES.find(m => m.name === mode)) {
      console.error(chalk.red(`Invalid mode: ${mode}`));
      console.log(chalk.gray(`Valid modes: ${QA_MODES.map(m => m.name).join(', ')}`));
      process.exit(1);
    }
    
    await runQAMode(mode, { coverage: options.coverage });
  });

program
  .command('targeted')
  .description('Run targeted tests based on git diff')
  .option('-c, --coverage', 'Enable coverage reporting')
  .action(async (options) => {
    await runQAMode('targeted', { coverage: options.coverage });
  });

program
  .command('smoke')
  .description('Run smoke tests')
  .option('-c, --coverage', 'Enable coverage reporting')
  .action(async (options) => {
    await runQAMode('smoke', { coverage: options.coverage });
  });

program
  .command('full')
  .description('Run full regression test suite')
  .option('-c, --coverage', 'Enable coverage reporting')
  .action(async (options) => {
    await runQAMode('full', { coverage: options.coverage });
  });

program
  .command('modes')
  .description('Show available QA modes')
  .action(() => {
    console.log(chalk.cyan('Available QA Modes:'));
    console.log('');
    for (const mode of QA_MODES) {
      console.log(`  ${chalk.yellow(mode.name.padEnd(12))} ${mode.description}`);
    }
  });

// Run if called directly
if (require.main === module) {
  program.parse();
}

export { runQAMode, detectFramework, getGitDiff, mapFilesToTests };
export type { TestFramework, TestResult, QAMode };