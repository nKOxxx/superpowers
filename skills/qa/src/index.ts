/**
 * QA skill - Systematic testing as QA Lead
 */
import { Logger, exec, findUpFile, readJsonFile } from '@nko/superpowers-shared';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger({ prefix: 'qa' });

export type TestFramework = 'vitest' | 'jest' | 'mocha' | 'unknown';
export type TestMode = 'targeted' | 'smoke' | 'full';

export interface QAOptions {
  mode?: TestMode;
  coverage?: boolean;
  framework?: TestFramework;
  ci?: boolean;
  watch?: boolean;
}

interface PackageJson {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
}

function parseArgs(): QAOptions {
  const args = process.argv.slice(2);
  const options: QAOptions = { mode: 'targeted' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--mode':
      case '-m':
        options.mode = args[++i] as TestMode;
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--framework':
      case '-f':
        options.framework = args[++i] as TestFramework;
        break;
      case '--ci':
        options.ci = true;
        break;
      case '--watch':
        options.watch = true;
        break;
    }
  }

  return options;
}

function detectFramework(projectRoot: string): TestFramework {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return 'unknown';
  }

  const packageJson = readJsonFile<PackageJson>(packageJsonPath);
  if (!packageJson) return 'unknown';

  const allDeps = {
    ...packageJson.devDependencies,
    ...packageJson.dependencies,
  };

  if (allDeps.vitest) return 'vitest';
  if (allDeps.jest) return 'jest';
  if (allDeps.mocha) return 'mocha';

  if (fs.existsSync(path.join(projectRoot, 'vitest.config.ts')) ||
      fs.existsSync(path.join(projectRoot, 'vitest.config.js'))) {
    return 'vitest';
  }

  if (fs.existsSync(path.join(projectRoot, 'jest.config.ts')) ||
      fs.existsSync(path.join(projectRoot, 'jest.config.js'))) {
    return 'jest';
  }

  if (fs.existsSync(path.join(projectRoot, '.mocharc.json'))) {
    return 'mocha';
  }

  return 'unknown';
}

async function getGitDiff(projectRoot: string): Promise<{ files: string[]; isClean: boolean }> {
  const { stdout, exitCode } = await exec('git diff --name-only HEAD', { cwd: projectRoot });
  
  if (exitCode !== 0) {
    return { files: [], isClean: true };
  }

  const files = stdout.trim().split('\n').filter(f => f.length > 0);
  
  const { stdout: stagedStdout } = await exec('git diff --cached --name-only', { cwd: projectRoot });
  const stagedFiles = stagedStdout.trim().split('\n').filter(f => f.length > 0);
  
  const allFiles = [...new Set([...files, ...stagedFiles])];
  
  return {
    files: allFiles,
    isClean: allFiles.length === 0,
  };
}

function mapSourceToTestFiles(sourceFiles: string[]): string[] {
  const testFiles: string[] = [];
  
  for (const file of sourceFiles) {
    if (/\.(test|spec)\.(ts|js|tsx|jsx|mjs|cjs)$/.test(file)) {
      testFiles.push(file);
      continue;
    }

    const dir = path.dirname(file);
    const basename = path.basename(file, path.extname(file));
    const ext = path.extname(file);

    const patterns = [
      path.join(dir, `${basename}.test${ext}`),
      path.join(dir, `${basename}.spec${ext}`),
      path.join(dir, '__tests__', `${basename}.test${ext}`),
      path.join(dir, '__tests__', `${basename}.spec${ext}`),
      path.join(dir, 'test', `${basename}.test${ext}`),
      path.join(dir, 'tests', `${basename}.test${ext}`),
    ];

    testFiles.push(...patterns);
  }

  return [...new Set(testFiles)];
}

