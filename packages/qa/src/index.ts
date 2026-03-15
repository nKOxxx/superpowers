import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

export interface QAOptions {
  mode?: 'targeted' | 'smoke' | 'full';
  framework?: 'vitest' | 'jest' | 'mocha' | 'auto';
  coverage?: boolean;
  watch?: boolean;
  files?: string[];
  changed?: boolean;
  failFast?: boolean;
}

export interface TestFramework {
  name: string;
  configFiles: string[];
  testPatterns: string[];
  runCommand: string;
  coverageFlag: string;
  watchFlag: string;
}

export interface QAResult {
  framework: string;
  mode: string;
  command: string;
  exitCode: number;
  output: string;
  error?: string;
  summary?: {
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}

const FRAMEWORKS: Record<string, TestFramework> = {
  vitest: {
    name: 'vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts', 'vite.config.js'],
    testPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    runCommand: 'npx vitest run',
    coverageFlag: '--coverage',
    watchFlag: '--watch'
  },
  jest: {
    name: 'jest',
    configFiles: ['jest.config.ts', 'jest.config.js', 'jest.config.json'],
    testPatterns: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    runCommand: 'npx jest',
    coverageFlag: '--coverage',
    watchFlag: '--watch'
  },
  mocha: {
    name: 'mocha',
    configFiles: ['.mocharc.js', '.mocharc.json', '.mocharc.yaml', 'mocha.opts'],
    testPatterns: ['**/*.test.ts', '**/*.test.js', 'test/**/*.ts'],
    runCommand: 'npx mocha',
    coverageFlag: '',
    watchFlag: '--watch'
  }
};

function detectFramework(projectPath: string = '.'): string | null {
  // Check for config files
  for (const [name, framework] of Object.entries(FRAMEWORKS)) {
    for (const configFile of framework.configFiles) {
      if (existsSync(join(projectPath, configFile))) {
        return name;
      }
    }
  }

  // Check package.json for dependencies
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.vitest) return 'vitest';
    if (deps.jest) return 'jest';
    if (deps.mocha) return 'mocha';
  }

  // Check for test files
  for (const [name, framework] of Object.entries(FRAMEWORKS)) {
    for (const pattern of framework.testPatterns) {
      if (globExists(projectPath, pattern)) {
        return name;
      }
    }
  }

  return null;
}

function globExists(projectPath: string, pattern: string): boolean {
  const parts = pattern.split('/');
  const filePattern = parts.pop()!;
  const dir = parts.length > 0 ? join(projectPath, ...parts) : projectPath;
  
  if (!existsSync(dir)) return false;
  
  try {
    const files = readdirSync(dir, { recursive: true });
    const regex = new RegExp(filePattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return files.some(f => regex.test(f.toString()));
  } catch {
    return false;
  }
}

function findChangedFiles(projectPath: string = '.'): string[] {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', {
      cwd: projectPath,
      encoding: 'utf-8'
    });
    return output.trim().split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  } catch {
    return [];
  }
}

function findRelatedTests(changedFiles: string[], projectPath: string = '.'): string[] {
  const testFiles: string[] = [];
  
  for (const file of changedFiles) {
    const dir = join(projectPath, file.split('/').slice(0, -1).join('/'));
    const baseName = file.split('/').pop()?.replace(/\.(ts|js)$/, '');
    
    if (!baseName) continue;
    
    // Look for corresponding test files
    const possibleTests = [
      `${baseName}.test.ts`,
      `${baseName}.test.js`,
      `${baseName}.spec.ts`,
      `${baseName}.spec.js`
    ];
    
    for (const testFile of possibleTests) {
      const testPath = join(dir, testFile);
      if (existsSync(testPath)) {
        testFiles.push(testPath);
      }
    }
    
    // Check __tests__ directory
    const testDir = join(dir, '__tests__');
    if (existsSync(testDir)) {
      const tests = readdirSync(testDir)
        .filter(f => f.includes(baseName) && (f.endsWith('.test.ts') || f.endsWith('.test.js')))
        .map(f => join(testDir, f));
      testFiles.push(...tests);
    }
  }
  
  return [...new Set(testFiles)];
}

