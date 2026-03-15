#!/usr/bin/env node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Parse conventional commits
function parseCommits(log) {
    const commits = [];
    const lines = log.split('\n');
    const validTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'security'];
    for (const line of lines) {
        const match = line.match(/^([a-f0-9]+)\s+(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
        if (match) {
            const [, sha, type, scope, message] = match;
            commits.push({
                type: validTypes.includes(type) ? type : 'other',
                scope,
                message,
                sha
            });
        }
    }
    return commits;
}
// Group commits by type
function groupCommits(commits) {
    const changes = {
        feat: [],
        fix: [],
        docs: [],
        style: [],
        refactor: [],
        perf: [],
        test: [],
        chore: [],
        revert: [],
        security: []
    };
    for (const commit of commits) {
        if (commit.type === 'other')
            continue;
        const entry = commit.scope
            ? `**${commit.scope}:** ${commit.message}`
            : commit.message;
        changes[commit.type].push(entry);
    }
    return changes;
}
// Generate changelog entry
function generateChangelogEntry(version, changes, date) {
    let entry = `## [${version}] - ${date}\n\n`;
    const sections = [
        { key: 'feat', title: '### Added' },
        { key: 'fix', title: '### Fixed' },
        { key: 'refactor', title: '### Changed' },
        { key: 'perf', title: '### Performance' },
        { key: 'security', title: '### Security' },
        { key: 'docs', title: '### Documentation' },
        { key: 'revert', title: '### Reverted' },
        { key: 'chore', title: '### Chore' },
        { key: 'style', title: '### Styled' },
        { key: 'test', title: '### Tests' }
    ];
    for (const { key, title } of sections) {
        if (changes[key].length > 0) {
            entry += `${title}\n`;
            for (const item of changes[key]) {
                entry += `- ${item}\n`;
            }
            entry += '\n';
        }
    }
    return entry;
}
// Bump version
function bumpVersion(current, type, prerelease) {
    const parts = current.split('-')[0].split('.').map(n => parseInt(n, 10));
    const [major, minor, patch] = parts;
    let newVersion;
    if (type === 'major') {
        newVersion = `${major + 1}.0.0`;
    }
    else if (type === 'minor') {
        newVersion = `${major}.${minor + 1}.0`;
    }
    else if (type === 'patch') {
        newVersion = `${major}.${minor}.${patch + 1}`;
    }
    else if (/^\d+\.\d+\.\d+/.test(type)) {
        // Specific version provided
        newVersion = type;
    }
    else {
        newVersion = `${major}.${minor}.${patch + 1}`;
    }
    if (prerelease) {
        newVersion += `-${prerelease}.1`;
    }
    return newVersion;
}
// Execute git command
function git(command, cwd) {
    return execSync(`git ${command}`, { cwd, encoding: 'utf-8' }).trim();
}
// Get current version from package.json
function getCurrentVersion(cwd) {
    const packagePath = path.join(cwd, 'package.json');
    if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        return pkg.version || '0.0.0';
    }
    return '0.0.0';
}
// Update package.json version
function updatePackageVersion(cwd, version) {
    const packagePath = path.join(cwd, 'package.json');
    if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        pkg.version = version;
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    }
}
// Update changelog file
function updateChangelog(cwd, entry) {
    const changelogPath = path.join(cwd, 'CHANGELOG.md');
    let content = '';
    if (fs.existsSync(changelogPath)) {
        content = fs.readFileSync(changelogPath, 'utf-8');
    }
    else {
        content = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }
    // Insert after header
    const headerEnd = content.indexOf('\n\n') + 2;
    const newContent = content.slice(0, headerEnd) + entry + content.slice(headerEnd);
    fs.writeFileSync(changelogPath, newContent);
}
// Get repository info from git
function getRepoInfo(cwd) {
    try {
        const remote = git('remote get-url origin', cwd);
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (match) {
            return { owner: match[1], repo: match[2] };
        }
    }
    catch {
        // Ignore
    }
    return null;
}
// Create GitHub release
async function createGitHubRelease(owner, repo, tag, name, body, isPrerelease, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            tag_name: tag,
            name,
            body,
            draft: false,
            prerelease: isPrerelease
        });
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/releases`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'OpenClaw-Ship-Skill',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    if (json.html_url) {
                        resolve(json.html_url);
                    }
                    else {
                        reject(new Error(json.message || 'Failed to create release'));
                    }
                }
                catch {
                    reject(new Error('Invalid response from GitHub'));
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
// Main ship function
export async function ship(options, cwd = process.cwd()) {
    // Check git status
    if (!options.skipCleanCheck && !options.dryRun) {
        try {
            const status = git('status --porcelain', cwd);
            if (status) {
                throw new Error('Working directory is not clean. Commit or stash changes first.');
            }
        }
        catch (e) {
            if (!e.message.includes('not a git repository')) {
                throw e;
            }
        }
    }
    // Get current version
    const currentVersion = getCurrentVersion(cwd);
    const newVersion = bumpVersion(currentVersion, options.version, options.prerelease);
    const tagPrefix = 'v';
    const tag = `${tagPrefix}${newVersion}`;
    // Get commits since last tag
    let commits = [];
    try {
        const lastTag = git('describe --tags --abbrev=0', cwd);
        const log = git(`log ${lastTag}..HEAD --pretty=format:"%h %s"`, cwd);
        commits = parseCommits(log);
    }
    catch {
        // No previous tag, get all commits
        try {
            const log = git('log --pretty=format:"%h %s"', cwd);
            commits = parseCommits(log);
        }
        catch {
            // No commits
        }
    }
    const changes = groupCommits(commits);
    const date = new Date().toISOString().split('T')[0];
    const changelogEntry = generateChangelogEntry(newVersion, changes, date);
    // Count files changed
    let filesChanged = 0;
    try {
        const diffStat = git('diff --stat HEAD~1 HEAD', cwd);
        const match = diffStat.match(/(\d+) files? changed/);
        if (match)
            filesChanged = parseInt(match[1], 10);
    }
    catch {
        // Ignore
    }
    // Dry run - return early
    if (options.dryRun) {
        return {
            version: newVersion,
            previousVersion: currentVersion,
            tag,
            changes,
            commits: commits.length,
            filesChanged,
            dryRun: true
        };
    }
    // Update files
    if (!options.changelogOnly) {
        updatePackageVersion(cwd, newVersion);
    }
    updateChangelog(cwd, changelogEntry);
    if (options.changelogOnly) {
        return {
            version: newVersion,
            previousVersion: currentVersion,
            tag,
            changes,
            commits: commits.length,
            filesChanged,
            dryRun: false
        };
    }
    // Git operations
    try {
        git('add -A', cwd);
        git(`commit -m "chore(release): ${tag}" --no-verify`, cwd);
        git(`tag -a ${tag} -m "Release ${newVersion}"`, cwd);
        if (options.push) {
            const defaultBranch = git('rev-parse --abbrev-ref HEAD', cwd);
            git(`push origin ${defaultBranch}`, cwd);
            git(`push origin ${tag}`, cwd);
        }
    }
    catch (e) {
        throw new Error(`Git operation failed: ${e.message}`);
    }
    // Create GitHub release
    let releaseUrl;
    if (options.release && options.push) {
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        const repoInfo = options.repo
            ? { owner: options.repo.split('/')[0], repo: options.repo.split('/')[1] }
            : getRepoInfo(cwd);
        if (token && repoInfo) {
            try {
                releaseUrl = await createGitHubRelease(repoInfo.owner, repoInfo.repo, tag, `Release ${newVersion}`, changelogEntry, !!options.prerelease, token);
            }
            catch (err) {
                console.error('Failed to create GitHub release:', err.message);
            }
        }
    }
    return {
        version: newVersion,
        previousVersion: currentVersion,
        tag,
        changes,
        commits: commits.length,
        filesChanged,
        releaseUrl,
        dryRun: false
    };
}
// Format result
function formatResult(result) {
    if (result.dryRun) {
        let message = `[DRY RUN] Would release ${result.tag}\n\n`;
        message += `Version: ${result.version} (from ${result.previousVersion})\n`;
        message += `Commits: ${result.commits}\n\n`;
        const changelogEntry = generateChangelogEntry(result.version, result.changes, new Date().toISOString().split('T')[0]);
        message += changelogEntry;
        return message;
    }
    let message = `🚀 Released ${result.tag}\n\n`;
    message += `Version: ${result.version} (was ${result.previousVersion})\n`;
    message += `Commits: ${result.commits}\n\n`;
    const changelogEntry = generateChangelogEntry(result.version, result.changes, new Date().toISOString().split('T')[0]);
    message += changelogEntry;
    if (result.releaseUrl) {
        message += `\nGitHub Release: ${result.releaseUrl}\n`;
    }
    return message;
}
// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {
        version: 'patch',
        dryRun: false,
        push: true,
        release: true,
        changelogOnly: false,
        skipCleanCheck: false
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            switch (key) {
                case 'version':
                case 'v':
                    options.version = value || args[++i];
                    break;
                case 'repo':
                case 'r':
                    options.repo = value || args[++i];
                    break;
                case 'dry-run':
                case 'd':
                    options.dryRun = true;
                    break;
                case 'no-push':
                    options.push = false;
                    break;
                case 'no-release':
                    options.release = false;
                    break;
                case 'changelog-only':
                    options.changelogOnly = true;
                    break;
                case 'prerelease':
                case 'p':
                    options.prerelease = value || args[++i];
                    break;
                case 'skip-clean-check':
                    options.skipCleanCheck = true;
                    break;
            }
        }
    }
    if (!options.version) {
        console.error(`
Usage: ship [options]

Options:
  -v, --version <type>      Version bump: patch, minor, major, or explicit (e.g., 1.2.3)
  -r, --repo <owner/repo>   GitHub repository (auto-detected if not specified)
  -d, --dry-run             Preview changes without executing
  --no-push                 Don't push to remote
  --no-release              Don't create GitHub release
  --changelog-only          Only update changelog
  -p, --prerelease <tag>    Create prerelease (e.g., alpha, beta)
  --skip-clean-check        Skip working directory clean check

Examples:
  ship                      # Release patch version
  ship --version=minor      # Release minor version
  ship --version=1.2.3      # Release specific version
  ship --dry-run            # Preview changes
`);
        process.exit(1);
    }
    ship(options).then(result => {
        console.log(formatResult(result));
        process.exit(0);
    }).catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map