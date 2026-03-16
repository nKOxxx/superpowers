#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { simpleGit } from 'simple-git';
import { QAOptions, TestResult } from '../shared/types.js';
import { loadConfig, Logger, parseArgs } from '../shared/utils.js';

const logger = new Logger();

interface QAResult {
  mode: string;
  filesChanged: string[];
  projectType: string;
  testFramework: string;
  staticAnalysis: {
    lint: TestResult;
    typeCheck?: TestResult;
  };
  tests: TestResult;
  recommendations: string[];
  overall: 'PASS' | 'FAIL' | 'WARNING';
}

interface ProjectInfo {
  type: string;
  testFramework: string;
  testCommand: string;
  lintCommand: string;
  typeCheckCommand?: string;
}

async function runQA(options: QAOptions): Promise<QAResult> {
  const config = await loadConfig();
  const qaConfig = config.qa || {};
  
  const mode = options.mode || qaConfig.defaultMode || 'targeted';
  const repoPath = options.repoPath || '.';
  const diffRange = options.diff || 'HEAD~1';
  
  const result: QAResult = {
    mode,
    filesChanged: [],
    projectType: 'unknown',
    testFramework: 'unknown',
    staticAnalysis: {
      lint: { passed: false, message: 'Not run' },
    },
    tests: { passed: false, message: 'Not run' },
    recommendations: [],
    overall: 'PASS',
  };

  try {
    logger.section('QA Analysis');
    logger.log(`Mode: ${chalk.cyan(mode)}`);
    logger.log(`Path: ${chalk.cyan(repoPath)}\n`);
    
    // 1. Analyze git changes
    const git = simpleGit(repoPath);
    const diffSummary = await git.diffSummary([diffRange]);
    result.filesChanged = diffSummary.files.map((f: { file: string }) => f.file);
    
    logger.success(`Found ${result.filesChanged.length} changed files`);
    
    if (result.filesChanged.length === 0) {
      logger.warn('No files changed in this range');
      result.recommendations.push('No changes detected - verify your diff range');
      return result;
    }
    
    // Check change size
    let totalChanges = 0;
    for (const file of diffSummary.files) {
      if ('changes' in file && typeof file.changes === 'number') {
        totalChanges += file.changes;
      }
    }
    const threshold = qaConfig.autoTestThreshold || 50;
    
    if (totalChanges > threshold) {
      result.recommendations.push(`Large change detected (${totalChanges} lines) - consider breaking into smaller PRs`);
    }
    
    // 2. Detect project type
    const projectInfo = await detectProject(repoPath);
    result.projectType = projectInfo.type;
    result.testFramework = projectInfo.testFramework;
    
    logger.success(`Detected ${projectInfo.type} project with ${projectInfo.testFramework}`);
    
    // 3. Run static analysis
    logger.section('Static Analysis');
    
    // Lint
    try {
      if (projectInfo.lintCommand) {
        execSync(projectInfo.lintCommand, { 
          cwd: repoPath, 
          stdio: 'pipe',
          encoding: 'utf-8',
        });
        result.staticAnalysis.lint = { passed: true, message: 'No lint errors' };
        logger.success('Lint: No errors');
      } else {
        result.staticAnalysis.lint = { passed: true, message: 'No lint configured' };
        logger.info('Lint: Not configured');
      }
    } catch (error: any) {
      result.staticAnalysis.lint = { 
        passed: false, 
        message: error.stdout || error.message,
      };
      result.overall = 'FAIL';
      logger.error('Lint: Errors found');
    }
    
    // Type check
    if (projectInfo.typeCheckCommand) {
      try {
        execSync(projectInfo.typeCheckCommand, { 
          cwd: repoPath, 
          stdio: 'pipe',
          encoding: 'utf-8',
        });
        result.staticAnalysis.typeCheck = { passed: true, message: 'Type check passed' };
        logger.success('Type check: Passed');
      } catch (error: any) {
        result.staticAnalysis.typeCheck = { 
          passed: false, 
          message: error.stdout || error.message,
        };
        result.overall = 'FAIL';
        logger.error('Type check: Errors found');
      }
    }
    
    // 4. Run tests based on mode
    logger.section('Tests');
    
    let testCommand = projectInfo.testCommand;
    
    if (mode === 'targeted') {
      // Try to run only tests related to changed files
      testCommand = buildTargetedTestCommand(projectInfo, result.filesChanged);
    } else if (mode === 'smoke') {
      testCommand += ' --testNamePattern="smoke|critical"';
    } else if (mode === 'deep') {
      testCommand += ' --coverage';
    }
    
    try {
      const startTime = Date.now();
      const output = execSync(testCommand, { 
        cwd: repoPath, 
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 300000, // 5 minute timeout
      });
      const duration = Date.now() - startTime;
      
      // Parse test results
      const { passed, total } = parseTestResults(output, projectInfo.testFramework);
      result.tests = { 
        passed: true, 
        message: `${passed}/${total} tests passed`,
        duration,
      };
      logger.success(`Tests: ${passed}/${total} passed (${(duration / 1000).toFixed(1)}s)`);
      
    } catch (error: any) {
      const output = error.stdout || error.message || '';
      const { passed, total } = parseTestResults(output, projectInfo.testFramework);
      result.tests = { 
        passed: false, 
        message: `${passed}/${total} tests passed`,
      };
      result.overall = 'FAIL';
      logger.error(`Tests: ${passed}/${total} passed - failures detected`);
    }
    
    // 5. Generate recommendations
    generateRecommendations(result, qaConfig);
    
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    result.overall = 'FAIL';
  }

  return result;
}

