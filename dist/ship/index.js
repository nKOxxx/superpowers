"use strict";
/**
 * Ship Skill - One-command release pipeline
 *
 * Usage: /ship [--version=patch|minor|major|<semver>] [--dry-run] [--skip-tests]
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipSkill = void 0;
exports.run = run;
const fs_1 = require("fs");
const path_1 = require("path");
const utils_js_1 = require("../utils.js");
class ShipSkill {
    cwd;
    pkg;
    pkgPath;
    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
        this.pkgPath = (0, path_1.join)(cwd, 'package.json');
        this.pkg = (0, fs_1.existsSync)(this.pkgPath) ? JSON.parse((0, fs_1.readFileSync)(this.pkgPath, 'utf-8')) : {};
    }
    async execute(options) {
        try {
            // Validate we're in a git repo
            if (!this.isGitRepo()) {
                return (0, utils_js_1.failure)('Not a git repository');
            }
            // Check for uncommitted changes
            if (this.hasUncommittedChanges()) {
                return (0, utils_js_1.failure)('Uncommitted changes detected. Commit or stash before shipping.');
            }
            // Determine new version
            const currentVersion = this.pkg.version || '0.0.0';
            const newVersion = this.calculateVersion(currentVersion, options.version || 'patch');
            // Get commits since last tag
            const commits = this.getCommitsSinceLastTag();
            // Generate changelog entry
            const changelog = this.generateChangelog(newVersion, commits);
            const releaseInfo = {
                version: newVersion,
                changelog,
                commits,
                tagName: `v${newVersion}`
            };
            if (options.dryRun) {
                return (0, utils_js_1.success)(`🔍 DRY RUN - No changes made\n` +
                    `📦 Version: ${currentVersion} → ${newVersion}\n` +
                    `📝 Changelog:\n${changelog}`, releaseInfo);
            }
            // Run tests if not skipped
            if (!options.skipTests) {
                const testResult = await this.runTests();
                if (!testResult.success) {
                    return (0, utils_js_1.failure)('Tests failed. Fix before shipping or use --skip-tests');
                }
            }
            // Update version in package.json
            this.updateVersion(newVersion);
            // Update changelog
            if (!options.skipChangelog) {
                this.updateChangelogFile(changelog);
            }
            // Commit version bump
            (0, utils_js_1.execCommand)('git add package.json', this.cwd);
            if (!options.skipChangelog && (0, fs_1.existsSync)((0, path_1.join)(this.cwd, 'CHANGELOG.md'))) {
                (0, utils_js_1.execCommand)('git add CHANGELOG.md', this.cwd);
            }
            (0, utils_js_1.execCommand)(`git commit -m "chore(release): ${newVersion}"`, this.cwd);
            // Create git tag
            if (!options.skipGitTag) {
                (0, utils_js_1.execCommand)(`git tag -a v${newVersion} -m "Release ${newVersion}"`, this.cwd);
            }
            // Push to remote
            (0, utils_js_1.execCommand)('git push origin HEAD', this.cwd);
            if (!options.skipGitTag) {
                (0, utils_js_1.execCommand)(`git push origin v${newVersion}`, this.cwd);
            }
            // Create GitHub release if token available
            if (!options.skipGitHubRelease && process.env.GH_TOKEN) {
                await this.createGitHubRelease(releaseInfo);
            }
            return (0, utils_js_1.success)(`🚀 Shipped ${newVersion}!\n` +
                `📦 Package: ${this.pkg.name}@${newVersion}\n` +
                `🏷️  Tag: v${newVersion}\n` +
                `📝 Commits: ${commits.length}`, releaseInfo);
        }
        catch (error) {
            return (0, utils_js_1.failure)(`Ship failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    isGitRepo() {
        return (0, fs_1.existsSync)((0, path_1.join)(this.cwd, '.git'));
    }
    hasUncommittedChanges() {
        const { stdout } = (0, utils_js_1.execCommandSilent)('git status --porcelain', this.cwd);
        return stdout.trim().length > 0;
    }
    calculateVersion(current, bump) {
        if (bump.match(/^\d+\.\d+\.\d+/)) {
            return bump;
        }
        const [major, minor, patch] = current.replace(/^v/, '').split('.').map(Number);
        switch (bump) {
            case 'major':
                return `${major + 1}.0.0`;
            case 'minor':
                return `${major}.${minor + 1}.0`;
            case 'patch':
            default:
                return `${major}.${minor}.${patch + 1}`;
        }
    }
    getCommitsSinceLastTag() {
        try {
            const lastTag = (0, utils_js_1.execCommandSilent)('git describe --tags --abbrev=0 2>/dev/null || echo ""', this.cwd).stdout;
            const range = lastTag ? `${lastTag}..HEAD` : 'HEAD~20';
            const output = (0, utils_js_1.execCommand)(`git log ${range} --pretty=format:"%s" --no-merges`, this.cwd);
            return output.split('\n').filter(Boolean);
        }
        catch {
            return [];
        }
    }
    generateChangelog(version, commits) {
        const sections = {
            features: [],
            fixes: [],
            other: []
        };
        for (const commit of commits) {
            if (commit.match(/^feat/i)) {
                sections.features.push(commit);
            }
            else if (commit.match(/^fix/i)) {
                sections.fixes.push(commit);
            }
            else {
                sections.other.push(commit);
            }
        }
        let changelog = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;
        if (sections.features.length > 0) {
            changelog += '### Features\n';
            for (const feat of sections.features) {
                changelog += `- ${feat}\n`;
            }
            changelog += '\n';
        }
        if (sections.fixes.length > 0) {
            changelog += '### Bug Fixes\n';
            for (const fix of sections.fixes) {
                changelog += `- ${fix}\n`;
            }
            changelog += '\n';
        }
        if (sections.other.length > 0) {
            changelog += '### Other\n';
            for (const other of sections.other.slice(0, 10)) {
                changelog += `- ${other}\n`;
            }
        }
        return changelog;
    }
    updateVersion(version) {
        this.pkg.version = version;
        (0, fs_1.writeFileSync)(this.pkgPath, JSON.stringify(this.pkg, null, 2) + '\n');
    }
    updateChangelogFile(entry) {
        const changelogPath = (0, path_1.join)(this.cwd, 'CHANGELOG.md');
        const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
        let existing = '';
        if ((0, fs_1.existsSync)(changelogPath)) {
            existing = (0, fs_1.readFileSync)(changelogPath, 'utf-8').replace(header, '');
        }
        (0, fs_1.writeFileSync)(changelogPath, header + entry + '\n' + existing);
    }
    async runTests() {
        const { code } = await (0, utils_js_1.streamCommand)('npm', ['test'], this.cwd);
        return { success: code === 0 };
    }
    async createGitHubRelease(info) {
        const { tagName, changelog } = info;
        const repo = (0, utils_js_1.execCommand)('git remote get-url origin', this.cwd)
            .replace(/.*github.com[\/:]/, '')
            .replace(/\.git$/, '');
        const body = changelog.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        (0, utils_js_1.execCommandSilent)(`curl -X POST -H "Authorization: token ${process.env.GH_TOKEN}" ` +
            `-H "Accept: application/vnd.github.v3+json" ` +
            `https://api.github.com/repos/${repo}/releases ` +
            `-d '{"tag_name":"${tagName}","name":"${tagName}","body":"${body}"}'`, this.cwd);
    }
}
exports.ShipSkill = ShipSkill;
// CLI entry point
async function run(args, cwd) {
    const options = parseShipArgs(args);
    const skill = new ShipSkill(cwd);
    return skill.execute(options);
}
function parseShipArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--version' || arg.startsWith('--version=')) {
            options.version = arg.includes('=') ? arg.split('=')[1] : args[++i];
        }
        else if (arg === '--dry-run') {
            options.dryRun = true;
        }
        else if (arg === '--skip-tests') {
            options.skipTests = true;
        }
        else if (arg === '--skip-changelog') {
            options.skipChangelog = true;
        }
        else if (arg === '--skip-git-tag') {
            options.skipGitTag = true;
        }
        else if (arg === '--skip-github-release') {
            options.skipGitHubRelease = true;
        }
    }
    return options;
}
//# sourceMappingURL=index.js.map