function getTestCommand(framework: TestFramework, options: QAOptions, testFiles?: string[]): string {
  const coverageFlag = options.coverage ? ' --coverage' : '';
  const ciFlag = options.ci ? ' --ci' : '';
  const watchFlag = options.watch && !options.ci ? ' --watch' : '';

  switch (framework) {
    case 'vitest':
      if (testFiles && testFiles.length > 0) {
        return `vitest run ${testFiles.join(' ')}${coverageFlag}${ciFlag}`;
      }
      return `vitest run${coverageFlag}${ciFlag}`;

    case 'jest':
      if (testFiles && testFiles.length > 0) {
        return `jest ${testFiles.join(' ')}${coverageFlag}${ciFlag}${watchFlag}`;
      }
      return `jest${coverageFlag}${ciFlag}${watchFlag}`;

    case 'mocha':
      if (testFiles && testFiles.length > 0) {
        return `mocha ${testFiles.join(' ')}${ciFlag}`;
      }
      return `mocha${ciFlag}`;

    default:
      throw new Error('No test framework detected. Please specify with --framework');
  }
}

async function runTests(
  projectRoot: string,
  framework: TestFramework,
  options: QAOptions
): Promise<{ success: boolean; output: string }> {
  let testFiles: string[] | undefined;

  if (options.mode === 'targeted') {
    const diff = await getGitDiff(projectRoot);
    
    if (diff.isClean) {
      logger.warn('No changes detected. Running full test suite.');
    } else {
      logger.info(`Detected ${diff.files.length} changed file(s)`);
      
      const sourceFiles = diff.files.filter(f => 
        /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(f) && 
        !f.includes('node_modules/') &&
        !/\.(test|spec)\./.test(f)
      );

      if (sourceFiles.length > 0) {
        testFiles = mapSourceToTestFiles(sourceFiles);
        logger.info(`Mapped to ${testFiles.length} potential test file(s)`);
        
        const existingTestFiles = testFiles.filter(f => 
          fs.existsSync(path.join(projectRoot, f))
        );
        
        if (existingTestFiles.length > 0) {
          testFiles = existingTestFiles;
          logger.info(`Found ${testFiles.length} existing test file(s) to run`);
        } else {
          logger.warn('No matching test files found, running full suite');
          testFiles = undefined;
        }
      }
    }
  }

  const command = getTestCommand(framework, options, testFiles);
  logger.info(`Running: ${command}`);

  const spinner = logger.spinner('Running tests...');
  const result = await exec(command, { cwd: projectRoot });

  if (result.exitCode === 0) {
    spinner.succeed('Tests passed');
    return { success: true, output: result.stdout };
  } else {
    spinner.fail('Tests failed');
    return { success: false, output: result.stdout + result.stderr };
  }
}

async function runSmokeTests(
  projectRoot: string,
  framework: TestFramework,
  options: QAOptions
): Promise<{ success: boolean; output: string }> {
  logger.info('Running smoke tests...');
  
  const { stdout } = await exec(
    'find . -type f -name "*.test.*" -o -name "*.spec.*" | grep -i smoke || true',
    { cwd: projectRoot }
  );

  const smokeFiles = stdout.trim().split('\n').filter(f => f.length > 0);

  if (smokeFiles.length === 0) {
    logger.warn('No smoke tests found. Running full test suite.');
    return runTests(projectRoot, framework, { ...options, mode: 'full' });
  }

  return runTests(projectRoot, framework, { ...options, mode: 'full' });
}

export async function main(): Promise<void> {
  const options = parseArgs();
  
  const projectRootFile = findUpFile(process.cwd(), 'package.json');
  if (!projectRootFile) {
    console.error('Error: No package.json found in current directory or parent directories');
    process.exit(1);
  }
  
  const root = path.dirname(projectRootFile);
  logger.info(`Project root: ${root}`);

  const framework = options.framework || detectFramework(root);
  
  if (framework === 'unknown') {
    console.error('Error: Could not detect test framework. Please specify with --framework=(vitest|jest|mocha)');
    process.exit(1);
  }

  logger.info(`Test framework: ${framework}`);
  logger.info(`Test mode: ${options.mode || 'targeted'}`);

  if (options.coverage) {
    logger.info('Coverage: enabled');
  }

  try {
    let result: { success: boolean; output: string };

    switch (options.mode) {
      case 'smoke':
        result = await runSmokeTests(root, framework, options);
        break;
      case 'full':
        result = await runTests(root, framework, { ...options, mode: 'full' });
        break;
      case 'targeted':
      default:
        result = await runTests(root, framework, options);
    }

    if (result.success) {
      console.log('\n✓ All tests passed');
      process.exit(0);
    } else {
      console.error('\n' + result.output);
      console.error('\n✗ Tests failed');
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`QA failed: ${message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}