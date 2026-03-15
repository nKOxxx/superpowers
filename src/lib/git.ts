import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { GitCommit } from '../types/index.js';

/**
 * Check if current directory is a git repository
 */
export function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if working directory is clean
 */
export function isWorkingDirectoryClean(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim() === '';
  } catch {
    return false;
  }
}

/**
 * Get current git branch
 */
export function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch {
    return 'main';
  }
}

/**
 * Get the last tag
 */
export function getLastTag(): string | null {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Get commits since last tag or from beginning
 */
export function getCommitsSinceLastTag(): GitCommit[] {
  const lastTag = getLastTag();
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  
  try {
    const output = execSync(
      `git log ${range} --pretty=format:"%H|%s|%ci"`,
      { encoding: 'utf-8' }
    );
    
    if (!output.trim()) return [];
    
    return output.trim().split('\n').map(line => {
      const [hash, message, date] = line.split('|');
      return { hash, message, date };
    });
  } catch {
    return [];
  }
}

/**
 * Get files changed in a git diff range
 */
export function getChangedFiles(range: string = 'HEAD~1'): string[] {
  try {
    const output = execSync(`git diff ${range} --name-only`, { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f);
  } catch {
    return [];
  }
}

/**
 * Create a git tag
 */
export function createTag(version: string): void {
  execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
}

/**
 * Push to remote
 */
export function pushToRemote(branch?: string): void {
  const b = branch || getCurrentBranch();
  execSync(`git push origin ${b}`, { stdio: 'inherit' });
  execSync('git push --tags', { stdio: 'inherit' });
}

/**
 * Commit all changes
 */
export function commitAll(message: string): void {
  execSync('git add -A', { stdio: 'pipe' });
  execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
}

/**
 * Get repository owner/repo from git remote
 */
export function getRepoFromRemote(): string | null {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    // Handle both HTTPS and SSH formats
    const match = remote.match(/github\.com[:\/]([^/]+)\/([^/.]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Detect test framework
 */
export function detectTestFramework(): 'vitest' | 'jest' | 'mocha' | null {
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) return null;
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (deps.vitest) return 'vitest';
  if (deps.jest) return 'jest';
  if (deps.mocha) return 'mocha';
  
  return null;
}

/**
 * Map source files to test files
 */
export function mapToTestFiles(changedFiles: string[]): string[] {
  const testFiles = new Set<string>();
  
  for (const file of changedFiles) {
    // Skip test files themselves
    if (file.includes('.test.') || file.includes('.spec.')) {
      testFiles.add(file);
      continue;
    }
    
    // Map src files to test files
    if (file.startsWith('src/')) {
      // Try different patterns
      const patterns = [
        file.replace('src/', 'tests/').replace(/\.ts$/, '.test.ts'),
        file.replace('src/', 'test/').replace(/\.ts$/, '.test.ts'),
        file.replace(/\.ts$/, '.test.ts'),
        file.replace('src/', '__tests__/').replace(/\.ts$/, '.test.ts'),
      ];
      
      for (const pattern of patterns) {
        if (existsSync(pattern)) {
          testFiles.add(pattern);
          break;
        }
      }
    }
  }
  
  return Array.from(testFiles);
}
