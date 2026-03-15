import { execSync } from 'child_process';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../utils/config.js';
import { printHeader, printSuccess, printError, printInfo, printWarning } from '../utils/format.js';

export interface QAOptions {
  mode: string;
  diff: string;
  coverage: boolean;
  parallel: boolean;
}

interface TestFramework {
  name: string;
  configFiles: string[];
  testCommand: string;
  coverageCommand?: string;
}

const TEST_FRAMEWORKS: TestFramework[] = [
  {
    name: 'vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
    testCommand: 'npx vitest run',
    coverageCommand: 'npx vitest run --coverage'
  },
  {
    name: 'jest',
    configFiles: ['jest.config.js', 'jest.config.ts', 'package.json'],
    testCommand: 'npm test',
    coverageCommand: 'npm run test:coverage'
  },
  {
    name: 'mocha',
    configFiles: ['.mocharc.js', '.mocharc.json', 'package.json'],
    testCommand: 'npx mocha',
  }
];

function detectTestFramework(): TestFramework | null {
  for (const framework of TEST_FRAMEWORKS) {
    for (const configFile of framework.configFiles) {
      if (existsSync(configFile)) {
        if (configFile === 'package.json') {
          try {
            const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf-8'));
            if (pkg.devDependencies?.[framework.name] || pkg.dependencies?.[framework.name]) {
              return framework;
            }
          } catch {
            continue;
          }
        } else {
          return framework;
        }
      }
    }
  }
  return null;
}

function getChangedFiles(diffRange: string): string[] {
  try {
    const output = execSync(`git diff --name-only ${diffRange}`, { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

function mapToTestFiles(changedFiles: string[]): string[] {
  const testFiles = new Set<string>();
  
  for (const file of changedFiles) {
    // Skip non-source files (dist, node_modules, archives, etc.)
    if (file.includes('/dist/') || 
        file.startsWith('dist/') || 
        file.startsWith('dist-skills/') || 
        file.startsWith('node_modules/') || 
        file.startsWith('.git/') ||
        file.endsWith('.tar.gz') ||
        file.endsWith('.zip')) {
      continue;
    }
    
    // Skip test files themselves (check file name, not full path)
    const fileName = file.split('/').pop() || '';
    if (fileName.includes('.test.') || fileName.includes('.spec.')) {
      testFiles.add(file);
      continue;
    }
    
    // Only process actual source files (.ts, .tsx, .js, .jsx)
    if (!file.match(/\.(ts|tsx|js|jsx)$/)) {
      continue;
    }
    
    // Map source files to test files
    const patterns = [
      file.replace(/^src\//, 'tests/').replace(/\.ts$/, '.test.ts'),
      file.replace(/^src\//, 'tests/').replace(/\.tsx$/, '.test.tsx'),
      file.replace(/^src\//, 'test/').replace(/\.ts$/, '.test.ts'),
      file.replace(/\.ts$/, '.test.ts'),
      file.replace(/\.tsx$/, '.test.tsx'),
      file.replace(/\.js$/, '.test.js'),
    ].filter(p => p !== file); // Filter out patterns that are the same as the original file
    
    for (const pattern of patterns) {
      if (existsSync(pattern)) {
        testFiles.add(pattern);
      }
    }
    
    // Add component tests for React components
    if (file.includes('components/') && file.endsWith('.tsx')) {
      const componentName = file.split('/').pop()?.replace('.tsx', '');
      if (componentName) {
        const componentTests = [
          `tests/components/${componentName}.test.tsx`,
          `src/components/${componentName}.test.tsx`,
        ];
        for (const testPath of componentTests) {
          if (existsSync(testPath)) {
            testFiles.add(testPath);
          }
        }
      }
    }
  }
  
  return Array.from(testFiles);
}

function runTests(command: string, coverage: boolean): { success: boolean; output: string } {
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function qaCommand(options: QAOptions): Promise<void> {
  printHeader(`QA Mode: ${options.mode.toUpperCase()}`);
  
  const config = loadConfig();
  const spinner = ora('Detecting test framework...').start();
  
  try {
    // Detect test framework
    const framework = detectTestFramework();
    
    if (!framework) {
      spinner.stop();
      printError('No test framework detected. Supported: vitest, jest, mocha');
      process.exit(1);
    }
    
    spinner.text = `Framework detected: ${framework.name}`;
    
    let testCommand = framework.testCommand;
    let testFiles: string[] = [];
    
    // Determine test mode
    switch (options.mode) {
      case 'targeted': {
        spinner.text = 'Analyzing git diff...';
        const changedFiles = getChangedFiles(options.diff);
        
        if (changedFiles.length === 0) {
          spinner.stop();
          printWarning('No changed files detected. Running smoke tests.');
          testCommand += framework.name === 'vitest' ? ' -t="smoke"' : ' --grep="smoke|basic|critical"';
        } else {
          testFiles = mapToTestFiles(changedFiles);
          
          if (testFiles.length === 0) {
            spinner.stop();
            printWarning('No test files mapped from changes. Running smoke tests.');
            testCommand += framework.name === 'vitest' ? ' -t="smoke"' : ' --grep="smoke|basic|critical"';
          } else {
            spinner.stop();
            printInfo(`Files changed: ${changedFiles.length}`);
            changedFiles.slice(0, 5).forEach(f => console.log(`  - ${f}`));
            if (changedFiles.length > 5) {
              console.log(`  ... and ${changedFiles.length - 5} more`);
            }
            
            printInfo(`Tests selected: ${testFiles.length}`);
            testFiles.forEach(f => console.log(`  - ${f}`));
            
            if (framework.name === 'vitest') {
              testCommand += ` ${testFiles.join(' ')}`;
            } else if (framework.name === 'jest') {
              testCommand += ` ${testFiles.join(' ')}`;
            }
          }
        }
        break;
      }
      
      case 'smoke': {
        spinner.text = 'Running smoke tests...';
        testCommand += framework.name === 'vitest' ? ' -t="smoke"' : ' --grep="smoke|basic|critical"';
        break;
      }
      
      case 'full': {
        spinner.text = 'Running full test suite...';
        break;
      }
      
      default: {
        spinner.stop();
        printError(`Unknown mode: ${options.mode}`);
        process.exit(1);
      }
    }
    
    // Add coverage if requested
    if (options.coverage && framework.coverageCommand) {
      testCommand = framework.coverageCommand;
      if (testFiles.length > 0 && options.mode === 'targeted') {
        testCommand += ` ${testFiles.join(' ')}`;
      }
    }
    
    spinner.text = `Running: ${testCommand}`;
    
    const result = runTests(testCommand, options.coverage);
    
    spinner.stop();
    
    console.log();
    console.log(result.output);
    
    if (result.success) {
      printSuccess('All tests passed');
    } else {
      printError('Tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    spinner.stop();
    printError(`QA failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}