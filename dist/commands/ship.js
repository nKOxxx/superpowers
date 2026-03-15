"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipCommand = shipCommand;
const fs_1 = require("fs");
const path_1 = require("path");
const picocolors_1 = __importDefault(require("picocolors"));
const config_js_1 = require("../lib/config.js");
const git_js_1 = require("../lib/git.js");
const github_js_1 = require("../lib/github.js");
const telegram_js_1 = require("../lib/telegram.js");
function shipCommand(program) {
    program
        .command('ship')
        .description('One-command release pipeline')
        .requiredOption('-v, --version <type>', 'Version: patch, minor, major, or explicit (e.g., 1.2.3)')
        .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
        .option('-d, --dry-run', 'Preview changes without executing')
        .option('-s, --skip-tests', 'Skip test run before release')
        .option('-n, --notes <text>', 'Custom release notes')
        .option('-p, --prerelease', 'Mark as prerelease')
        .action(async (options) => {
        try {
            await runShip(options);
        }
        catch (error) {
            console.error(picocolors_1.default.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    });
}
async function runShip(options) {
    const config = (0, config_js_1.mergeWithDefaults)((0, config_js_1.loadConfig)());
    const cwd = process.cwd();
    // Validate git repo
    if (!(0, git_js_1.isGitRepo)(cwd)) {
        throw new Error('Not a git repository');
    }
    // Check working directory
    if (config.ship.requireCleanWorkingDir && !(0, git_js_1.isWorkingDirectoryClean)(cwd)) {
        throw new Error('Working directory is not clean. Commit or stash changes first.');
    }
    console.log(picocolors_1.default.cyan('══════════════════════════════════════════════════'));
    console.log(picocolors_1.default.cyan('Release Pipeline'));
    console.log(picocolors_1.default.cyan('══════════════════════════════════════════════════'));
    console.log();
    // Get current version
    const packagePath = (0, path_1.join)(cwd, 'package.json');
    if (!(0, fs_1.existsSync)(packagePath)) {
        throw new Error('package.json not found');
    }
    const pkg = JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
    const currentVersion = pkg.version;
    const newVersion = calculateNewVersion(currentVersion, options.version);
    console.log(picocolors_1.default.blue(`Current version: ${currentVersion}`));
    console.log(picocolors_1.default.blue(`New version: ${newVersion}`));
    console.log();
    if (options.dryRun) {
        console.log(picocolors_1.default.yellow('DRY RUN - No changes will be made'));
        console.log();
    }
    // Run tests
    if (!options.skipTests && config.ship.runTestsBeforeRelease) {
        console.log(picocolors_1.default.blue('Running tests...'));
        const { success } = await (0, git_js_1.runTests)(config.qa.testCommand || 'npm test', cwd);
        if (!success) {
            throw new Error('Tests failed. Fix before releasing.');
        }
        console.log(picocolors_1.default.green('✓ Tests passed'));
        console.log();
    }
    // Get changelog
    const latestTag = (0, git_js_1.getLatestTag)(cwd);
    const commits = (0, git_js_1.getCommitsSince)(latestTag, cwd);
    const changelog = generateChangelog(commits);
    if (options.dryRun) {
        console.log(picocolors_1.default.cyan('Changelog:'));
        console.log(changelog || '  (no conventional commits found)');
        console.log();
        console.log(picocolors_1.default.yellow('Dry run complete. No changes made.'));
        return;
    }
    // Update version
    console.log(picocolors_1.default.blue('Updating version...'));
    pkg.version = newVersion;
    (0, fs_1.writeFileSync)(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(picocolors_1.default.green(`✓ Version updated to ${newVersion}`));
    console.log();
    // Update additional version files
    if (config.ship.versionFiles && config.ship.versionFiles.length > 0) {
        for (const versionFile of config.ship.versionFiles) {
            if (!versionFile)
                continue;
            const filePath = (0, path_1.resolve)(cwd, versionFile);
            if ((0, fs_1.existsSync)(filePath)) {
                let content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                // Replace version patterns
                content = content.replace(/version\s*=\s*['"][\d.]+['"]/, `version = '${newVersion}'`);
                content = content.replace(/VERSION\s*=\s*['"][\d.]+['"]/, `VERSION = '${newVersion}'`);
                content = content.replace(/version:\s*['"][\d.]+['"]/, `version: '${newVersion}'`);
                (0, fs_1.writeFileSync)(filePath, content);
                console.log(picocolors_1.default.green(`✓ Updated ${versionFile}`));
            }
        }
        console.log();
    }
    // Update changelog
    console.log(picocolors_1.default.blue('Generating changelog...'));
    await updateChangelog(config.ship.changelogPath || 'CHANGELOG.md', newVersion, changelog, options.notes);
    console.log(picocolors_1.default.green('✓ Changelog updated'));
    console.log();
    // Git operations
    console.log(picocolors_1.default.blue('Creating release commit...'));
    const { execSync } = require('child_process');
    execSync('git add -A', { cwd });
    execSync(`git commit -m "chore(release): v${newVersion}"`, { cwd });
    console.log(picocolors_1.default.green('✓ Commit created'));
    console.log();
    console.log(picocolors_1.default.blue('Creating git tag...'));
    execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { cwd });
    console.log(picocolors_1.default.green(`✓ Tag v${newVersion} created`));
    console.log();
    console.log(picocolors_1.default.blue('Pushing to remote...'));
    execSync('git push && git push --tags', { cwd, stdio: 'pipe' });
    console.log(picocolors_1.default.green('✓ Pushed to remote'));
    console.log();
    // Create GitHub release
    console.log(picocolors_1.default.blue('Creating GitHub release...'));
    const repoInfo = options.repo || (0, git_js_1.parseRepoFromRemote)((0, git_js_1.getRemoteUrl)(cwd) || '');
    if (repoInfo && typeof repoInfo !== 'string') {
        const releaseBody = options.notes || changelog || `Release v${newVersion}`;
        const { success, url, error } = await (0, github_js_1.createRelease)(repoInfo.owner, repoInfo.repo, {
            tag_name: `v${newVersion}`,
            name: `v${newVersion}`,
            body: releaseBody,
            prerelease: options.prerelease || false,
        });
        if (success) {
            console.log(picocolors_1.default.green('✓ GitHub release created'));
            if (url) {
                console.log(picocolors_1.default.blue(`  ${url}`));
            }
        }
        else {
            console.warn(picocolors_1.default.yellow(`Warning: Failed to create GitHub release: ${error}`));
        }
    }
    else if (options.repo) {
        const [owner, repo] = options.repo.split('/');
        if (owner && repo) {
            const releaseBody = options.notes || changelog || `Release v${newVersion}`;
            const { success, url, error } = await (0, github_js_1.createRelease)(owner, repo, {
                tag_name: `v${newVersion}`,
                name: `v${newVersion}`,
                body: releaseBody,
                prerelease: options.prerelease || false,
            });
            if (success) {
                console.log(picocolors_1.default.green('✓ GitHub release created'));
                if (url) {
                    console.log(picocolors_1.default.blue(`  ${url}`));
                }
            }
            else {
                console.warn(picocolors_1.default.yellow(`Warning: Failed to create GitHub release: ${error}`));
            }
        }
    }
    else {
        console.warn(picocolors_1.default.yellow('Warning: Could not detect repository. Skipping GitHub release.'));
    }
    console.log();
    // Telegram notification
    const telegramMessage = (0, telegram_js_1.formatReleaseMessage)(pkg.name || 'unknown', newVersion, changelog);
    const { success: telegramSuccess, error: telegramError } = await (0, telegram_js_1.sendTelegramMessage)(telegramMessage);
    if (telegramSuccess) {
        console.log(picocolors_1.default.green('✓ Telegram notification sent'));
    }
    else if (telegramError?.includes('Missing')) {
        // Silently skip if no telegram config
    }
    else if (telegramError) {
        console.warn(picocolors_1.default.yellow(`Warning: Failed to send Telegram notification: ${telegramError}`));
    }
    console.log();
    console.log(picocolors_1.default.cyan('══════════════════════════════════════════════════'));
    console.log(picocolors_1.default.green(`✓ Released ${newVersion}`));
    console.log(picocolors_1.default.cyan('══════════════════════════════════════════════════'));
}
function calculateNewVersion(current, bump) {
    // If explicit version provided
    if (/^\d+\.\d+\.\d+/.test(bump)) {
        return bump;
    }
    const parts = current.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        throw new Error(`Invalid current version: ${current}`);
    }
    const [major, minor, patch] = parts;
    switch (bump) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
        default:
            throw new Error(`Invalid version bump: ${bump}. Use patch, minor, major, or explicit version.`);
    }
}
function generateChangelog(commits) {
    if (commits.length === 0) {
        return '';
    }
    const entries = commits.map(msg => {
        const conventional = msg.match(/^(feat|fix|chore|docs|refactor|test)(?:\(([^)]+)\))?:\s*(.+)/);
        if (conventional) {
            return {
                type: conventional[1],
                scope: conventional[2],
                message: conventional[3],
            };
        }
        return { type: 'other', message: msg };
    });
    const sections = {
        feat: [],
        fix: [],
        chore: [],
        docs: [],
        refactor: [],
        test: [],
        other: [],
    };
    for (const entry of entries) {
        const scope = entry.scope ? `**${entry.scope}:** ` : '';
        sections[entry.type].push(`- ${scope}${entry.message}`);
    }
    const lines = [];
    if (sections.feat.length) {
        lines.push('### Features', ...sections.feat, '');
    }
    if (sections.fix.length) {
        lines.push('### Bug Fixes', ...sections.fix, '');
    }
    if (sections.docs.length) {
        lines.push('### Documentation', ...sections.docs, '');
    }
    if (sections.refactor.length) {
        lines.push('### Refactoring', ...sections.refactor, '');
    }
    if (sections.test.length) {
        lines.push('### Tests', ...sections.test, '');
    }
    if (sections.chore.length) {
        lines.push('### Chores', ...sections.chore, '');
    }
    if (sections.other.length) {
        lines.push('### Other Changes', ...sections.other, '');
    }
    return lines.join('\n');
}
async function updateChangelog(changelogPath, version, changelog, customNotes) {
    const fullPath = (0, path_1.resolve)(changelogPath);
    const date = new Date().toISOString().split('T')[0];
    const newEntry = [
        `## [${version}] - ${date}`,
        '',
        customNotes || changelog || '(No changes documented)',
        '',
    ].join('\n');
    if ((0, fs_1.existsSync)(fullPath)) {
        const existing = (0, fs_1.readFileSync)(fullPath, 'utf-8');
        // Insert after header
        const lines = existing.split('\n');
        const headerEnd = lines.findIndex(line => line.startsWith('## '));
        if (headerEnd === -1) {
            // No existing entries, append at end
            (0, fs_1.writeFileSync)(fullPath, `${existing}\n${newEntry}`);
        }
        else {
            // Insert before first entry
            const before = lines.slice(0, headerEnd).join('\n');
            const after = lines.slice(headerEnd).join('\n');
            (0, fs_1.writeFileSync)(fullPath, `${before}\n${newEntry}${after}`);
        }
    }
    else {
        // Create new changelog
        const content = [
            '# Changelog',
            '',
            'All notable changes to this project will be documented in this file.',
            '',
            newEntry,
        ].join('\n');
        (0, fs_1.writeFileSync)(fullPath, content);
    }
}
//# sourceMappingURL=ship.js.map