import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { 
  QaOptions, 
  QaResult, 
  TestFramework, 
  GitDiff, 
  TestFile,
  CoverageReport 
} from './types.js';

export * from './types.js';

export function detectFramework(cwd: string = process.cwd()): TestFramework {
  const packageJsonPath = join(cwd, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    return 'unknown';
  }
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  if (deps.vitest) return 'vitest';
  if (deps.jest) return 'jest';
  if (deps.mocha) return 'mocha';
  
  // Check for config files
  if (existsSync(join(cwd, 'vitest.config.js')) || 
      existsSync(join(cwd, 'vitest.config.ts'))) return 'vitest';
  if (existsSync(join(cwd, 'jest.config.js')) || 
      existsSync(join(cwd, 'jest.config.ts'))) return 'jest';
  if (existsSync(join(cwd, '.mocharc.js')) || 
      existsSync(join(cwd, '.mocharc.json'))) return 'mocha';
  
  return 'unknown';
}

export function getGitDiff(cwd: string = process.cwd()): GitDiff {
  try {
    const output = execSync('git diff --name-only HEAD', { cwd, encoding: 'utf-8' }).trim();
    const files = output ? output.split('\n') : [];
    
    const statusOutput = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
    const staged: string[] = statusOutput
      .split('\n')
      .filter((line: string) => line.startsWith('A ') || line.startsWith('M ') || line.startsWith('D '))
      .map((line: string) => line.slice(3));
    
    const allFiles = [...new Set([...files, ...staged])];
    
    return {
      files: allFiles,
      added: allFiles.filter(f => {
        const status = execSync(`git status --porcelain "${f}"`, { cwd, encoding: 'utf-8' }).trim();
        return status.startsWith('A');
      }),
      modified: allFiles.filter(f => {
        const status = execSync(`git status --porcelain "${f}"`, { cwd, encoding: 'utf-8' }).trim();
        return status.startsWith('M') || status.startsWith(' M');
      }),
      deleted: allFiles.filter(f => {
        const status = execSync(`git status --porcelain "${f}"`, { cwd, encoding: 'utf-8' }).trim();
        return status.startsWith('D');
      })
    };
  } catch (error) {
    return { files: [], added: [], modified: [], deleted: [] };
  }
}

export function findRelatedTests(
  sourceFiles: string[], 
  cwd: string = process.cwd()
): TestFile[] {
  const testFiles: TestFile[] = [];
  const framework = detectFramework(cwd);
  
  for (const sourceFile of sourceFiles) {
    // Look for corresponding test files
    const extensions = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
    const baseName = sourceFile.replace(/\.(ts|js|tsx|jsx)$/, '');
    
    for (const ext of extensions) {
      const testPath = join(cwd, baseName + ext);
      if (existsSync(testPath)) {
        testFiles.push({
          path: testPath,
          framework,
          relatedSourceFiles: [sourceFile]
        });
      }
    }
    
    // Check for __tests__ directory pattern
    const dir = sourceFile.substring(0, sourceFile.lastIndexOf('/'));
    const fileName = sourceFile.substring(sourceFile.lastIndexOf('/') + 1).replace(/\.(ts|js|tsx|jsx)$/, '');
    const testDirPath = join(cwd, dir, '__tests__', `${fileName}.test.ts`);
    
    if (existsSync(testDirPath)) {
      testFiles.push({
        path: testDirPath,
        framework,
        relatedSourceFiles: [sourceFile]
      });
    }
  }
  
  // Remove duplicates
  const unique = new Map<string, TestFile>();
  for (const tf of testFiles) {
    if (!unique.has(tf.path)) {
      unique.set(tf.path, tf);
    } else {
      const existing = unique.get(tf.path)!;
      existing.relatedSourceFiles = [...new Set([...existing.relatedSourceFiles, ...tf.relatedSourceFiles])];
    }
  }
  
  return Array.from(unique.values());
}