async function detectProject(repoPath: string): Promise<ProjectInfo> {
  const packageJsonPath = path.join(repoPath, 'package.json');
  const cargoTomlPath = path.join(repoPath, 'Cargo.toml');
  const goModPath = path.join(repoPath, 'go.mod');
  const requirementsPath = path.join(repoPath, 'requirements.txt');
  const pyprojectPath = path.join(repoPath, 'pyproject.toml');
  
  // Check for Node.js
  try {
    await fs.access(packageJsonPath);
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    let testFramework = 'jest';
    let testCommand = 'npm test';
    
    if (deps.vitest) {
      testFramework = 'vitest';
      testCommand = 'npx vitest run';
    } else if (deps.mocha) {
      testFramework = 'mocha';
      testCommand = 'npm test';
    } else if (deps['@playwright/test']) {
      testFramework = 'playwright';
      testCommand = 'npx playwright test';
    }
    
    let lintCommand = '';
    if (deps.eslint) {
      lintCommand = 'npx eslint .';
    } else if (deps['@biomejs/biome']) {
      lintCommand = 'npx biome check .';
    }
    
    let typeCheckCommand = '';
    if (deps.typescript) {
      typeCheckCommand = 'npx tsc --noEmit';
    }
    
    return {
      type: 'Node.js',
      testFramework,
      testCommand,
      lintCommand,
      typeCheckCommand,
    };
  } catch {
    // Not Node.js
  }
  
  // Check for Rust
  try {
    await fs.access(cargoTomlPath);
    return {
      type: 'Rust',
      testFramework: 'cargo',
      testCommand: 'cargo test',
      lintCommand: 'cargo clippy -- -D warnings',
    };
  } catch {
    // Not Rust
  }
  
  // Check for Go
  try {
    await fs.access(goModPath);
    return {
      type: 'Go',
      testFramework: 'go',
      testCommand: 'go test ./...',
      lintCommand: 'golangci-lint run',
    };
  } catch {
    // Not Go
  }
  
  // Check for Python
  try {
    await fs.access(requirementsPath);
    return {
      type: 'Python',
      testFramework: 'pytest',
      testCommand: 'pytest',
      lintCommand: 'flake8 .',
    };
  } catch {
    try {
      await fs.access(pyprojectPath);
      return {
        type: 'Python',
        testFramework: 'pytest',
        testCommand: 'pytest',
        lintCommand: 'flake8 .',
      };
    } catch {
      // Not Python
    }
  }
  
  return {
    type: 'unknown',
    testFramework: 'unknown',
    testCommand: 'echo "No test framework detected"',
    lintCommand: '',
  };
}

