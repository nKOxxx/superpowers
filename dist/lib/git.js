"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitStatus = getGitStatus;
exports.getDiffFiles = getDiffFiles;
exports.getRecentCommits = getRecentCommits;
exports.getConventionalCommits = getConventionalCommits;
exports.createCommit = createCommit;
exports.createTag = createTag;
exports.pushToRemote = pushToRemote;
exports.getCurrentBranch = getCurrentBranch;
exports.getLastTag = getLastTag;
const child_process_1 = require("child_process");
function getGitStatus() {
    try {
        const statusOutput = (0, child_process_1.execSync)('git status --porcelain', { encoding: 'utf-8', cwd: process.cwd() });
        const lines = statusOutput.trim().split('\n').filter(Boolean);
        const modified = [];
        const staged = [];
        const untracked = [];
        for (const line of lines) {
            const status = line.slice(0, 2);
            const file = line.slice(3);
            if (status[0] !== ' ' && status[0] !== '?') {
                staged.push(file);
            }
            if (status[1] !== ' ') {
                modified.push(file);
            }
            if (status === '??') {
                untracked.push(file);
            }
        }
        return {
            isClean: lines.length === 0,
            modified,
            staged,
            untracked
        };
    }
    catch (error) {
        return {
            isClean: true,
            modified: [],
            staged: [],
            untracked: []
        };
    }
}
function getDiffFiles(ref = 'HEAD~1') {
    try {
        const output = (0, child_process_1.execSync)(`git diff --name-only ${ref}`, {
            encoding: 'utf-8',
            cwd: process.cwd()
        });
        return output.trim().split('\n').filter(Boolean);
    }
    catch (error) {
        return [];
    }
}
function getRecentCommits(count = 10) {
    try {
        const format = '%H|%s|%an|%ad';
        const output = (0, child_process_1.execSync)(`git log -${count} --pretty=format:"${format}" --date=short`, { encoding: 'utf-8', cwd: process.cwd() });
        return output.trim().split('\n').map(line => {
            const [hash, message, author, date] = line.split('|');
            return { hash, message, author, date };
        });
    }
    catch (error) {
        return [];
    }
}
function getConventionalCommits(sinceTag) {
    try {
        const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD~20..HEAD';
        const output = (0, child_process_1.execSync)(`git log ${range} --pretty=format:"%s"`, { encoding: 'utf-8', cwd: process.cwd() });
        const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/;
        return output
            .trim()
            .split('\n')
            .filter(msg => conventionalRegex.test(msg))
            .map(msg => {
            const match = msg.match(conventionalRegex);
            if (match) {
                return {
                    type: match[1],
                    scope: match[2],
                    message: match[3]
                };
            }
            return { type: 'other', message: msg };
        });
    }
    catch (error) {
        return [];
    }
}
async function createCommit(message) {
    (0, child_process_1.execSync)('git add -A', { cwd: process.cwd() });
    (0, child_process_1.execSync)(`git commit -m "${message}"`, { cwd: process.cwd() });
}
async function createTag(version) {
    (0, child_process_1.execSync)(`git tag -a v${version} -m "Release v${version}"`, { cwd: process.cwd() });
}
async function pushToRemote(includeTags = false) {
    (0, child_process_1.execSync)('git push', { cwd: process.cwd() });
    if (includeTags) {
        (0, child_process_1.execSync)('git push --tags', { cwd: process.cwd() });
    }
}
function getCurrentBranch() {
    try {
        return (0, child_process_1.execSync)('git branch --show-current', {
            encoding: 'utf-8',
            cwd: process.cwd()
        }).trim();
    }
    catch (error) {
        return 'main';
    }
}
function getLastTag() {
    try {
        return (0, child_process_1.execSync)('git describe --tags --abbrev=0', {
            encoding: 'utf-8',
            cwd: process.cwd()
        }).trim();
    }
    catch (error) {
        return undefined;
    }
}
//# sourceMappingURL=git.js.map