/**
 * QA Skill - Systematic Testing
 * 
 * Analyze code changes and run appropriate tests with smart test selection.
 * Compatible with Kimi K2.5 - uses straightforward types and clear structure.
 */

import { execSync } from 'child_process';
import { readFileSync, accessSync, existsSync } from 'fs';
import { resolve, join } from 'path';

// ============================================================================
// Types
// ============================================================================

export type TestMode = 'changed' | 'full' | 'coverage' | 'security' | 'lint';
export type TestRunner = 'vitest' | 'jest' | 'playwright' | 'mocha';

export interface QAOptions {
  mode?: TestMode;
  coverage?: boolean;
  watch?: boolean;
  parallel?: boolean;
  threshold?: number;
  runner?: TestRunner;
  pattern?: string;
  cwd?: string;
  verbose?: boolean;
}

export interface TestStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface CoverageStats {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

export interface TestFailure {
  test: string;
  error: string;
  file: string;
  line?: number;
}

export interface SecurityVulnerability {
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
  package: string;
  range: string;
  fixAvailable: boolean;
  title?: string;
  url?: string;
}

export interface LintResult {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
  rule?: string;
}

export interface QAResult {
  passed: boolean;
  stats: TestStats;
  coverage?: CoverageStats;
  failures: TestFailure[];
  lintErrors?: LintResult[];
  vulnerabilities?: SecurityVulnerability[];
  changedFiles?: string[];
  affectedTests?: string[];
  testFiles?: string[];
}

export interface SkillResult<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  media?: string[];
  errors?: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function fileExists(path: string): boolean {
  try {
    accessSync(path);
    return true;
  } catch {
    return false;
  }
}

function readJsonFile<T>(path: string): T | null {
  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function execCommand(command: string, cwd: string): string {
  try {
    return execSync(command, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error: any) {
    return error.stdout || '';
  }
}

function getChangedFiles(cwd: string, since: string = 'HEAD~1'): string[] {
  try {
    const output = execCommand(`git diff --name-only ${since}`, cwd);
    return output.split('\n').filter(f => f.trim() !== '');
  } catch {
    return [];
  }
}

function findAffectedTests(changedFiles: string[], testPatterns: string[]): string[] {
  const affected: string[] = [];
  const seen = new Set<string>();
  
  for (const file of changedFiles) {
    const parts = file.split('.');
    const ext = parts[parts.length - 1] || 'ts';
    const baseName = file.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');
    const dir = file.includes('/') ? file.substring(0, file.lastIndexOf('/')) : '';
    const filename = file.split('/').pop()?.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '') || '';
    
    const possibleTests = [
      `${baseName}.test.${ext}`,
      `${baseName}.spec.${ext}`,
      `${dir}/__tests__/${filename}.test.${ext}`,
      `${dir}/__tests__/${filename}.spec.${ext}`,
      `tests/${baseName.replace(/^src\//, '')}.test.${ext}`,
      `test/${baseName.replace(/^src\//, '')}.test.${ext}`,
      baseName.replace(/^src/, 'tests') + `.test.${ext}`,
      baseName.replace(/^src/, 'test') + `.test.${ext}`
    ];

    for (const testFile of possibleTests) {
      const normalized = testFile.replace(/\/+/g, '/');
      if (!seen.has(normalized) && fileExists(normalized)) {
        affected.push(normalized);
        seen.add(normalized);
      }
    }
  }

  return affected;
}

// ============================================================================
// Test Framework Detection
// ============================================================================

interface FrameworkConfig {
  name: TestRunner;
  configFiles: string[];
  testPatterns: string[];
}

const FRAMEWORKS: FrameworkConfig[] = [
  {
    name: 'vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts', 'vite.config.js'],
    testPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js']
  },
  {
    name: 'jest',
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json', 'jest.config.mjs'],
    testPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js']
  },
  {
    name: 'playwright',
    configFiles: ['playwright.config.ts', 'playwright.config.js'],
    testPatterns: ['**/e2e/**/*.spec.ts', '**/tests/**/*.spec.ts', '**/*.e2e.ts']
  },
  {
    name: 'mocha',
    configFiles: ['.mocharc.js', '.mocharc.json', '.mocharc.yaml', 'test/mocha.opts'],
    testPatterns: ['**/test/**/*.js', '**/tests/**/*.js']
  }
];

function detectFramework(cwd: string): TestRunner | null {
  // Check for config files
  for (const framework of FRAMEWORKS) {
    for (const configFile of framework.configFiles) {
      if (fileExists(resolve(cwd, configFile))) {
        return framework.name;
      }
    }
  }

  // Check package.json
  const pkg = readJsonFile<{ devDependencies?: Record<string, string> }>(resolve(cwd, 'package.json'));
  if (pkg?.devDependencies) {
    if (pkg.devDependencies.vitest) return 'vitest';
    if (pkg.devDependencies.jest) return 'jest';
    if (pkg.devDependencies['@playwright/test']) return 'playwright';
    if (pkg.devDependencies.mocha) return 'mocha';
  }

  return null;
}

function buildTestCommand(framework: TestRunner, options: QAOptions, testFiles: string[]): string {
  const parts: string[] = ['npx', framework];

  if (framework === 'vitest') {
    parts.push('run');
    if (options.coverage) parts.push('--coverage');
    if (options.parallel) parts.push('--pool=forks');
    if (testFiles.length > 0) parts.push(...testFiles);
  } else if (framework === 'jest') {
    if (options.coverage) parts.push('--coverage');
    if (options.parallel) parts.push('--maxWorkers=50%');
    if (testFiles.length > 0) parts.push('--testPathPattern', testFiles.join('|'));
    parts.push('--json', '--outputFile=/tmp/jest-results.json');
  } else if (framework === 'playwright') {
    if (options.parallel) parts.push('--workers=4');
    if (testFiles.length > 0) parts.push(...testFiles);
  } else if (framework === 'mocha') {
    if (testFiles.length > 0) {
      parts.push(...testFiles);
    } else {
      parts.push('--recursive', 'test/');
    }
  }

  return parts.join(' ');
}

// ============================================================================
// Security Audit
// ============================================================================

function runSecurityAudit(cwd: string): SecurityVulnerability[] {
  try {
    const output = execSync('npm audit --json', { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const audit = JSON.parse(output);
    return parseAuditResult(audit);
  } catch (error: any) {
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout);
        return parseAuditResult(audit);
      } catch {
        return [];
      }
    }
    return [];
  }
}

