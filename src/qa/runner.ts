import { execSync, spawn } from 'child_process';
import { readFile, readdir, writeFile } from 'fs/promises';
import { accessSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileExists, log, readJson, writeJson } from '../shared/utils.js';
import { QaConfig } from '../shared/types.js';

const DEFAULT_CONFIG: QaConfig = {
  defaultRunner: 'vitest',
  testDirs: ['src', 'tests', '__tests__'],
  testPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
  coverageThreshold: 80,
  smokeTags: ['smoke', 'critical', 'sanity'],
  exclude: ['node_modules/**', 'dist/**', '.git/**'],
  timeout: 30000,
  workers: 4
};

const CONFIG_PATH = '.qa.config.json';

export async function getConfig(): Promise<QaConfig> {
  const saved = await readJson<QaConfig>(CONFIG_PATH);
  return { ...DEFAULT_CONFIG, ...saved };
}

export async function initConfig(): Promise<void> {
  await writeJson(CONFIG_PATH, DEFAULT_CONFIG);
  log(`Config initialized: ${CONFIG_PATH}`, 'success');
}

export async function showConfig(): Promise<void> {
  const config = await getConfig();
  console.log(JSON.stringify(config, null, 2));
}

export async function setConfig(key: keyof QaConfig, value: unknown): Promise<void> {
  const config = await getConfig();
  (config as Record<string, unknown>)[key] = value;
  await writeJson(CONFIG_PATH, config);
  log(`Set ${key} = ${value}`, 'success');
}

export function detectRunner(): string {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    if (pkg.devDependencies?.vitest) return 'vitest';
    if (pkg.devDependencies?.jest) return 'jest';
    if (pkg.devDependencies?.playwright) return 'playwright';
    if (pkg.devDependencies?.mocha) return 'mocha';
  } catch {}
  
  // Check for config files synchronously
  try {
    accessSync('vitest.config.ts');
    return 'vitest';
  } catch {}
  try {
    accessSync('vitest.config.js');
    return 'vitest';
  } catch {}
  try {
    accessSync('jest.config.js');
    return 'jest';
  } catch {}
  try {
    accessSync('jest.config.ts');
    return 'jest';
  } catch {}
  try {
    accessSync('playwright.config.ts');
    return 'playwright';
  } catch {}
  try {
    accessSync('playwright.config.js');
    return 'playwright';
  } catch {}
  
  return 'node';
}

import { readFileSync } from 'fs';