function buildTestCommand(framework: TestFramework, options: QaOptions, testFiles?: string[]): string {
  const coverage = options.coverage ? '--coverage' : '';
  const verbose = options.verbose ? '--verbose' : '';
  const updateSnapshot = options.updateSnapshot ? '-u' : '';
  
  switch (framework) {
    case 'vitest':
      const vitestFiles = testFiles ? testFiles.join(' ') : '';
      return `npx vitest run ${vitestFiles} ${coverage} ${verbose} ${updateSnapshot}`.trim();
    case 'jest':
      const jestPattern = testFiles ? `--testPathPattern="${testFiles.join('|')}"` : '';
      return `npx jest ${jestPattern} ${coverage} ${verbose} ${updateSnapshot}`.trim();
    case 'mocha':
      const mochaFiles = testFiles ? testFiles.join(' ') : '';
      return `npx mocha ${mochaFiles} ${verbose}`.trim();
    default:
      throw new Error('Unknown test framework');
  }
}

function parseTestOutput(output: string, framework: TestFramework): Partial<QaResult> {
  const result: Partial<QaResult> = {
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    testsSkipped: 0
  };
  
  if (framework === 'vitest') {
    // Parse Vitest output
    const testsMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);
    const skippedMatch = output.match(/(\d+)\s+skipped/);
    
    if (testsMatch) result.testsPassed = parseInt(testsMatch[1], 10);
    if (failedMatch) result.testsFailed = parseInt(failedMatch[1], 10);
    if (skippedMatch) result.testsSkipped = parseInt(skippedMatch[1], 10);
    result.testsRun = (result.testsPassed || 0) + (result.testsFailed || 0) + (result.testsSkipped || 0);
  } else if (framework === 'jest') {
    // Parse Jest output
    const testsMatch = output.match(/Tests:\s+(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);
    const skippedMatch = output.match(/(\d+)\s+pending|skipped/);
    
    if (testsMatch) result.testsPassed = parseInt(testsMatch[1], 10);
    if (failedMatch) result.testsFailed = parseInt(failedMatch[1], 10);
    if (skippedMatch) result.testsSkipped = parseInt(skippedMatch[1], 10);
    result.testsRun = (result.testsPassed || 0) + (result.testsFailed || 0) + (result.testsSkipped || 0);
  }
  
  return result;
}

export async function runQa(options: QaOptions, cwd: string = process.cwd()): Promise<QaResult> {
  const startTime = Date.now();
  const framework = detectFramework(cwd);
  
  if (framework === 'unknown') {
    return {
      success: false,
      framework,
      mode: options.mode,
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      testsSkipped: 0,
      duration: 0,
      error: 'No test framework detected. Please install vitest, jest, or mocha.'
    };
  }
  
  try {
    let testFiles: string[] | undefined;
    
    if (options.mode === 'targeted') {
      const diff = getGitDiff(cwd);
      const related = findRelatedTests(diff.files, cwd);
      testFiles = related.map(t => t.path);
      
      if (testFiles.length === 0) {
        return {
          success: true,
          framework,
          mode: 'targeted',
          testsRun: 0,
          testsPassed: 0,
          testsFailed: 0,
          testsSkipped: 0,
          duration: Date.now() - startTime,
          error: 'No related tests found for changed files'
        };
      }
    } else if (options.mode === 'smoke') {
      // Run a quick smoke test - just the first test file or files matching smoke pattern
      const { globSync } = await import('glob');
      const smokeFiles = globSync('**/*.{smoke,e2e}.test.{ts,js}', { cwd });
      if (smokeFiles.length > 0) {
        testFiles = smokeFiles;
      }
    }
    // 'full' mode runs all tests, so no testFiles filter
    
    const command = buildTestCommand(framework, options, testFiles);
    
    const output = execSync(command, { 
      cwd, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const parsed = parseTestOutput(output, framework);
    
    return {
      success: true,
      framework,
      mode: options.mode,
      testsRun: parsed.testsRun || 0,
      testsPassed: parsed.testsPassed || 0,
      testsFailed: parsed.testsFailed || 0,
      testsSkipped: parsed.testsSkipped || 0,
      duration: Date.now() - startTime
    };
  } catch (error) {
    const errorOutput = error instanceof Error ? error.message : String(error);
    const parsed = parseTestOutput(errorOutput, framework);
    
    return {
      success: false,
      framework,
      mode: options.mode,
      testsRun: parsed.testsRun || 0,
      testsPassed: parsed.testsPassed || 0,
      testsFailed: parsed.testsFailed || 0,
      testsSkipped: parsed.testsSkipped || 0,
      duration: Date.now() - startTime,
      error: errorOutput
    };
  }
}
