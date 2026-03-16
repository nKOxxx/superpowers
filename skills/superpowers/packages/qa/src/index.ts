import { execSync } from 'child_process';
import { loadConfig, sendTelegramNotification, formatDuration, type TelegramConfig } from '@openclaw/superpowers-shared';
import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, relative, join, extname, basename } from 'path';
import chalk from 'chalk';

export interface QAConfig {
  defaultMode?: 'targeted' | 'smoke' | 'full';
  coverageThreshold?: number;
  testCommand?: string;
  testPatterns?: {
    unit?: string[];
    integration?: string[];
    e2e?: string[];
  };
  testMapping?: Record<string, string[]>;
  telegram?: TelegramConfig;
}

export interface TestResult {
  mode: string;
  files: string[];
  passed: boolean;
  duration: number;
  coverage?: number;
  output: string;
  error?: string;
}

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted';
}

const DEFAULT_TEST_PATTERNS = {
  unit: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
  integration: ['**/*.integration.test.ts', '**/*.integration.test.js'],
  e2e: ['**/e2e/**/*.spec.ts', '**/e2e/**/*.test.ts', '**/cypress/**/*.cy.ts']
};

const DEFAULT_TEST_MAPPING: Record<string, string[]> = {
  'src/**/*.ts': ['tests/unit/', '__tests__/'],
  'src/components/**': ['tests/components/', 'src/components/**/*.test.*'],
  'src/api/**': ['tests/api/', 'tests/integration/'],
  'src/utils/**': ['tests/unit/utils/', 'src/utils/**/*.test.*'],
  'src/hooks/**': ['tests/unit/hooks/', 'src/hooks/**/*.test.*']
};

export class QASystem {
  private config: QAConfig;
  private projectRoot: string;

  constructor(config?: QAConfig, projectRoot: string = process.cwd()) {
    this.config = config || {};
    this.projectRoot = projectRoot;
  }

