"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGitRepo = isGitRepo;
exports.getCurrentBranch = getCurrentBranch;
exports.isWorkingDirectoryClean = isWorkingDirectoryClean;
exports.getLatestTag = getLatestTag;
exports.getChangedFiles = getChangedFiles;
exports.getCommitsSince = getCommitsSince;
exports.createTag = createTag;
exports.pushToRemote = pushToRemote;
exports.createCommit = createCommit;
exports.runTests = runTests;
exports.getRemoteUrl = getRemoteUrl;
exports.parseRepoFromRemote = parseRepoFromRemote;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Check if we're in a git repository
 */
function isGitRepo(cwd = process.cwd()) {
    return (0, fs_1.existsSync)((0, path_1.join)(cwd, '.git'));
}
/**
 * Get current git branch
 */
function getCurrentBranch(cwd = process.cwd()) {
    try {
        return (0, child_process_1.execSync)('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
    }
    catch {
        return 'main';
    }
}
/**
 * Check if working directory is clean
 */
function isWorkingDirectoryClean(cwd = process.cwd()) {
    try {
        const status = (0, child_process_1.execSync)('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
        return status === '';
    }
    catch {
        return false;
    }
}
/**
 * Get the latest git tag
 */
function getLatestTag(cwd = process.cwd()) {
    try {
        return (0, child_process_1.execSync)('git describe --tags --abbrev=0', { cwd, encoding: 'utf-8' }).trim();
    }
    catch {
        return null;
    }
}
/**
 * Get list of files changed since a commit/tag
 */
function getChangedFiles(since = 'HEAD~1', cwd = process.cwd()) {
    try {
        const output = (0, child_process_1.execSync)(`git diff --name-only ${since}`, { cwd, encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch {
        return [];
    }
}
/**
 * Get conventional commits since a tag
 */
function getCommitsSince(tag, cwd = process.cwd()) {
    try {
        const range = tag ? `${tag}..HEAD` : 'HEAD';
        const output = (0, child_process_1.execSync)(`git log ${range} --pretty=format:"%s"`, { cwd, encoding: 'utf-8' });
        return output.trim().split('\n').filter(c => c.length > 0);
    }
    catch {
        return [];
    }
}
/**
 * Create a git tag
 */
function createTag(version, message, cwd = process.cwd()) {
    (0, child_process_1.execSync)(`git tag -a v${version} -m "${message}"`, { cwd, stdio: 'inherit' });
}
/**
 * Push commits and tags
 */
function pushToRemote(cwd = process.cwd()) {
    (0, child_process_1.execSync)('git push && git push --tags', { cwd, stdio: 'inherit' });
}
/**
 * Create a commit
 */
function createCommit(message, files = ['.'], cwd = process.cwd()) {
    (0, child_process_1.execSync)(`git add ${files.join(' ')} && git commit -m "${message}"`, { cwd, stdio: 'inherit' });
}
/**
 * Run tests via npm/yarn/pnpm
 */
async function runTests(command, cwd = process.cwd()) {
    return new Promise((resolve) => {
        const child = (0, child_process_1.spawn)('sh', ['-c', command], {
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
function getRemoteUrl(cwd = process.cwd()) {
    try {
        return (0, child_process_1.execSync)('git remote get-url origin', { cwd, encoding: 'utf-8' }).trim();
    }
    catch {
        return null;
    }
}
/**
 * Parse owner/repo from git remote URL
 */
function parseRepoFromRemote(url) {
    // Handle HTTPS: https://github.com/owner/repo.git
    // Handle SSH: git@github.com:owner/repo.git
    const match = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    return null;
}
//# sourceMappingURL=git.js.map