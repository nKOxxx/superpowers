import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export interface QAOptions {
  mode?: string;
  coverage?: boolean;
  watch?: boolean;
}

type TestFramework = 'vitest' | 'jest' | 'mocha' | 'unknown';

interface FrameworkConfig {
  name: string;
  command: string;
  coverageFlag: string;
  watchFlag: string;
  configFiles: string[];
}

const frameworks: Record<TestFramework, FrameworkConfig> = {
  vitest: {
    name: 'Vitest',
    command: 'npx vitest run',
    coverageFlag: '--coverage',
    watchFlag: '',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs']
  },
  jest: {
    name: 'Jest',
    command: 'npx jest',
    coverageFlag: '--coverage',
    watchFlag: '--watch',
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.json']
  },
  mocha: {
    name: 'Mocha',
    command: 'npx mocha',
    coverageFlag: '',
    watchFlag: '--watch',
    configFiles: ['.mocharc.js', '.mocharc.json', '.mocharc.yml']
  },
  unknown: {
    name: 'Unknown',
    command: 'npm test',
    coverageFlag: '',
    watchFlag: '',
    configFiles: []
  }
};

export async function qaCommand(options: QAOptions): Promise<void> {
  console.log(chalk.blue('🧪 QA Mode:'), chalk.cyan(options.mode || 'targeted'));
  
  const framework = detectFramework();
  console.log(chalk.gray(`Framework: ${frameworks[framework].name}`));
  
  const config = frameworks[framework];
  
  switch (options.mode) {
    case 'targeted':
      await runTargetedTests(config, options);
      break;
    case 'smoke':
      await runSmokeTests(config, options);
      break;
    case 'full':
      await runFullTests(config, options);
      break;
    default:
      console.error(chalk.red(`Unknown mode: ${options.mode}`));
      process.exit(1);
  }
}

function detectFramework(): TestFramework {
  const packageJsonPath = resolve('package.json');
  
  if (!existsSync(packageJsonPath)) {
    return 'unknown';
  }
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const devDeps = { ...packageJson.devDependencies, ...packageJson.dependencies };
  
  // Check config files first
  for (const [fw, config] of Object.entries(frameworks)) {
    if (fw === 'unknown') continue;
    for (const configFile of config.configFiles) {
      if (existsSync(configFile)) {
        return fw as TestFramework;
      }
    }
  }
  
  // Check package.json dependencies
  if (devDeps.vitest) return 'vitest';
  if (devDeps.jest) return 'jest';
  if (devDeps.mocha) return 'mocha';
  
  return 'unknown';
}

async function runTargetedTests(config: FrameworkConfig, options: QAOptions): Promise<void> {
  console.log(chalk.blue('🎯 Targeted Tests'));
  console.log(chalk.gray('Analyzing git diff for changed files...'));
  
  try {
    const changedFiles = getChangedFiles();
    console.log(chalk.gray(`Changed files: ${changedFiles.length}`));
    
    if (changedFiles.length === 0) {
      console.log(chalk.yellow('No changes detected. Running smoke tests...'));
      await runSmokeTests(config, options);
      return;
    }
    
    // Map source files to test files
    const testFiles = mapToTestFiles(changedFiles);
    console.log(chalk.gray(`Related test files: ${testFiles.length}`));
    
    if (testFiles.length === 0) {
      console.log(chalk.yellow('No test files found for changes. Running smoke tests...'));
      await runSmokeTests(config, options);
      return;
    }
    
    for (const file of changedFiles) {
      console.log(chalk.gray(`  📄 ${file}`));
    }
    
    for (const file of testFiles) {
      console.log(chalk.cyan(`  🧪 ${file}`));
    }
    
    // Run only the relevant tests
    const testPattern = testFiles.join(' ');
    await runTestCommand(config, testPattern, options);
    
  } catch (error) {
    console.error(chalk.red('Error in targeted tests:'), error);
    process.exit(1);
  }
}

async function runSmokeTests(config: FrameworkConfig, options: QAOptions): Promise<void> {
  console.log(chalk.blue('💨 Smoke Tests'));
  
  const testFiles = findTestFiles();
  const smokeTests = testFiles.filter(f => 
    f.includes('.smoke.') || 
    f.includes('.spec.') ||
    f.includes('.test.')
  ).slice(0, 5); // Limit to 5 smoke tests
  
  if (smokeTests.length === 0) {
    console.log(chalk.yellow('No smoke tests found. Running full test suite...'));
    await runFullTests(config, options);
    return;
  }
  
  const testPattern = smokeTests.join(' ');
  await runTestCommand(config, testPattern, options);
}

async function runFullTests(config: FrameworkConfig, options: QAOptions): Promise<void> {
  console.log(chalk.blue('🔥 Full Test Suite'));
  await runTestCommand(config, '', options);
}

async function runTestCommand(config: FrameworkConfig, testPattern: string, options: QAOptions): Promise<void> {
  let command = config.command;
  
  if (options.coverage && config.coverageFlag) {
    command += ` ${config.coverageFlag}`;
  }
  
  if (testPattern) {
    command += ` ${testPattern}`;
  }
  
  console.log(chalk.gray(`Running: ${command}`));
  console.log('');
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(chalk.green('✅ All tests passed'));
  } catch (error) {
    console.error(chalk.red('❌ Tests failed'));
    process.exit(1);
  }
}

function getChangedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only --diff-filter=ACM HEAD~1', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    // If no previous commit or not a git repo, return empty
    return [];
  }
}

function mapToTestFiles(sourceFiles: string[]): string[] {
  const testFiles: string[] = [];
  
  for (const file of sourceFiles) {
    // Skip test files themselves
    if (file.includes('.test.') || file.includes('.spec.')) {
      testFiles.push(file);
      continue;
    }
    
    // Map source file to potential test files
    const dir = file.substring(0, file.lastIndexOf('/') + 1);
    const basename = file.substring(file.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
    const ext = file.substring(file.lastIndexOf('.'));
    
    const potentialTests = [
      `${dir}${basename}.test${ext}`,
      `${dir}${basename}.spec${ext}`,
      `${dir}__tests__/${basename}.test${ext}`,
      `${dir}__tests__/${basename}.spec${ext}`,
      `tests/${dir}${basename}.test${ext}`,
      `test/${dir}${basename}.test${ext}`
    ];
    
    for (const testFile of potentialTests) {
      if (existsSync(testFile)) {
        testFiles.push(testFile);
      }
    }
  }
  
  return [...new Set(testFiles)]; // Remove duplicates
}

function findTestFiles(): string[] {
  try {
    const output = execSync('find . -type f -name "*.test.*" -o -name "*.spec.*" | head -20', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    return [];
  }
}
