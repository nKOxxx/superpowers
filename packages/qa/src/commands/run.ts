import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

interface RunOptions {
  mode: string;
  runner?: string;
  watch?: boolean;
  coverage?: boolean;
  updateSnapshots?: boolean;
  pattern?: string;
  bail?: boolean;
  verbose?: boolean;
  ci?: boolean;
  workers?: number;
  timeout?: number;
}

interface QaConfig {
  defaultRunner?: string;
  testDirs?: string[];
  testPatterns?: string[];
  coverageThreshold?: number;
  smokeTags?: string[];
  timeout?: number;
  workers?: number;
}

async function loadConfig(): Promise<QaConfig | null> {
  try {
    const content = await fs.readFile('.qa.config.json', 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function detectRunner(): Promise<string> {
  const files: string[] = await fs.readdir('.').catch(() => [] as string[]);
  
  if (files.includes('vitest.config.ts') || files.includes('vitest.config.js')) return 'vitest';
  if (files.includes('jest.config.js') || files.includes('jest.config.ts')) return 'jest';
  if (files.includes('playwright.config.ts') || files.includes('playwright.config.js')) return 'playwright';
  
  const pkg = await fs.readFile('package.json', 'utf-8')
    .then(c => JSON.parse(c))
    .catch(() => ({}));
  
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.vitest) return 'vitest';
  if (deps.jest) return 'jest';
  if (deps['@playwright/test']) return 'playwright';
  if (deps.mocha) return 'mocha';
  
  return 'vitest'; // default
}

function buildCommand(runner: string, options: RunOptions, config: QaConfig | null): string {
  const args: string[] = [];
  
  switch (runner) {
    case 'vitest':
      if (options.mode === 'smoke') {
        const tags = config?.smokeTags?.join('|') || 'smoke|critical';
        args.push(`--testNamePattern="${tags}"`);
      }
      if (options.coverage) args.push('--coverage');
      if (options.watch) args.push('--watch');
      if (options.bail) args.push('--bail 1');
      if (options.pattern) args.push(`--testNamePattern="${options.pattern}"`);
      if (options.workers) args.push(`--poolOptions.threads.singleThread`);
      return `npx vitest run ${args.join(' ')}`;
      
    case 'jest':
      if (options.mode === 'smoke') {
        const tags = config?.smokeTags?.join('|') || 'smoke|critical';
        args.push(`--testNamePattern="${tags}"`);
      }
      if (options.coverage) args.push('--coverage');
      if (options.watch) args.push('--watch');
      if (options.bail) args.push('--bail');
      if (options.pattern) args.push(`--testNamePattern="${options.pattern}"`);
      if (options.workers) args.push(`--maxWorkers=${options.workers}`);
      return `npx jest ${args.join(' ')}`;
      
    case 'playwright':
      if (options.mode === 'smoke') {
        args.push('--grep="@smoke|@critical"');
      }
      if (options.pattern) args.push(`--grep="${options.pattern}"`);
      return `npx playwright test ${args.join(' ')}`;
      
    case 'mocha':
      if (options.pattern) args.push(`--grep "${options.pattern}"`);
      if (options.bail) args.push('--bail');
      return `npx mocha ${args.join(' ')}`;
      
    default:
      throw new Error(`Unknown runner: ${runner}`);
  }
}

export async function run(options: RunOptions): Promise<void> {
  console.log(chalk.blue('🧪 Running tests...'));
  console.log(chalk.gray(`Mode: ${options.mode}`));
  
  const config = await loadConfig();
  const runner = options.runner || config?.defaultRunner || await detectRunner();
  
  console.log(chalk.gray(`Runner: ${runner}`));
  
  if (options.mode === 'targeted') {
    console.log(chalk.yellow('Targeted mode: analyzing changed files...'));
    try {
      const changedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' })
        .split('\n')
        .filter(f => f.trim());
      console.log(chalk.gray(`Changed files: ${changedFiles.length}`));
    } catch {
      console.log(chalk.yellow('Could not detect changed files, running all tests'));
    }
  }
  
  const command = buildCommand(runner, options, config);
  console.log(chalk.gray(`Command: ${command}`));
  
  const child = spawn(command, {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      TEST_TIMEOUT: options.timeout?.toString() || config?.timeout?.toString(),
    },
  });
  
  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✓ Tests passed'));
        resolve();
      } else {
        reject(new Error(`Tests failed with code ${code}`));
      }
    });
  });
}
