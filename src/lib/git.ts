import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Check if we're in a git repository
 */
export function isGitRepo(cwd: string = process.cwd()): boolean {
  return existsSync(join(cwd, '.git'));
}

/**
 * Get current git branch
 */
export function getCurrentBranch(cwd: string = process.cwd()): string {
  try {
    return execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return 'main';
  }
}

/**
 * Check if working directory is clean
 */
export function isWorkingDirectoryClean(cwd: string = process.cwd()): boolean {
  try {
    const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
    return status === '';
  } catch {
    return false;
  }
}

/**
 * Get the latest git tag
 */
export function getLatestTag(cwd: string = process.cwd()): string | null {
  try {
    return execSync('git describe --tags --abbrev=0', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Get list of files changed since a commit/tag
 */
export function getChangedFiles(since: string = 'HEAD~1', cwd: string = process.cwd()): string[] {
  try {
    const output = execSync(`git diff --name-only ${since}`, { cwd, encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

/**
 * Get conventional commits since a tag
 */
export function getCommitsSince(tag: string | null, cwd: string = process.cwd()): string[] {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    const output = execSync(`git log ${range} --pretty=format:"%s"`, { cwd, encoding: 'utf-8' });
    return output.trim().split('\n').filter(c => c.length > 0);
  } catch {
    return [];
  }
}

/**
 * Create a git tag
 */
export function createTag(version: string, message: string, cwd: string = process.cwd()): void {
  execSync(`git tag -a v${version} -m "${message}"`, { cwd, stdio: 'inherit' });
}

/**
 * Push commits and tags
 */
export function pushToRemote(cwd: string = process.cwd()): void {
  execSync('git push && git push --tags', { cwd, stdio: 'inherit' });
}

/**
 * Create a commit
 */
export function createCommit(message: string, files: string[] = ['.'], cwd: string = process.cwd()): void {
  execSync(`git add ${files.join(' ')} && git commit -m "${message}"`, { cwd, stdio: 'inherit' });
}

/**
 * Run tests via npm/yarn/pnpm
 */
export async function runTests(command: string, cwd: string = process.cwd()): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn('sh', ['-c', command], {
      cwd,
      stdio: 'pipe',
    });

    let output = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      resolve({ success: code === 0, output });
    });
  });
}

/**
 * Get repository remote URL
 */
export function getRemoteUrl(cwd: string = process.cwd()): string | null {
  try {
    return execSync('git remote get-url origin', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Parse owner/repo from git remote URL
 */
export function parseRepoFromRemote(url: string): { owner: string; repo: string } | null {
  // Handle HTTPS: https://github.com/owner/repo.git
  // Handle SSH: git@github.com:owner/repo.git
  const match = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}