function parseAuditResult(audit: any): SecurityVulnerability[] {
  const vulnerabilities: SecurityVulnerability[] = [];

  for (const [pkgName, info] of Object.entries(audit.vulnerabilities || {})) {
    const vuln = info as any;
    if (vuln.via && Array.isArray(vuln.via)) {
      for (const v of vuln.via) {
        if (typeof v === 'object') {
          vulnerabilities.push({
            severity: v.severity || 'low',
            package: pkgName,
            range: vuln.range || '*',
            fixAvailable: vuln.fixAvailable !== false,
            title: v.title,
            url: v.url
          });
        }
      }
    }
  }

  return vulnerabilities;
}

// ============================================================================
// Lint
// ============================================================================

function runLint(cwd: string): LintResult[] {
  const errors: LintResult[] = [];
  
  try {
    const output = execSync('npx eslint --format json .', { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const results = JSON.parse(output);
    for (const result of results) {
      for (const msg of result.messages || []) {
        errors.push({
          file: result.filePath,
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warning',
          message: msg.message,
          rule: msg.ruleId
        });
      }
    }
  } catch (error: any) {
    if (error.stdout) {
      try {
        const results = JSON.parse(error.stdout);
        for (const result of results) {
          for (const msg of result.messages || []) {
            errors.push({
              file: result.filePath,
              line: msg.line,
              column: msg.column,
              severity: msg.severity === 2 ? 'error' : 'warning',
              message: msg.message,
              rule: msg.ruleId
            });
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  
  return errors;
}

// ============================================================================
// Main QA Function
// ============================================================================

/**
 * QA - Systematic testing with smart test selection
 */
export async function qa(options: QAOptions = {}): Promise<SkillResult<QAResult>> {
  const startTime = Date.now();
  const cwd = options.cwd || process.cwd();

  try {
    // Handle security mode
    if (options.mode === 'security') {
      const vulnerabilities = runSecurityAudit(cwd);
      const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
      const high = vulnerabilities.filter(v => v.severity === 'high').length;
      const moderate = vulnerabilities.filter(v => v.severity === 'moderate').length;
      const low = vulnerabilities.filter(v => v.severity === 'low').length;

      const message = `🔒 Security Audit\n\n` +
        `Vulnerabilities found:\n` +
        `🚨 Critical: ${critical}\n` +
        `⚠️ High: ${high}\n` +
        `⚡ Moderate: ${moderate}\n` +
        `ℹ️ Low: ${low}\n\n` +
        `${vulnerabilities.length === 0 ? '✅ No vulnerabilities found!' : '⚠️ Review and fix recommended.'}`;

      return {
        success: critical === 0 && high === 0,
        data: {
          passed: critical === 0 && high === 0,
          stats: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
          failures: [],
          vulnerabilities
        },
        message
      };
    }

    // Handle lint mode
    if (options.mode === 'lint') {
      const lintErrors = runLint(cwd);
      const errors = lintErrors.filter(e => e.severity === 'error');
      const warnings = lintErrors.filter(e => e.severity === 'warning');

      return {
        success: errors.length === 0,
        data: {
          passed: errors.length === 0,
          stats: { total: 0, passed: 0, failed: errors.length, skipped: 0, duration: 0 },
          failures: [],
          lintErrors
        },
        message: errors.length === 0 
          ? `✅ Linting passed\n${warnings.length} warning(s)` 
          : `❌ Linting failed\n${errors.length} error(s), ${warnings.length} warning(s)`
      };
    }

    // Detect test framework
    const framework = options.runner || detectFramework(cwd);
    if (!framework) {
      return {
        success: false,
        message: '❌ No test framework detected. Install vitest, jest, playwright, or mocha.',
        errors: ['No test framework detected']
      };
    }

    // Determine test files for changed mode
    let changedFiles: string[] = [];
    let affectedTests: string[] = [];
    let testFiles: string[] = [];

    if (options.mode === 'changed') {
      changedFiles = getChangedFiles(cwd);
      affectedTests = findAffectedTests(changedFiles, ['**/*.test.ts', '**/*.test.js']);
      testFiles = affectedTests.filter(f => existsSync(resolve(cwd, f)));
      
      if (testFiles.length === 0) {
        return {
          success: true,
          message: `✅ No tests to run\n${changedFiles.length} file(s) changed, no affected tests found.`,
          data: {
            passed: true,
            stats: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
            failures: [],
            changedFiles,
            affectedTests
          }
        };
      }
    }

    // Run tests
    const command = buildTestCommand(framework, options, testFiles);
    
    let output = '';
    let exitCode = 0;

    try {
      output = execSync(command, { 
        cwd, 
        encoding: 'utf-8',
        timeout: 300000
      });
    } catch (error: any) {
      exitCode = error.status || 1;
      output = String(error.stdout || '') + String(error.stderr || '');
    }

    // Parse results
    const stats: TestStats = { total: 0, passed: 0, failed: 0, skipped: 0, duration: Date.now() - startTime };
    
    // Try to parse from JSON output (Jest)
    if (framework === 'jest' && existsSync('/tmp/jest-results.json')) {
      try {
        const data = JSON.parse(readFileSync('/tmp/jest-results.json', 'utf-8'));
        stats.passed = data.numPassedTests || 0;
        stats.failed = data.numFailedTests || 0;
        stats.skipped = data.numPendingTests || 0;
        stats.total = stats.passed + stats.failed + stats.skipped;
      } catch {
        // Fall through to regex parsing
      }
    }

    // Regex parsing fallback
    if (stats.total === 0) {
      const passMatch = output.match(/(\d+)\s+passing/);
      const failMatch = output.match(/(\d+)\s+failing/);
      const skipMatch = output.match(/(\d+)\s+skipped|(\d+)\s+pending/);
      
      if (passMatch) stats.passed = parseInt(passMatch[1], 10);
      if (failMatch) stats.failed = parseInt(failMatch[1], 10);
      if (skipMatch) stats.skipped = parseInt(skipMatch[1] || skipMatch[2], 10);
      stats.total = stats.passed + stats.failed + stats.skipped;
    }

    // Parse coverage if requested
    let coverage: CoverageStats | undefined;
    if (options.coverage || options.mode === 'coverage') {
      const linesMatch = output.match(/Lines\s*[:)]\s*([\d.]+)%/);
      const funcsMatch = output.match(/Functions?\s*[:)]\s*([\d.]+)%/);
      const branchMatch = output.match(/Branches\s*[:)]\s*([\d.]+)%/);
      const stmtMatch = output.match(/Statements\s*[:)]\s*([\d.]+)%/);

      coverage = {
        lines: linesMatch ? parseFloat(linesMatch[1]) : 0,
        functions: funcsMatch ? parseFloat(funcsMatch[1]) : 0,
        branches: branchMatch ? parseFloat(branchMatch[1]) : 0,
        statements: stmtMatch ? parseFloat(stmtMatch[1]) : 0
      };
    }

    // Check coverage threshold
    const coverageMet = !options.threshold || !coverage || coverage.lines >= options.threshold;
    const success = exitCode === 0 && coverageMet;

    // Format message
    const status = success ? '✅' : '❌';
    let message = `${status} Test Results - ${framework}\n\n`;
    message += `${stats.passed}/${stats.total} passed`;
    if (stats.failed > 0) message += `, ${stats.failed} failed`;
    if (stats.skipped > 0) message += `, ${stats.skipped} skipped`;
    message += `\nDuration: ${stats.duration}ms`;

    if (coverage) {
      message += `\n\n📊 Coverage:\n`;
      message += `Lines: ${coverage.lines.toFixed(1)}%\n`;
      message += `Functions: ${coverage.functions.toFixed(1)}%\n`;
      message += `Branches: ${coverage.branches.toFixed(1)}%`;
      if (!coverageMet) {
        message += `\n⚠️ Below ${options.threshold}% threshold`;
      }
    }

    if (changedFiles.length > 0) {
      message += `\n\n📝 Changed: ${changedFiles.length} | 🎯 Tests: ${testFiles.length}`;
    }

    return {
      success,
      data: {
        passed: success,
        stats,
        coverage,
        failures: [],
        changedFiles: options.mode === 'changed' ? changedFiles : undefined,
        affectedTests: options.mode === 'changed' ? affectedTests : undefined,
        testFiles
      },
      message
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ QA failed: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

// ============================================================================
// Additional Exports
// ============================================================================

export { qa as runQA, qa as test };
export default qa;
