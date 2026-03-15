import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

/**
 * QA command options
 */
export interface QAOptions {
  mode: string;
  coverage: boolean;
  watch: boolean;
  update: boolean;
  since: string;
}

/**
 * Test framework type
 */
type TestFramework = 'vitest' | 'jest' | 'mocha' | 'playwright' | null;

/**
 * Test framework configuration
 */
interface TestFrameworkConfig {
  name: string;
  configFiles: string[];
  testCommands: {
    targeted: string;
    smoke: string;
    full: string;
  };
  coverageFlag: string;
  watchFlag: string;
  updateFlag: string;
}

/**
 * Framework configurations
 */
const frameworks: Record<string, TestFrameworkConfig> = {
  vitest: {
    name: 'Vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts', 'vite.config.js'],
    testCommands: {
      targeted: 'npx vitest run --reporter=verbose',
      smoke: 'npx vitest run --reporter=verbose --testTimeout=30000',
      full: 'npx vitest run --reporter=verbose',
    },
    coverageFlag: '--coverage',
    watchFlag: '--watch',
    updateFlag: '--update',
  },
  jest: {
    name: 'Jest',
    configFiles: ['jest.config.ts', 'jest.config.js', 'jest.config.mjs'],
    testCommands: {
      targeted: 'npx jest --verbose',
      smoke: 'npx jest --verbose --testTimeout=30000 --maxWorkers=2',
      full: 'npx jest --verbose --coverage',
    },
    coverageFlag: '--coverage',
    watchFlag: '--watch',
    updateFlag: '--updateSnapshot',
  },
  mocha: {
    name: 'Mocha',
    configFiles: ['.mocharc.json', '.mocharc.js', 'mocha.opts'],
    testCommands: {
      targeted: 'npx mocha --reporter spec',
      smoke: 'npx mocha --reporter spec --timeout 30000',
      full: 'npx mocha --reporter spec --recursive',
    },
    coverageFlag: '',
    watchFlag: '',
    updateFlag: '',
  },
  playwright: {
    name: 'Playwright',
    configFiles: ['playwright.config.ts', 'playwright.config.js'],
    testCommands: {
      targeted: 'npx playwright test',
      smoke: 'npx playwright test --grep @smoke',
      full: 'npx playwright test',
    },
    coverageFlag: '',
    watchFlag: '',
    updateFlag: '',
  },
};

/**
 * Main QA command
 */
export async function qaCommand(options: QAOptions): Promise<void> {
  console.log(chalk.blue('🧪 QA Lead - Starting test run...'));
  console.log(chalk.gray(`Mode: ${options.mode} | Coverage: ${options.coverage ? 'yes' : 'no'} | Watch: ${options.watch ? 'yes' : 'no'}`));
  
  try {
    // Detect test framework
    const framework = detectTestFramework();
    
    if (!framework) {
      console.log(chalk.yellow('⚠️ No test framework detected'));
      console.log(chalk.gray('Looking for: Vitest, Jest, Mocha, or Playwright config files'));
      console.log(chalk.gray('Run tests manually or install a test framework'));
      process.exit(1);
    }
    
    console.log(chalk.green(`✅ Detected: ${frameworks[framework].name}`));
    
    // Get test command based on mode
    let testCommand = frameworks[framework].testCommands[options.mode as keyof typeof frameworks.vitest.testCommands];
    
    if (!testCommand) {
      console.log(chalk.yellow(`⚠️ Unknown mode: ${options.mode}, using full`));
      testCommand = frameworks[framework].testCommands.full;
    }
    
    // Add options
    if (options.coverage && frameworks[framework].coverageFlag && !testCommand.includes('--coverage')) {
      testCommand += ` ${frameworks[framework].coverageFlag}`;
    }
    
    if (options.watch && frameworks[framework].watchFlag) {
      testCommand = testCommand.replace('run ', '').replace('--reporter=verbose', '--reporter=verbose');
      testCommand += ` ${frameworks[framework].watchFlag}`;
    }
    
    if (options.update && frameworks[framework].updateFlag) {
      testCommand += ` ${frameworks[framework].updateFlag}`;
    }
    
    // For targeted mode, get changed files and map to tests
    if (options.mode === 'targeted') {
      const changedFiles = getChangedFiles(options.since);
      if (changedFiles.length > 0) {
        console.log(chalk.blue(`\n📁 Changed files (${changedFiles.length}):`));
        changedFiles.slice(0, 10).forEach(f => console.log(chalk.gray(`  - ${f}`)));
        if (changedFiles.length > 10) {
          console.log(chalk.gray(`  ... and ${changedFiles.length - 10} more`));
        }
        
        const testFiles = mapToTestFiles(changedFiles, framework);
        if (testFiles.length > 0) {
          console.log(chalk.blue(`\n🧪 Related test files (${testFiles.length}):`));
          testFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
          
          // Add specific test files to command
          if (framework === 'playwright') {
            testCommand += ` ${testFiles.join(' ')}`;
          } else {
            testCommand += ` ${testFiles.join(' ')}`;
          }
        } else {
          console.log(chalk.yellow('\n⚠️ No test files mapped to changed files'));
          console.log(chalk.gray('Running smoke tests instead...'));
          testCommand = frameworks[framework].testCommands.smoke;
        }
      } else {
        console.log(chalk.yellow('\n⚠️ No changed files detected, running smoke tests'));
        testCommand = frameworks[framework].testCommands.smoke;
      }
    }
    
    // Run tests
    console.log(chalk.blue('\n▶️ Running tests...\n'));
    console.log(chalk.gray(`Command: ${testCommand}\n`));
    
    execSync(testCommand, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    
    console.log(chalk.green('\n✅ All tests passed!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Tests failed'));
    process.exit(1);
  }
}

/**
 * Detect test framework from project files
 */
function detectTestFramework(): TestFramework {
  // Check for config files
  for (const [name, config] of Object.entries(frameworks)) {
    for (const configFile of config.configFiles) {
      if (existsSync(resolve(process.cwd(), configFile))) {
        return name as TestFramework;
      }
    }
  }
  
  // Check package.json for test scripts
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const testScript = packageJson.scripts?.test || '';
    
    if (testScript.includes('vitest')) return 'vitest';
    if (testScript.includes('jest')) return 'jest';
    if (testScript.includes('mocha')) return 'mocha';
    if (testScript.includes('playwright')) return 'playwright';
  }
  
  return null;
}