export async function getChangedFiles(): Promise<string[]> {
  try {
    const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

export async function findRelatedTests(changedFiles: string[], config: QaConfig): Promise<string[]> {
  const testFiles: string[] = [];
  
  for (const file of changedFiles) {
    if (config.testPatterns?.some(pattern => file.match(pattern))) {
      testFiles.push(file);
      continue;
    }
    
    const baseName = file.replace(/\.(ts|js|tsx|jsx)$/, '');
    const possibleTests = [
      `${baseName}.test.ts`,
      `${baseName}.test.js`,
      `${baseName}.spec.ts`,
      `${baseName}.spec.js`,
      join(dirname(file), `__tests__/${baseName.split('/').pop()}.test.ts`),
      join(dirname(file), `${baseName.split('/').pop()}.test.ts`)
    ];
    
    for (const testPath of possibleTests) {
      if (await fileExists(testPath)) {
        testFiles.push(testPath);
      }
    }
  }
  
  return [...new Set(testFiles)];
}

export async function analyzeChanges(): Promise<{
  riskScore: number;
  riskFactors: string[];
  changedFiles: string[];
  affectedTests: string[];
  recommendation: string;
}> {
  const config = await getConfig();
  const changedFiles = await getChangedFiles();
  const affectedTests = await findRelatedTests(changedFiles, config);
  
  const riskFactors: string[] = [];
  let riskScore = 0;
  
  // Files changed
  const fileImpact = Math.min(changedFiles.length * 5, 30);
  riskScore += fileImpact;
  if (changedFiles.length > 5) {
    riskFactors.push(`${changedFiles.length} files changed`);
  }
  
  // Core files
  const coreFiles = changedFiles.filter(f => 
    f.includes('src/core') || 
    f.includes('src/shared') || 
    f.includes('src/utils')
  );
  if (coreFiles.length > 0) {
    riskScore += 20;
    riskFactors.push('Core/shared files modified');
  }
  
  // Untested files
  const untestedFiles = changedFiles.filter(f => !affectedTests.some(t => t.includes(f.replace(/\.[^.]+$/, ''))));
  if (untestedFiles.length > 0) {
    riskScore += 15;
    riskFactors.push('Files without tests modified');
  }
  
  // No test updates
  const testChanges = changedFiles.filter(f => 
    config.testPatterns?.some(pattern => f.match(pattern))
  );
  if (testChanges.length === 0 && changedFiles.some(f => !config.testPatterns?.some(pattern => f.match(pattern)))) {
    riskScore += 10;
    riskFactors.push('No tests modified with code changes');
  }
  
  let recommendation: string;
  if (riskScore <= 30) {
    recommendation = 'qa run --mode=targeted';
  } else if (riskScore <= 60) {
    recommendation = 'qa run --mode=smoke';
  } else {
    recommendation = 'qa run --mode=full';
  }
  
  return {
    riskScore: Math.min(riskScore, 100),
    riskFactors,
    changedFiles,
    affectedTests,
    recommendation
  };
}

export interface RunOptions {
  mode?: 'targeted' | 'smoke' | 'full';
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

export async function runTests(options: RunOptions = {}): Promise<boolean> {
  const config = await getConfig();
  const runner = options.runner || config.defaultRunner || detectRunner();
  const mode = options.mode || 'targeted';
  
  log(`Running tests in ${mode} mode with ${runner}...`);
  
  let command: string;
  let args: string[] = [];
  
  switch (runner) {
    case 'vitest':
      command = 'npx vitest';
      args = ['run'];
      if (mode === 'targeted') {
        const changedFiles = await getChangedFiles();
        const relatedTests = await findRelatedTests(changedFiles, config);
        if (relatedTests.length > 0) {
          args.push(...relatedTests);
        }
      }
      if (options.coverage) args.push('--coverage');
      if (options.watch) args.push('--watch');
      if (options.pattern) args.push('-t', options.pattern);
      if (options.bail) args.push('--bail');
      break;
      
    case 'jest':
      command = 'npx jest';
      if (mode === 'targeted') {
        const changedFiles = await getChangedFiles();
        args.push('--findRelatedTests', ...changedFiles);
      }
      if (options.coverage) args.push('--coverage');
      if (options.watch) args.push('--watch');
      if (options.updateSnapshots) args.push('--updateSnapshot');
      if (options.pattern) args.push('--testNamePattern', options.pattern);
      if (options.bail) args.push('--bail');
      break;
      
    case 'playwright':
      command = 'npx playwright';
      args = ['test'];
      if (mode === 'smoke') args.push('--grep', '@smoke|@critical');
      if (options.pattern) args.push('--grep', options.pattern);
      break;
      
    case 'mocha':
      command = 'npx mocha';
      if (mode === 'smoke') {
        args.push('--grep', 'smoke|critical');
      }
      break;
      
    default:
      command = 'node';
      args = ['--test'];
  }
  
  if (options.ci) {
    process.env.CI = 'true';
  }
  
  try {
    const result = spawn(command.split(' ')[0], [...command.split(' ').slice(1), ...args], {
      stdio: 'inherit',
      shell: true
    });
    
    return new Promise((resolve) => {
      result.on('close', (code) => {
        resolve(code === 0);
      });
    });
  } catch (err) {
    log(`Test run failed: ${err}`, 'error');
    return false;
  }
}

export async function printAnalysis(): Promise<void> {
  const analysis = await analyzeChanges();
  
  console.log('\n🔍 Analyzing code changes...\n');
  
  const scoreEmoji = analysis.riskScore > 60 ? '🔴' : analysis.riskScore > 30 ? '🟡' : '🟢';
  console.log(`${scoreEmoji} Risk Score: ${analysis.riskScore}/100\n`);
  
  if (analysis.riskFactors.length > 0) {
    console.log('Risk Factors:');
    for (const factor of analysis.riskFactors) {
      console.log(`  • ${factor}`);
    }
    console.log('');
  }
  
  console.log('Changed Files:');
  for (const file of analysis.changedFiles.slice(0, 10)) {
    console.log(`  • ${file}`);
  }
  if (analysis.changedFiles.length > 10) {
    console.log(`  ... and ${analysis.changedFiles.length - 10} more`);
  }
  console.log('');
  
  if (analysis.affectedTests.length > 0) {
    console.log('Affected Tests:');
    for (const test of analysis.affectedTests) {
      console.log(`  ✓ ${test}`);
    }
    console.log('');
  }
  
  console.log(`Recommendation:`);
  console.log(`  Run: ${analysis.recommendation}\n`);
}
