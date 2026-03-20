/**
 * QA Skill - Systematic Testing & Quality Analysis
 * 
 * Provides: smart test selection, coverage analysis, multi-framework support
 * Compatible with: Kimi K2.5, Node.js 18+, OpenClaw
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import { glob } from 'glob';

// Test Framework Definitions
export interface TestFramework {
  name: string;
  detectFiles: string[];
  detectPatterns: string[];
  runCommand: string;
  coverageCommand?: string;
  args?: Record<string, string>;
}

export const FRAMEWORKS: TestFramework[] = [
  {
    name: 'vitest',
    detectFiles: ['vitest.config.*', 'vite.config.*'],
    detectPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    runCommand: 'npx vitest run',
    coverageCommand: 'npx vitest run --coverage',
    args: { pattern: '', coverage: '--coverage', changed: '--changed' }
  },
  {
    name: 'jest',
    detectFiles: ['jest.config.*'],
    detectPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    runCommand: 'npx jest',
    coverageCommand: 'npx jest --coverage',
    args: { pattern: '', coverage: '--coverage', changed: '--changedSince=origin/main' }
  },
  {
    name: 'mocha',
    detectFiles: ['.mocharc.*', 'mocha.opts'],
    detectPatterns: ['test/**/*.js', 'test/**/*.ts'],
    runCommand: 'npx mocha',
    args: { pattern: '--grep', coverage: '' }
  },
  {
    name: 'cypress',
    detectFiles: ['cypress.config.*'],
    detectPatterns: ['cypress/e2e/**/*.cy.js', 'cypress/e2e/**/*.cy.ts'],
    runCommand: 'npx cypress run',
    args: { pattern: '--spec' }
  },
  {
    name: 'playwright',
    detectFiles: ['playwright.config.*'],
    detectPatterns: ['**/*.spec.ts', '**/*.test.ts'],
    runCommand: 'npx playwright test',
    args: { pattern: '', coverage: '' }
  },
  {
    name: 'pytest',
    detectFiles: ['pytest.ini', 'setup.py', 'pyproject.toml'],
    detectPatterns: ['test_*.py', '*_test.py'],
    runCommand: 'python -m pytest',
    coverageCommand: 'python -m pytest --cov',
    args: { pattern: '-k', coverage: '--cov', changed: '--changed' }
  },
  {
    name: 'go',
    detectFiles: ['go.mod'],
    detectPatterns: ['*_test.go'],
    runCommand: 'go test ./...',
    coverageCommand: 'go test -cover ./...',
    args: { pattern: '-run', coverage: '-cover' }
  },
  {
    name: 'cargo',
    detectFiles: ['Cargo.toml'],
    detectPatterns: [],
    runCommand: 'cargo test',
    args: { pattern: '', coverage: '' }
  }
];

// Options Interface
export interface QAOptions {
  coverage?: boolean;
  changed?: boolean;
  related?: boolean;
  pattern?: string;
  regression?: boolean;
  smoke?: boolean;
  e2e?: boolean;
  parallel?: number;
  format?: 'default' | 'github' | 'json';
  output?: string;
  threshold?: number;
  uncovered?: boolean;
  framework?: string;
  prioritized?: boolean;
  ci?: boolean;
}

export interface TestResult {
  framework: string;
  passed: boolean;
  exitCode: number;
  output: string;
  coverage?: CoverageResult;
  duration: number;
  testsRun: number;
  testsFailed: number;
  testsSkipped: number;
}

export interface CoverageResult {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
  uncovered: string[];
}

export interface QASummary {
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  overallCoverage?: CoverageResult;
  duration: number;
}

/**
 * Detect test framework used in the project
 */
export function detectFramework(projectPath: string = '.'): TestFramework | null {
  for (const framework of FRAMEWORKS) {
    // Check for config files
    for (const file of framework.detectFiles) {
      const matches = glob.sync(file, { cwd: projectPath });
      if (matches.length > 0) {
        return framework;
      }
    }

    // Check for test files
    for (const pattern of framework.detectPatterns) {
      const matches = glob.sync(pattern, { cwd: projectPath });
      if (matches.length > 0) {
        return framework;
      }
    }
  }

  return null;
}

/**
 * Get changed files from git
 */
