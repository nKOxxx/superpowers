import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

export interface QaOptions {
  mode?: 'targeted' | 'smoke' | 'full';
  coverage?: boolean;
  watch?: boolean;
  framework?: 'auto' | 'vitest' | 'jest' | 'mocha';
}

interface TestFramework {
  name: string;
  configFiles: string[];
  testCommands: {
    run: string[];
    watch: string[];
    coverage: string[];
  };
}

const FRAMEWORKS: Record<string, TestFramework> = {
  vitest: {
    name: 'Vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
    testCommands: {
      run: ['npx', 'vitest', 'run'],
      watch: ['npx', 'vitest'],
      coverage: ['npx', 'vitest', 'run', '--coverage']
    }
  },
  jest: {
    name: 'Jest',
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.mjs'],
    testCommands: {
      run: ['npx', 'jest'],
      watch: ['npx', 'jest', '--watch'],
      coverage: ['npx', 'jest', '--coverage']
    }
  },
  mocha: {
    name: 'Mocha',
    configFiles: ['.mocharc.js', '.mocharc.json', '.mocharc.yaml'],
    testCommands: {
      run: ['npx', 'mocha'],
      watch: ['npx', 'mocha', '--watch'],
      coverage: ['npx', 'c8', 'npx', 'mocha']
    }
  }
};

export function detectFramework(preferred?: string): TestFramework | null {
  if (preferred && preferred !== 'auto') {
    return FRAMEWORKS[preferred] || null;
  }

  for (const framework of Object.values(FRAMEWORKS)) {
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
    
    if (testScript.includes('vitest')) return FRAMEWORKS.vitest;
    if (testScript.includes('jest')) return FRAMEWORKS.jest;
    if (testScript.includes('mocha')) return FRAMEWORKS.mocha;
  }

  return null;
}

export function getGitDiff(): { files: string[]; added: string[]; deleted: string[]; modified: string[] } {
  try {
    const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
    const files = output.trim().split('\n').filter(Boolean);
    return {
      files,
      added: [],
      deleted: [],
      modified: files
    };
  } catch {
    return { files: [], added: [], deleted: [], modified: [] };
  }
}

function mapSourceToTest(sourceFile: string): string | null {
  // Common patterns
  const patterns = [
    { source: /^src\/(.*)\.ts$/, test: 'test/$1.test.ts' },
    { source: /^src\/(.*)\.ts$/, test: 'tests/$1.test.ts' },
    { source: /^src\/(.*)\.ts$/, test: 'src/$1.test.ts' },
    { source: /^lib\/(.*)\.js$/, test: 'test/$1.test.js' },
    { source: /^(.*)\.ts$/, test: '$1.test.ts' }
  ];

  for (const pattern of patterns) {
    const match = sourceFile.match(pattern.source);
    if (match) {
      let testPath = pattern.test;
      for (let i = 1; i < match.length; i++) {
        testPath = testPath.replace(`$${i}`, match[i]);
      }
      if (existsSync(testPath)) {
        return testPath;
      }
    }
  }

  return null;
}

export function findRelatedTests(changedFiles: string[]): Array<{ path: string; confidence: string }> {
  const testFiles = new Set<string>();

  for (const file of changedFiles) {
    // If it's already a test file, add it
    if (file.includes('.test.') || file.includes('.spec.')) {
      testFiles.add(file);
      continue;
    }

    // Try to map source to test
    const testFile = mapSourceToTest(file);
    if (testFile) {
      testFiles.add(testFile);
    }

    // Also check for tests in same directory
    const dir = file.substring(0, file.lastIndexOf('/')) || '.';
    const baseName = file.substring(file.lastIndexOf('/') + 1).replace(/\.(ts|js|tsx|jsx)$/, '');
    
    const possibleTests = [
      join(dir, `${baseName}.test.ts`),
      join(dir, `${baseName}.spec.ts`),
      join(dir, '__tests__', `${baseName}.test.ts`),
      join(dir, 'test', `${baseName}.test.ts`)
    ];

    for (const test of possibleTests) {
      if (existsSync(test)) {
        testFiles.add(test);
      }
    }
  }

  return Array.from(testFiles).map(f => ({ path: f, confidence: 'high' }));
}

function getChangedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function runTests(framework: TestFramework, files: string[], options: QaOptions): Promise<boolean> {
  const args: string[] = [];
  
  if (options.coverage) {
    args.push(...framework.testCommands.coverage.slice(1));
  } else if (options.watch) {
    args.push(...framework.testCommands.watch.slice(1));
  } else {
    args.push(...framework.testCommands.run.slice(1));
  }

  // Add specific test files for targeted mode
  if (files.length > 0 && options.mode === 'targeted') {
    if (framework.name === 'Vitest') {
      args.push(...files);
    } else if (framework.name === 'Jest') {
      args.push('--testPathPattern', files.join('|'));
    } else {
      args.push(...files);
    }
  }

  return new Promise((resolve) => {
    const child = spawn('npx', args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}

export async function runQa(options: QaOptions = {}): Promise<any> {
  const framework = detectFramework(options.framework);
  
  if (!framework) {
    return {
      success: false,
      error: 'No test framework detected. Install vitest, jest, or mocha.',
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      testsSkipped: 0,
      duration: 0,
      mode: options.mode || 'targeted',
      framework: 'unknown'
    };
  }

  const startTime = Date.now();
  let testFiles: string[] = [];

  if (options.mode === 'targeted') {
    const changedFiles = getChangedFiles();
    if (changedFiles.length === 0) {
      options.mode = 'smoke';
    } else {
      testFiles = findRelatedTests(changedFiles).map(t => t.path);
      
      if (testFiles.length === 0) {
        options.mode = 'smoke';
      }
    }
  }

  if (options.mode === 'smoke') {
    // Run a quick smoke test - first few tests or critical tests
    const allTests = await glob('**/*.{test,spec}.{ts,js}', { ignore: 'node_modules/**' });
    testFiles = allTests.slice(0, 5); // Limit to first 5 for smoke test
  }

  const success = await runTests(framework, testFiles, options);
  const duration = Date.now() - startTime;

  return {
    success,
    testsRun: 0,
    testsPassed: success ? 0 : 0,
    testsFailed: success ? 0 : 1,
    testsSkipped: 0,
    duration,
    mode: options.mode || 'targeted',
    framework: framework.name.toLowerCase()
  };
}

// Re-export for CLI
export { runQa as qa };

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] as QaOptions['mode'];
  const coverage = args.includes('--coverage');
  const watch = args.includes('--watch');
  const framework = args.find(a => a.startsWith('--framework='))?.split('=')[1] as QaOptions['framework'];
  
  runQa({ mode, coverage, watch, framework }).then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
