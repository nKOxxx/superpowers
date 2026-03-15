import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
/**
 * Check if we're in a git repository
 */
export function isGitRepo(cwd = process.cwd()) {
    return existsSync(join(cwd, '.git'));
}
/**
 * Get current git branch
 */
export function getCurrentBranch(cwd = process.cwd()) {
    try {
        return execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
    }
    catch {
        return 'main';
    }
}
/**
 * Check if working directory is clean
 */
export function isWorkingDirectoryClean(cwd = process.cwd()) {
    try {
        const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
        return status === '';
    }
    catch {
        return false;
    }
}
/**
 * Get the latest git tag
 */
export function getLatestTag(cwd = process.cwd()) {
    try {
        return execSync('git describe --tags --abbrev=0', { cwd, encoding: 'utf-8' }).trim();
    }
    catch {
        return null;
    }
}
/**
 * Get list of files changed since a commit/tag
 */
export function getChangedFiles(since = 'HEAD~1', cwd = process.cwd()) {
    try {
        const output = execSync(`git diff --name-only ${since}`, { cwd, encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch {
        return [];
    }
}
/**
 * Get conventional commits since a tag
 */
export function getCommitsSince(tag, cwd = process.cwd()) {
    try {
        const range = tag ? `${tag}..HEAD` : 'HEAD';
        const output = execSync(`git log ${range} --pretty=format:"%s"`, { cwd, encoding: 'utf-8' });
        return output.trim().split('\n').filter(c => c.length > 0);
    }
    catch {
        return [];
    }
}
/**
 * Create a git tag
 */
export function createTag(version, message, cwd = process.cwd()) {
    execSync(`git tag -a v${version} -m "${message}"`, { cwd, stdio: 'inherit' });
}
/**
 * Push commits and tags
 */
export function pushToRemote(cwd = process.cwd()) {
    execSync('git push && git push --tags', { cwd, stdio: 'inherit' });
}
/**
 * Create a commit
 */
export function createCommit(message, files = ['.'], cwd = process.cwd()) {
    execSync(`git add ${files.join(' ')} && git commit -m "${message}"`, { cwd, stdio: 'inherit' });
}
/**
 * Run tests via npm/yarn/pnpm
 */
export async function runTests(command, cwd = process.cwd()) {
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
export function getRemoteUrl(cwd = process.cwd()) {
    try {
        return execSync('git remote get-url origin', { cwd, encoding: 'utf-8' }).trim();
    }
    catch {
        return null;
    }
}
/**
 * Parse owner/repo from git remote URL
 */
export function parseRepoFromRemote(url) {
    // Handle HTTPS: https://github.com/owner/repo.git
    // Handle SSH: git@github.com:owner/repo.git
    const match = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    return null;
}