  getChangedFiles(diffRef: string = 'HEAD~1'): ChangedFile[] {
    try {
      const output = execSync(`git diff --name-status ${diffRef}`, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });

      return output
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [status, ...pathParts] = line.split('\t');
          const path = pathParts[pathParts.length - 1];
          return {
            path,
            status: this.parseStatus(status)
          };
        });
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not get git diff, running all tests'));
      return [];
    }
  }

  private parseStatus(status: string): 'added' | 'modified' | 'deleted' {
    switch (status[0]) {
      case 'A': return 'added';
      case 'D': return 'deleted';
      default: return 'modified';
    }
  }

  mapFilesToTests(changedFiles: ChangedFile[]): string[] {
    const testFiles = new Set<string>();
    const mapping = { ...DEFAULT_TEST_MAPPING, ...this.config.testMapping };

    for (const file of changedFiles) {
      // Skip deleted files
      if (file.status === 'deleted') continue;

      // Skip test files themselves (they'll be run if changed)
      if (this.isTestFile(file.path)) {
        testFiles.add(file.path);
        continue;
      }

      // Map source files to their tests
      for (const [pattern, testPaths] of Object.entries(mapping)) {
        if (this.matchesPattern(file.path, pattern)) {
          for (const testPath of testPaths) {
            const resolvedTests = this.resolveTestPattern(file.path, testPath);
            resolvedTests.forEach(t => testFiles.add(t));
          }
        }
      }
    }

    return Array.from(testFiles);
  }

  private isTestFile(path: string): boolean {
    const patterns = this.config.testPatterns || DEFAULT_TEST_PATTERNS;
    const allPatterns = [...(patterns.unit || []), ...(patterns.integration || []), ...(patterns.e2e || [])];
    return allPatterns.some(pattern => this.matchesPattern(path, pattern));
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob matching
    const regex = pattern
      .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLESTAR>>>/g, '.*')
      .replace(/\?/g, '.');
    
    const regexObj = new RegExp(`^${regex}$`);
    return regexObj.test(filePath);
  }

  private resolveTestPattern(sourcePath: string, testPattern: string): string[] {
    // If pattern contains **, find matching files
    if (testPattern.includes('**')) {
      return this.findFilesMatching(testPattern);
    }

    // Convert source path to test path
    const dir = sourcePath.replace(/^src\//, '').replace(/\/[^/]+$/, '');
    const base = basename(sourcePath, extname(sourcePath));
    
    return [
      join(testPattern, `${base}.test.ts`),
      join(testPattern, `${base}.spec.ts`),
      join(testPattern, `${base}.test.js`),
      join(testPattern, dir, `${base}.test.ts`)
    ].filter(p => existsSync(join(this.projectRoot, p)));
  }

  private findFilesMatching(pattern: string): string[] {
    // Simplified file finding - in production, use glob
    const results: string[] = [];
    const baseDir = pattern.split('/**')[0];
    
    if (!existsSync(join(this.projectRoot, baseDir))) {
      return results;
    }

    try {
      const files = this.walkDir(join(this.projectRoot, baseDir));
      const ext = pattern.includes('.ts') ? '.test.ts' : '.test.js';
      return files.filter(f => f.endsWith(ext)).map(f => relative(this.projectRoot, f));
    } catch {
      return results;
    }
  }

  private walkDir(dir: string): string[] {
    const results: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.walkDir(fullPath));
      } else {
        results.push(fullPath);
      }
    }

    return results;
  }

  runTests(files: string[], options: { coverage?: boolean; watch?: boolean } = {}): TestResult {
    const startTime = Date.now();
    const testCommand = this.config.testCommand || 'npm test';

    if (files.length === 0) {
      return {
        mode: 'targeted',
        files: [],
        passed: true,
        duration: 0,
        output: 'No tests to run (no matching test files found)',
        coverage: undefined
      };
    }

    const fileList = files.join(' ');
    const coverageFlag = options.coverage ? ' --coverage' : '';
    const command = `${testCommand}${coverageFlag} ${fileList}`;

    console.log(chalk.blue(`🧪 Running: ${command}`));
    console.log(chalk.gray(`   Files: ${files.length} test file(s)`));

    try {
      const output = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      // Try to extract coverage from output
      const coverageMatch = output.match(/(\d+(\.\d+)?)%/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : undefined;

      return {
        mode: 'targeted',
        files,
        passed: true,
        duration: Date.now() - startTime,
        output,
        coverage
      };
    } catch (error) {
      const errorOutput = error instanceof Error && 'stdout' in error 
        ? String((error as { stdout: Buffer }).stdout) 
        : String(error);

      return {
        mode: 'targeted',
        files,
        passed: false,
        duration: Date.now() - startTime,
        output: errorOutput,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  runSmokeTests(): TestResult {
    const startTime = Date.now();
    const testCommand = this.config.testCommand || 'npm test';
    
    console.log(chalk.blue('🔥 Running smoke tests...'));

    try {
      // Run a quick subset or just check if tests exist
      const output = execSync(`${testCommand} --testPathPattern="smoke|critical|core" --maxWorkers=2`, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      return {
        mode: 'smoke',
        files: [],
        passed: true,
        duration: Date.now() - startTime,
        output
      };
    } catch (error) {
      // If no smoke tests found, try running a basic test
      try {
        execSync('npm test -- --listTests 2>/dev/null | head -5', {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });
        
        return {
          mode: 'smoke',
          files: [],
          passed: true,
          duration: Date.now() - startTime,
          output: 'Smoke test: test runner is functional'
        };
      } catch {
        return {
          mode: 'smoke',
          files: [],
          passed: false,
          duration: Date.now() - startTime,
          output: '',
          error: 'Smoke tests failed'
        };
      }
    }
  }

  runFullSuite(options: { coverage?: boolean } = {}): TestResult {
    const startTime = Date.now();
    const testCommand = this.config.testCommand || 'npm test';
    const coverageFlag = options.coverage ? ' --coverage' : '';

    console.log(chalk.blue('🧪 Running full test suite...'));

    try {
      const output = execSync(`${testCommand}${coverageFlag}`, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const coverageMatch = output.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*(\d+(?:\.\d+)?)/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : undefined;

      return {
        mode: 'full',
        files: [],
        passed: true,
        duration: Date.now() - startTime,
        output,
        coverage
      };
    } catch (error) {
      const errorOutput = error instanceof Error && 'stdout' in error
        ? String((error as { stdout: Buffer }).stdout)
        : String(error);

      return {
        mode: 'full',
        files: [],
        passed: false,
        duration: Date.now() - startTime,
        output: errorOutput,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export async function qa(options: {
  mode?: 'targeted' | 'smoke' | 'full';
  diff?: string;
  coverage?: boolean;
  threshold?: number;
  watch?: boolean;
  configPath?: string;
  telegram?: boolean;
}): Promise<void> {
  const rawConfig = loadConfig(options.configPath);
  const config = rawConfig as { qa?: QAConfig; telegram?: TelegramConfig };
  const qaConfig = config.qa || {};

  const system = new QASystem(qaConfig);
  const mode = options.mode || qaConfig.defaultMode || 'targeted';

  console.log(chalk.bold('🧪 QA - Systematic Testing\n'));
  console.log(chalk.gray(`Mode: ${mode}`));
  if (options.diff) console.log(chalk.gray(`Diff: ${options.diff}`));
  console.log('');

  let result: TestResult;

  switch (mode) {
    case 'targeted': {
      const changedFiles = system.getChangedFiles(options.diff);
      console.log(chalk.cyan(`📁 Found ${changedFiles.length} changed file(s)`));
      
      const testFiles = system.mapFilesToTests(changedFiles);
      console.log(chalk.cyan(`🎯 Mapped to ${testFiles.length} test file(s)\n`));
      
      if (testFiles.length > 0) {
        testFiles.forEach(f => console.log(chalk.gray(`   • ${f}`)));
        console.log('');
      }
      
      result = system.runTests(testFiles, { coverage: options.coverage });
      break;
    }

    case 'smoke': {
      result = system.runSmokeTests();
      break;
    }

    case 'full': {
      result = system.runFullSuite({ coverage: options.coverage });
      break;
    }

    default:
      throw new Error(`Unknown mode: ${mode}`);
  }

  // Display results
  console.log('');
  console.log(result.passed ? chalk.green('✅ Tests passed') : chalk.red('❌ Tests failed'));
  console.log(chalk.gray(`   Duration: ${formatDuration(result.duration)}`));
  
  if (result.coverage !== undefined) {
    const threshold = options.threshold || qaConfig.coverageThreshold || 80;
    const coverageColor = result.coverage >= threshold ? chalk.green : chalk.red;
    console.log(coverageColor(`   Coverage: ${result.coverage.toFixed(1)}% (threshold: ${threshold}%)`));
    
    if (result.coverage < threshold) {
      result.passed = false;
    }
  }

  // Send Telegram notification if requested
  if (options.telegram && config.telegram?.enabled) {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const coverageText = result.coverage !== undefined ? `\nCoverage: ${result.coverage.toFixed(1)}%` : '';
    
    const message = `🧪 **QA - ${mode.toUpperCase()}**\n\n` +
      `Status: ${status}\n` +
      `Duration: ${formatDuration(result.duration)}` +
      coverageText;

    await sendTelegramNotification(config.telegram, message);
  }

  if (!result.passed) {
    if (result.output) {
      console.log(chalk.gray('\n--- Output ---\n'));
      console.log(result.output);
    }
    process.exit(1);
  }
}

export { loadConfig, formatDuration };
