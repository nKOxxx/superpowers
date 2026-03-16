/**
 * Test runner for QA skill
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  details: TestDetail[];
  coverage?: number;
}

export interface TestDetail {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
}

export interface RunOptions {
  coverage?: boolean;
  verbose?: boolean;
  timeout?: number;
}

export async function runTests(
  testFiles: string[],
  options: RunOptions = {}
): Promise<TestResult> {
  const result: TestResult = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    details: []
  };
  
  const testCommand = detectTestCommand();
  const coverageFlag = options.coverage ? getCoverageFlag(testCommand) : '';
  const verboseFlag = options.verbose ? getVerboseFlag(testCommand) : '';
  
  try {
    let cmd: string;
    
    if (testFiles.length === 0 || testFiles.includes('full-suite')) {
      cmd = `${testCommand} ${coverageFlag} ${verboseFlag}`;
    } else if (testFiles.includes('smoke')) {
      cmd = `${testCommand} --grep=smoke ${verboseFlag}`;
    } else {
      const fileArgs = testFiles.join(' ');
      cmd = `${testCommand} ${fileArgs} ${coverageFlag} ${verboseFlag}`;
    }
    
    console.log(`  Running: ${cmd}`);
    
    const output = execSync(cmd, { 
      encoding: 'utf-8',
      timeout: options.timeout || 300000, // 5 min default
      stdio: options.verbose ? 'inherit' : 'pipe'
    });
    
    // Parse results from output
    result.total = parseTestCount(output);
    result.passed = result.total; // Simplified - actual parsing would be more complex
    
    // Try to extract coverage if requested
    if (options.coverage) {
      result.coverage = parseCoverage(output);
    }
    
  } catch (error: any) {
    // Tests failed - parse the error output
    const output = error.stdout || error.message || '';
    result.total = parseTestCount(output);
    result.failed = 1; // Simplified
    result.passed = Math.max(0, result.total - result.failed);
    
    if (options.coverage) {
      result.coverage = parseCoverage(output);
    }
  }
  
  return result;
}

function detectTestCommand(): string {
  // Detect test framework
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const testScript = pkg.scripts?.test || '';
    
    if (testScript.includes('vitest')) return 'npx vitest run';
    if (testScript.includes('jest')) return 'npx jest';
    if (testScript.includes('mocha')) return 'npx mocha';
    if (testScript.includes('playwright')) return 'npx playwright test';
    
    // Check for config files
    if (fs.existsSync('vitest.config.ts') || fs.existsSync('vitest.config.js')) {
      return 'npx vitest run';
    }
    if (fs.existsSync('jest.config.js') || fs.existsSync('jest.config.ts')) {
      return 'npx jest';
    }
    if (fs.existsSync('playwright.config.ts') || fs.existsSync('playwright.config.js')) {
      return 'npx playwright test';
    }
  }
  
  return 'npm test';
}

function getCoverageFlag(testCommand: string): string {
  if (testCommand.includes('vitest')) return '--coverage';
  if (testCommand.includes('jest')) return '--coverage';
  if (testCommand.includes('playwright')) return '';
  return '';
}

function getVerboseFlag(testCommand: string): string {
  if (testCommand.includes('vitest')) return '--reporter=verbose';
  if (testCommand.includes('jest')) return '--verbose';
  if (testCommand.includes('mocha')) return '--reporter spec';
  return '';
}

function parseTestCount(output: string): number {
  // Try to extract test count from various formats
  const patterns = [
    /(\d+) tests? passed/i,
    /(\d+) passing/i,
    /Test Suites?: (\d+) passed/i,
    /Ran (\d+) tests?/i
  ];
  
  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0;
}

function parseCoverage(output: string): number | undefined {
  const patterns = [
    /All files\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+(\d+\.?\d*)%/i,
    /Statements\s*:\s*(\d+\.?\d*)%/i,
    /Lines\s*:\s*(\d+\.?\d*)%/i
  ];
  
  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  
  return undefined;
}
