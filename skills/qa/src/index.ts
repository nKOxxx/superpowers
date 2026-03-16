import { Command } from 'commander';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { resolve, join, relative } from 'path';

interface QAOptions {
  mode?: string;
  diff?: string;
  coverage?: boolean;
  framework?: string;
  json?: boolean;
}

interface TestFramework {
  name: string;
  configFiles: string[];
  testCommands: Record<string, string>;
}

const FRAMEWORKS: TestFramework[] = [
  {
    name: 'vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
    testCommands: {
      targeted: 'npx vitest run --reporter=verbose',
      smoke: 'npx vitest run --reporter=verbose --testNamePattern="smoke|basic|critical"',
      full: 'npx vitest run --reporter=verbose',
      coverage: 'npx vitest run --coverage'
    }
  },
  {
    name: 'jest',
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.mjs'],
    testCommands: {
      targeted: 'npx jest --verbose',
      smoke: 'npx jest --verbose --testNamePattern="smoke|basic|critical"',
      full: 'npx jest --verbose',
      coverage: 'npx jest --coverage --verbose'
    }
  },
  {
    name: 'mocha',
    configFiles: ['.mocharc.js', '.mocharc.json', '.mocharc.yaml'],
    testCommands: {
      targeted: 'npx mocha --reporter spec',
      smoke: 'npx mocha --grep "smoke|basic|critical" --reporter spec',
      full: 'npx mocha --reporter spec',
      coverage: 'npx c8 npx mocha --reporter spec'
    }
  }
];

const program = new Command();

program
  .name('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-d, --diff <range>', 'Git diff range for targeted mode', 'HEAD~1')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-f, --framework <framework>', 'Force specific framework (vitest, jest, mocha)')
  .option('-j, --json', 'Output results as JSON', false)
  .action(async (options: QAOptions) => {
    const spinner = ora('Analyzing project...').start();
    
    try {
      // Check git repository
      const isGitRepo = checkGitRepo();
      if (!isGitRepo) {
        spinner.fail('Not a git repository');
        console.error(chalk.red('✗ QA skill requires a git repository'));
        process.exit(1);
      }

      // Detect test framework
      const framework = options.framework 
        ? FRAMEWORKS.find(f => f.name === options.framework)
        : detectFramework();

      if (!framework) {
        spinner.fail('No test framework detected');
        console.error(chalk.red('✗ Could not detect test framework'));
        console.error(chalk.gray('  Supported: vitest, jest, mocha'));
        console.error(chalk.gray('  Use --framework to specify manually'));
        process.exit(1);
      }

      spinner.succeed(`Framework: ${framework.name}`);

      // Get relevant tests for targeted mode
      let testFiles: string[] = [];
      if (options.mode === 'targeted') {
        const diffSpinner = ora('Analyzing git diff...').start();
        testFiles = getRelevantTests(options.diff || 'HEAD~1');
        diffSpinner.succeed(`Found ${testFiles.length} relevant test(s)`);
      }

      // Build test command
      const mode = options.mode || 'targeted';
      let testCommand = framework.testCommands[mode];
      
      if (options.coverage) {
        testCommand = framework.testCommands.coverage;
      }

      if (mode === 'targeted' && testFiles.length > 0) {
        testCommand += ' ' + testFiles.join(' ');
      }

      // Run tests
      const testSpinner = ora(`Running ${mode} tests...`).start();
      
      try {
        const output = execSync(testCommand, { 
          encoding: 'utf-8',
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        testSpinner.succeed('Tests passed!');
        
        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            framework: framework.name,
            mode: mode,
            testsRun: testFiles.length || 'all',
            coverage: options.coverage || false,
            output: output
          }, null, 2));
        } else {
          console.log(chalk.green('\n✓ All tests passed'));
          console.log(chalk.gray(`  Framework: ${framework.name}`));
          console.log(chalk.gray(`  Mode: ${mode}`));
          if (testFiles.length > 0) {
            console.log(chalk.gray(`  Tests: ${testFiles.length} targeted`));
          }
        }

      } catch (testError) {
        testSpinner.fail('Tests failed');
        
        const errorOutput = testError instanceof Error && 'stdout' in testError 
          ? String((testError as any).stdout) + String((testError as any).stderr)
          : String(testError);

        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            framework: framework.name,
            mode: mode,
            error: errorOutput
          }, null, 2));
        } else {
          console.error(chalk.red('\n✗ Tests failed'));
          console.error(chalk.gray(errorOutput));
        }
        
        process.exit(1);
      }

    } catch (error) {
      spinner.fail('QA analysis failed');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: errorMessage
        }, null, 2));
      } else {
        console.error(chalk.red(`\n✗ Error: ${errorMessage}`));
      }
      
      process.exit(1);
    }
  });

function checkGitRepo(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function detectFramework(): TestFramework | null {
  for (const framework of FRAMEWORKS) {
    for (const configFile of framework.configFiles) {
      if (existsSync(configFile)) {
        return framework;
      }
    }
  }
  
  // Check package.json for test scripts
  if (existsSync('package.json')) {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    const testScript = pkg.scripts?.test || '';
    
    if (testScript.includes('vitest')) return FRAMEWORKS[0];
    if (testScript.includes('jest')) return FRAMEWORKS[1];
    if (testScript.includes('mocha')) return FRAMEWORKS[2];
  }
  
  return null;
}

function getRelevantTests(diffRange: string): string[] {
  try {
    // Get changed files
    const diffOutput = execSync(`git diff --name-only ${diffRange}`, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    const changedFiles = diffOutput.trim().split('\n').filter(f => f);
    const testFiles: string[] = [];
    
    for (const file of changedFiles) {
      // If it's already a test file, include it
      if (file.includes('.test.') || file.includes('.spec.')) {
        testFiles.push(file);
        continue;
      }
      
      // Map source file to test file
      const testFile = findCorrespondingTest(file);
      if (testFile) {
        testFiles.push(testFile);
      }
    }
    
    // Remove duplicates
    return [...new Set(testFiles)];
    
  } catch {
    return [];
  }
}

function findCorrespondingTest(sourceFile: string): string | null {
  const extensions = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
  const dir = dirname(sourceFile);
  const base = basename(sourceFile).replace(/\.(ts|js|tsx|jsx)$/, '');
  
  // Check same directory
  for (const ext of extensions) {
    const testPath = join(dir, base + ext);
    if (existsSync(testPath)) {
      return testPath;
    }
  }
  
  // Check __tests__ directory
  for (const ext of extensions) {
    const testPath = join(dir, '__tests__', base + ext);
    if (existsSync(testPath)) {
      return testPath;
    }
  }
  
  // Check tests/ directory at root
  for (const ext of extensions) {
    const testPath = join('tests', base + ext);
    if (existsSync(testPath)) {
      return testPath;
    }
  }
  
  return null;
}

function dirname(filePath: string): string {
  const parts = filePath.split('/');
  parts.pop();
  return parts.join('/') || '.';
}

function basename(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

program.parse();