export function getChangedFiles(baseBranch: string = 'main'): string[] {
  try {
    const output = execSync(`git diff --name-only ${baseBranch}...HEAD`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    try {
      // Try with origin/main
      const output = execSync('git diff --name-only origin/main...HEAD', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      return output.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }
}

/**
 * Find tests related to changed files
 */
export function findRelatedTests(
  changedFiles: string[],
  framework: TestFramework,
  projectPath: string = '.'
): string[] {
  const relatedTests: string[] = [];
  
  for (const pattern of framework.detectPatterns) {
    const testFiles = glob.sync(pattern, { cwd: projectPath });
    
    for (const testFile of testFiles) {
      // Check if test file imports or references changed files
      const content = fs.readFileSync(path.join(projectPath, testFile), 'utf8');
      
      for (const changedFile of changedFiles) {
        const baseName = path.basename(changedFile, path.extname(changedFile));
        if (content.includes(baseName) || content.includes(changedFile)) {
          relatedTests.push(testFile);
          break;
        }
      }
    }
  }

  return [...new Set(relatedTests)];
}

/**
 * Run tests for a specific framework
 */
export async function runTests(
  framework: TestFramework,
  options: QAOptions,
  projectPath: string = '.'
): Promise<TestResult> {
  const startTime = Date.now();
  
  let command = options.coverage && framework.coverageCommand 
    ? framework.coverageCommand 
    : framework.runCommand;

  const args: string[] = [];

  // Add pattern if specified
  if (options.pattern && framework.args?.pattern !== undefined) {
    if (framework.args.pattern) {
      args.push(framework.args.pattern, options.pattern);
    } else {
      args.push(options.pattern);
    }
  }

  // Add changed flag if specified
  if (options.changed && framework.args?.changed) {
    args.push(framework.args.changed);
  }

  // Handle parallel execution
  if (options.parallel && options.parallel > 1) {
    if (framework.name === 'jest') {
      args.push(`--maxWorkers=${options.parallel}`);
    } else if (framework.name === 'vitest') {
      args.push(`--pool=forks`, `--poolOptions.threads.singleThread`);
    }
  }

  // Format-specific options
  if (options.format === 'github') {
    if (framework.name === 'jest') {
      args.push('--reporters=github-actions');
    }
  }

  const fullCommand = `${command} ${args.join(' ')}`.trim();
  
  console.log(`\n🧪 Running ${framework.name}: ${fullCommand}`);

  return new Promise((resolve) => {
    const child = spawn(fullCommand, {
      cwd: projectPath,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      if (!options.ci) {
        process.stdout.write(chunk);
      }
    });

    child.stderr?.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      if (!options.ci) {
        process.stderr.write(chunk);
      }
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      // Parse test counts from output
      const { run, failed, skipped } = parseTestResults(output + errorOutput, framework);
      
      // Parse coverage if enabled
      let coverage: CoverageResult | undefined;
      if (options.coverage) {
        coverage = parseCoverage(output + errorOutput, framework);
      }

      resolve({
        framework: framework.name,
        passed: code === 0,
        exitCode: code || 0,
        output: output + errorOutput,
        coverage,
        duration,
        testsRun: run,
        testsFailed: failed,
        testsSkipped: skipped
      });
    });
  });
}

/**
 * Parse test results from output
 */
function parseTestResults(output: string, framework: TestFramework): { run: number; failed: number; skipped: number } {
  let run = 0, failed = 0, skipped = 0;

  switch (framework.name) {
    case 'jest':
      const jestMatch = output.match(/Tests:\s+(\d+) passed, (\d+) total/);
      if (jestMatch) {
        run = parseInt(jestMatch[2], 10);
        failed = output.includes('failed') ? 1 : 0;
      }
      break;
    
    case 'vitest':
      const vitestMatch = output.match(/(\d+)\s+passed\s+\((\d+)\s+total\)/);
      if (vitestMatch) {
        run = parseInt(vitestMatch[2], 10);
      }
      break;
    
    case 'pytest':
      const pytestMatch = output.match(/(\d+) passed.*?((\d+) failed)?.*?((\d+) skipped)?/);
      if (pytestMatch) {
        run = parseInt(pytestMatch[1], 10);
        failed = pytestMatch[3] ? parseInt(pytestMatch[3], 10) : 0;
        skipped = pytestMatch[5] ? parseInt(pytestMatch[5], 10) : 0;
      }
      break;
  }

  return { run, failed, skipped };
}

/**
 * Parse coverage from output
 */
function parseCoverage(output: string, framework: TestFramework): CoverageResult | undefined {
  // Try to parse coverage percentages
  const linesMatch = output.match(/Lines\s*:\s*([\d.]+)%/);
  const statementsMatch = output.match(/Statements\s*:\s*([\d.]+)%/);
  const functionsMatch = output.match(/Functions\s*:\s*([\d.]+)%/);
  const branchesMatch = output.match(/Branches\s*:\s*([\d.]+)%/);

  return {
    lines: linesMatch ? parseFloat(linesMatch[1]) : 0,
    statements: statementsMatch ? parseFloat(statementsMatch[1]) : 0,
    functions: functionsMatch ? parseFloat(functionsMatch[1]) : 0,
    branches: branchesMatch ? parseFloat(branchesMatch[1]) : 0,
    uncovered: []
  };
}

/**
 * Main QA function
 */
export async function qa(options: QAOptions = {}, projectPath: string = '.'): Promise<QASummary> {
  const startTime = Date.now();

  // Detect framework
  let framework: TestFramework | null = null;
  
  if (options.framework) {
    framework = FRAMEWORKS.find(f => f.name === options.framework) || null;
  } else {
    framework = detectFramework(projectPath);
  }

  if (!framework) {
    throw new Error('No test framework detected. Supported: jest, vitest, mocha, cypress, playwright, pytest, go, cargo');
  }

  console.log(`\n🔍 Detected framework: ${framework.name}`);

  // Handle smart test selection
  let testFiles: string[] = [];
  
  if (options.changed) {
    const changedFiles = getChangedFiles();
    console.log(`   Changed files: ${changedFiles.length}`);
    
    if (changedFiles.length > 0) {
      testFiles = findRelatedTests(changedFiles, framework, projectPath);
      console.log(`   Related tests: ${testFiles.length}`);
    }
  }

  // Run tests
  const results: TestResult[] = [];
  
  if (!options.changed || testFiles.length > 0) {
    // If we have specific test files from --changed, add them to pattern
    if (testFiles.length > 0 && !options.pattern) {
      // For some frameworks, we can pass multiple files
      options.pattern = testFiles.join(' ');
    }

    const result = await runTests(framework, options, projectPath);
    results.push(result);

    // Check threshold
    if (options.threshold && result.coverage) {
      const coverage = result.coverage.lines;
      if (coverage < options.threshold) {
        console.error(`\n❌ Coverage threshold not met: ${coverage.toFixed(1)}% < ${options.threshold}%`);
        process.exitCode = 1;
      }
    }
  } else {
    console.log('   No related tests found for changed files');
  }

  const duration = Date.now() - startTime;

  // Calculate summary
  const summary: QASummary = {
    results,
    totalTests: results.reduce((sum, r) => sum + r.testsRun, 0),
    passedTests: results.reduce((sum, r) => sum + (r.testsRun - r.testsFailed - r.testsSkipped), 0),
    failedTests: results.reduce((sum, r) => sum + r.testsFailed, 0),
    skippedTests: results.reduce((sum, r) => sum + r.testsSkipped, 0),
    overallCoverage: results[0]?.coverage,
    duration
  };

  // Output summary
  console.log('\n📊 Test Summary:');
  console.log(`   Framework: ${framework.name}`);
  console.log(`   Total: ${summary.totalTests}`);
  console.log(`   Passed: ${summary.passedTests} ✅`);
  console.log(`   Failed: ${summary.failedTests} ❌`);
  console.log(`   Skipped: ${summary.skippedTests} ⏭️`);
  console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
  
  if (summary.overallCoverage) {
    console.log(`   Coverage: ${summary.overallCoverage.lines.toFixed(1)}%`);
  }

  // Save results if output specified
  if (options.output) {
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, JSON.stringify(summary, null, 2));
    console.log(`\n   Results saved to: ${options.output}`);
  }

  return summary;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  const options: QAOptions = {
    coverage: args.includes('--coverage') || args.includes('-c'),
    changed: args.includes('--changed'),
    related: args.includes('--related'),
    regression: args.includes('--regression'),
    smoke: args.includes('--smoke'),
    e2e: args.includes('--e2e'),
    ci: args.includes('--ci'),
    prioritized: args.includes('--prioritized'),
    uncovered: args.includes('--uncovered')
  };

  // Parse pattern
  const patternIndex = args.findIndex(arg => arg === '--pattern' || arg === '-p');
  if (patternIndex !== -1 && args[patternIndex + 1]) {
    options.pattern = args[patternIndex + 1];
  }

  // Parse framework
  const frameworkIndex = args.findIndex(arg => arg === '--framework' || arg === '-f');
  if (frameworkIndex !== -1 && args[frameworkIndex + 1]) {
    options.framework = args[frameworkIndex + 1];
  }

  // Parse parallel
  const parallelIndex = args.findIndex(arg => arg === '--parallel' || arg === '-j');
  if (parallelIndex !== -1 && args[parallelIndex + 1]) {
    options.parallel = parseInt(args[parallelIndex + 1], 10);
  }

  // Parse threshold
  const thresholdIndex = args.findIndex(arg => arg === '--threshold' || arg === '-t');
  if (thresholdIndex !== -1 && args[thresholdIndex + 1]) {
    options.threshold = parseInt(args[thresholdIndex + 1], 10);
  }

  // Parse format
  const formatIndex = args.findIndex(arg => arg === '--format');
  if (formatIndex !== -1 && args[formatIndex + 1]) {
    options.format = args[formatIndex + 1] as any;
  }

  // Parse output
  const outputIndex = args.findIndex(arg => arg === '--output' || arg === '-o');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.output = args[outputIndex + 1];
  }

  qa(options).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

export default qa;