function buildTargetedTestCommand(projectInfo: ProjectInfo, filesChanged: string[]): string {
  // Try to find test files that correspond to changed files
  const testFiles = filesChanged
    .filter(f => !f.includes('.test.') && !f.includes('.spec.'))
    .map(f => {
      const dir = path.dirname(f);
      const base = path.basename(f, path.extname(f));
      const ext = path.extname(f);
      
      // Look for corresponding test files
      return [
        path.join(dir, `${base}.test${ext}`),
        path.join(dir, `${base}.spec${ext}`),
        path.join(dir, '__tests__', `${base}.test${ext}`),
        path.join('tests', `${base}.test${ext}`),
      ];
    })
    .flat();
  
  if (testFiles.length > 0 && projectInfo.testFramework === 'vitest') {
    return `npx vitest run ${testFiles.join(' ')}`;
  }
  
  // Fall back to running all tests with a pattern if supported
  return projectInfo.testCommand;
}

function parseTestResults(output: string, framework: string): { passed: number; total: number } {
  if (framework === 'jest' || framework === 'vitest') {
    // Pattern: Tests: 10 passed, 2 failed, 12 total
    const match = output.match(/(\d+) passed.*?(\d+) total/);
    if (match) {
      return { passed: parseInt(match[1], 10), total: parseInt(match[2], 10) };
    }
    // Pattern: ✓ 10 tests
    const simpleMatch = output.match(/[✓✔]\s*(\d+)\s*tests?/);
    if (simpleMatch) {
      const passed = parseInt(simpleMatch[1], 10);
      return { passed, total: passed };
    }
  }
  
  if (framework === 'cargo') {
    const match = output.match(/test result:.*?\.(\d+) passed; (\d+) failed;/);
    if (match) {
      return { passed: parseInt(match[1], 10), total: parseInt(match[1], 10) + parseInt(match[2], 10) };
    }
  }
  
  return { passed: 0, total: 0 };
}

function generateRecommendations(result: QAResult, config: any): void {
  // Add recommendations based on findings
  if (result.filesChanged.some(f => f.endsWith('.css') || f.endsWith('.scss'))) {
    result.recommendations.push('Style changes detected - consider visual regression testing');
  }
  
  if (!result.staticAnalysis.lint.passed) {
    result.recommendations.push('Fix lint errors before merging');
  }
  
  if (!result.tests.passed) {
    result.recommendations.push('Fix failing tests before merging');
  }
  
  if (result.recommendations.length === 0 && result.overall === 'PASS') {
    result.recommendations.push('All checks passed - ready for PR');
  }
}

function generateReport(result: QAResult): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold(`\n🧪 QA Report: ${result.mode} mode\n`));
  
  if (result.overall === 'PASS') {
    lines.push(chalk.green('✅ OVERALL: PASS (Ready for PR)\n'));
  } else if (result.overall === 'WARNING') {
    lines.push(chalk.yellow('⚠️ OVERALL: WARNING\n'));
  } else {
    lines.push(chalk.red('❌ OVERALL: FAIL\n'));
  }
  
  lines.push(chalk.bold('📊 Change Analysis:'));
  lines.push(`   Files: ${result.filesChanged.length} modified`);
  lines.push(`   Project: ${result.projectType} (${result.testFramework})\n`);
  
  lines.push(chalk.bold('✅ Static Analysis:'));
  lines.push(`   Lint: ${result.staticAnalysis.lint.passed ? 'PASS' : 'FAIL'}`);
  if (result.staticAnalysis.typeCheck) {
    lines.push(`   Type check: ${result.staticAnalysis.typeCheck.passed ? 'PASS' : 'FAIL'}`);
  }
  lines.push('');
  
  lines.push(chalk.bold('🧪 Tests:'));
  if (result.tests.duration) {
    lines.push(`   ${result.tests.message} (${(result.tests.duration / 1000).toFixed(1)}s)`);
  } else {
    lines.push(`   ${result.tests.message}`);
  }
  lines.push('');
  
  if (result.recommendations.length > 0) {
    lines.push(chalk.bold('📋 Recommendations:'));
    for (const rec of result.recommendations) {
      lines.push(`   • ${rec}`);
    }
  }
  
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  const options: QAOptions = {
    mode: (args.mode as any) || 'targeted',
    diff: args.diff as string,
    repoPath: args['repo-path'] as string,
    silent: args.silent === true,
  };
  
  try {
    const result = await runQA(options);
    console.log(generateReport(result));
    process.exit(result.overall === 'FAIL' ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  }
}

main();