/**
 * Get list of changed files since git ref
 */
function getChangedFiles(since: string): string[] {
  try {
    const output = execSync(`git diff --name-only ${since}`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    // If git command fails, return empty array
    return [];
  }
}

/**
 * Map source files to their corresponding test files
 */
function mapToTestFiles(changedFiles: string[], framework: string): string[] {
  const testFiles: string[] = [];
  const extensions = framework === 'mocha' 
    ? ['.test.js', '.spec.js'] 
    : ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
  const sourceExtensions = ['.ts', '.js', '.tsx', '.jsx'];
  
  for (const file of changedFiles) {
    // Skip non-source files (dist, node_modules, archives, etc.)
    if (file.startsWith('dist/') || 
        file.startsWith('dist-skills/') || 
        file.startsWith('node_modules/') || 
        file.startsWith('.git/') ||
        file.endsWith('.tar.gz') ||
        file.endsWith('.zip')) {
      continue;
    }
    
    // Skip test files themselves - they'll be run anyway
    if (extensions.some(ext => file.endsWith(ext))) {
      testFiles.push(file);
      continue;
    }
    
    // Only map actual source files
    const isSourceFile = sourceExtensions.some(ext => file.endsWith(ext));
    if (!isSourceFile) {
      continue;
    }
    
    // Map source file to test file
    const dir = file.substring(0, file.lastIndexOf('/') + 1) || '';
    const baseName = file.substring(file.lastIndexOf('/') + 1).replace(/\.(ts|js|tsx|jsx)$/, '');
    
    for (const ext of extensions) {
      const testFile = `${dir}${baseName}${ext}`;
      if (existsSync(resolve(process.cwd(), testFile))) {
        testFiles.push(testFile);
        break;
      }
      
      // Check __tests__ directory
      const testDirFile = `${dir}__tests__/${baseName}${ext}`;
      if (existsSync(resolve(process.cwd(), testDirFile))) {
        testFiles.push(testDirFile);
        break;
      }
      
      // Check tests/ directory
      const testsDirFile = `tests/${testFile}`;
      if (existsSync(resolve(process.cwd(), testsDirFile))) {
        testFiles.push(testsDirFile);
        break;
      }
    }
  }
  
  return [...new Set(testFiles)]; // Remove duplicates
}

/**
 * Get test coverage report
 */
export function getCoverageReport(): { lines: number; functions: number; branches: number } {
  try {
    const coveragePath = resolve(process.cwd(), 'coverage/coverage-summary.json');
    if (existsSync(coveragePath)) {
      const coverage = JSON.parse(readFileSync(coveragePath, 'utf-8'));
      return {
        lines: coverage.total.lines.pct,
        functions: coverage.total.functions.pct,
        branches: coverage.total.branches.pct,
      };
    }
  } catch {
    // Ignore errors
  }
  
  return { lines: 0, functions: 0, branches: 0 };
}