function buildCommand(framework: TestFramework, options: QAOptions): string {
  const parts = [framework.runCommand];
  
  // Mode-based configuration
  switch (options.mode) {
    case 'smoke':
      parts.push('--testNamePattern="smoke|basic"');
      break;
    case 'full':
      // Run all tests
      break;
    case 'targeted':
    default:
      // Targeted is default - runs based on changed files or specific files
      break;
  }
  
  // Coverage
  if (options.coverage && framework.coverageFlag) {
    parts.push(framework.coverageFlag);
  }
  
  // Watch mode
  if (options.watch && framework.watchFlag) {
    parts.push(framework.watchFlag);
  }
  
  // Fail fast
  if (options.failFast) {
    if (framework.name === 'vitest') parts.push('--bail=1');
    if (framework.name === 'jest') parts.push('--bail');
    if (framework.name === 'mocha') parts.push('--bail');
  }
  
  // Specific files
  if (options.files && options.files.length > 0) {
    parts.push(...options.files);
  } else if (options.changed) {
    const changedFiles = findChangedFiles();
    const relatedTests = findRelatedTests(changedFiles);
    if (relatedTests.length > 0) {
      parts.push(...relatedTests);
    }
  }
  
  return parts.join(' ');
}

function parseTestOutput(output: string, framework: string): QAResult['summary'] {
  const summary: QAResult['summary'] = { passed: 0, failed: 0, skipped: 0, duration: 0 };
  
  if (framework === 'vitest') {
    // Vitest output parsing
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);
    const durationMatch = output.match(/Duration\s+([\d.]+)(\w+)/);
    
    if (passedMatch) summary.passed = parseInt(passedMatch[1], 10);
    if (failedMatch) summary.failed = parseInt(failedMatch[1], 10);
    if (skippedMatch) summary.skipped = parseInt(skippedMatch[1], 10);
    if (durationMatch) {
      const value = parseFloat(durationMatch[1]);
      const unit = durationMatch[2];
      summary.duration = unit === 's' ? value * 1000 : value;
    }
  } else if (framework === 'jest') {
    // Jest output parsing
    const testsMatch = output.match(/Tests:\s+(\d+) passed(?:,\s+(\d+) failed)?(?:,\s+(\d+) skipped)?/);
    const timeMatch = output.match(/Time:\s+([\d.]+)s/);
    
    if (testsMatch) {
      summary.passed = parseInt(testsMatch[1], 10);
      summary.failed = parseInt(testsMatch[2] || '0', 10);
      summary.skipped = parseInt(testsMatch[3] || '0', 10);
    }
    if (timeMatch) summary.duration = parseFloat(timeMatch[1]) * 1000;
  }
  
  return summary;
}

export async function qa(options: QAOptions = {}): Promise<QAResult> {
  const projectPath = resolve('.');
  
  // Auto-detect framework if not specified
  const frameworkName = options.framework === 'auto' || !options.framework
    ? detectFramework(projectPath)
    : options.framework;
  
  if (!frameworkName) {
    return {
      framework: 'unknown',
      mode: options.mode || 'targeted',
      command: '',
      exitCode: 1,
      output: '',
      error: 'No test framework detected. Please specify --framework or ensure test framework is installed.'
    };
  }
  
  const framework = FRAMEWORKS[frameworkName];
  if (!framework) {
    return {
      framework: frameworkName,
      mode: options.mode || 'targeted',
      command: '',
      exitCode: 1,
      output: '',
      error: `Unsupported framework: ${frameworkName}`
    };
  }
  
  const command = buildCommand(framework, options);
  
  try {
    const output = execSync(command, {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      framework: frameworkName,
      mode: options.mode || 'targeted',
      command,
      exitCode: 0,
      output,
      summary: parseTestOutput(output, frameworkName)
    };
  } catch (error: any) {
    const output = error.stdout || error.message || '';
    return {
      framework: frameworkName,
      mode: options.mode || 'targeted',
      command,
      exitCode: error.status || 1,
      output,
      error: error.message,
      summary: parseTestOutput(output, frameworkName)
    };
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options: QAOptions = {
    mode: 'targeted',
    files: []
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--mode':
      case '-m':
        options.mode = args[++i] as 'targeted' | 'smoke' | 'full';
        break;
      case '--framework':
      case '-f':
        options.framework = args[++i] as 'vitest' | 'jest' | 'mocha' | 'auto';
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--changed':
        options.changed = true;
        break;
      case '--fail-fast':
        options.failFast = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          options.files = options.files || [];
          options.files.push(arg);
        }
    }
  }
  
  qa(options)
    .then(result => {
      console.log(result.output);
      if (result.summary) {
        console.log('\n📊 Summary:');
        console.log(`  Framework: ${result.framework}`);
        console.log(`  Mode: ${result.mode}`);
        console.log(`  Passed: ${result.summary.passed}`);
        console.log(`  Failed: ${result.summary.failed}`);
        console.log(`  Skipped: ${result.summary.skipped}`);
        console.log(`  Duration: ${result.summary.duration}ms`);
      }
      process.exit(result.exitCode);
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
