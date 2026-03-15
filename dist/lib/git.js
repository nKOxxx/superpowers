"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGitRepo = isGitRepo;
exports.isWorkingDirectoryClean = isWorkingDirectoryClean;
exports.getCurrentBranch = getCurrentBranch;
exports.getLastTag = getLastTag;
exports.getCommitsSinceLastTag = getCommitsSinceLastTag;
exports.getChangedFiles = getChangedFiles;
exports.createTag = createTag;
exports.pushToRemote = pushToRemote;
exports.commitAll = commitAll;
exports.getRepoFromRemote = getRepoFromRemote;
exports.detectTestFramework = detectTestFramework;
exports.mapToTestFiles = mapToTestFiles;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Check if current directory is a git repository
 */
function isGitRepo() {
    try {
        (0, child_process_1.execSync)('git rev-parse --git-dir', { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if working directory is clean
 */
function isWorkingDirectoryClean() {
    try {
        const status = (0, child_process_1.execSync)('git status --porcelain', { encoding: 'utf-8' });
        return status.trim() === '';
    }
    catch {
        return false;
    }
}
/**
 * Get current git branch
 */
function getCurrentBranch() {
    try {
        return (0, child_process_1.execSync)('git branch --show-current', { encoding: 'utf-8' }).trim();
    }
    catch {
        return 'main';
    }
}
/**
 * Get the last tag
 */
function getLastTag() {
    try {
        return (0, child_process_1.execSync)('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    }
    catch {
        return null;
    }
}
/**
 * Get commits since last tag or from beginning
 */
function getCommitsSinceLastTag() {
    const lastTag = getLastTag();
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    try {
        const output = (0, child_process_1.execSync)(`git log ${range} --pretty=format:"%H|%s|%ci"`, { encoding: 'utf-8' });
        if (!output.trim())
            return [];
        return output.trim().split('\n').map(line => {
            const [hash, message, date] = line.split('|');
            return { hash, message, date };
        });
    }
    catch {
        return [];
    }
}
/**
 * Get files changed in a git diff range
 */
function getChangedFiles(range = 'HEAD~1') {
    try {
        const output = (0, child_process_1.execSync)(`git diff ${range} --name-only`, { encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f);
    }
    catch {
        return [];
    }
}
/**
 * Create a git tag
 */
function createTag(version) {
    (0, child_process_1.execSync)(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
}
/**
 * Push to remote
 */
function pushToRemote(branch) {
    const b = branch || getCurrentBranch();
    (0, child_process_1.execSync)(`git push origin ${b}`, { stdio: 'inherit' });
    (0, child_process_1.execSync)('git push --tags', { stdio: 'inherit' });
}
/**
 * Commit all changes
 */
function commitAll(message) {
    (0, child_process_1.execSync)('git add -A', { stdio: 'pipe' });
    (0, child_process_1.execSync)(`git commit -m "${message}"`, { stdio: 'inherit' });
}
/**
 * Get repository owner/repo from git remote
 */
function getRepoFromRemote() {
    try {
        const remote = (0, child_process_1.execSync)('git remote get-url origin', { encoding: 'utf-8' }).trim();
        // Handle both HTTPS and SSH formats
        const match = remote.match(/github\.com[:\/]([^/]+)\/([^/.]+)/);
        if (match) {
            return `${match[1]}/${match[2]}`;
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Detect test framework
 */
function detectTestFramework() {
    const packageJsonPath = (0, path_1.join)(process.cwd(), 'package.json');
    if (!(0, fs_1.existsSync)(packageJsonPath))
        return null;
    const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (deps.vitest)
        return 'vitest';
    if (deps.jest)
        return 'jest';
    if (deps.mocha)
        return 'mocha';
    return null;
}
/**
 * Map source files to test files
 */
function mapToTestFiles(changedFiles) {
    const testFiles = new Set();
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
                if ((0, fs_1.existsSync)(pattern)) {
                    testFiles.add(pattern);
                    break;
                }
            }
        }
    }
    return Array.from(testFiles);
}
//# sourceMappingURL=git.js.map