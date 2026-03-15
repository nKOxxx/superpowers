"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ship = ship;
const config_js_1 = require("../lib/config.js");
const format = __importStar(require("../lib/format.js"));
const git = __importStar(require("../lib/git.js"));
const github_js_1 = require("../lib/github.js");
const telegram_js_1 = require("../lib/telegram.js");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const semver_1 = require("semver");
async function ship(options) {
    const config = await (0, config_js_1.loadConfig)();
    const shipConfig = config.ship;
    format.header(`Ship Release - ${options.repo}`);
    // Validate repo format
    const { owner, repo } = (0, github_js_1.parseRepoString)(options.repo);
    format.step(`Repository: ${owner}/${repo}`);
    // Check working directory
    if (shipConfig.requireCleanWorkingDir && !options.force) {
        const status = git.getGitStatus();
        if (!status.isClean) {
            format.error('Working directory is not clean. Commit changes or use --force');
            format.info('Modified files:');
            status.modified.forEach(f => console.log(`  - ${f}`));
            throw new Error('Dirty working directory');
        }
        format.success('Working directory is clean');
    }
    // Calculate new version
    const currentVersion = getCurrentVersion();
    const newVersion = calculateVersion(currentVersion, options.version);
    format.step(`Version: ${currentVersion} → ${newVersion}`);
    if (options.dryRun) {
        format.info('DRY RUN - No changes will be made');
        return {
            version: newVersion,
            tag: `v${newVersion}`,
            changelogUpdated: false
        };
    }
    // Run tests if configured
    if (shipConfig.runTestsBeforeRelease && !options.skipTests) {
        format.step('Running tests...');
        try {
            (0, child_process_1.execSync)(shipConfig.testCommand || 'npm test', {
                cwd: process.cwd(),
                stdio: 'inherit'
            });
            format.success('Tests passed');
        }
        catch (error) {
            format.error('Tests failed - aborting release');
            throw error;
        }
    }
    // Update package.json version
    format.step('Bumping version...');
    updatePackageVersion(newVersion);
    format.success(`Version bumped to ${newVersion}`);
    // Generate changelog
    format.step('Generating changelog...');
    const changelogConfig = shipConfig.changelog || { preset: 'conventional', includeContributors: true };
    const changelog = generateChangelog(newVersion, changelogConfig);
    updateChangelogFile(changelog, newVersion);
    format.success('Changelog updated');
    // Create commit
    format.step('Creating release commit...');
    await git.createCommit(`chore(release): v${newVersion}`);
    format.success('Commit created');
    // Create tag
    format.step(`Creating tag v${newVersion}...`);
    await git.createTag(newVersion);
    format.success('Tag created');
    // Push to remote
    format.step('Pushing to remote...');
    await git.pushToRemote(true);
    format.success('Pushed to remote');
    // Create GitHub release
    format.step('Creating GitHub release...');
    const releaseBody = options.notes || changelog;
    let releaseUrl;
    try {
        releaseUrl = await (0, github_js_1.createRelease)({
            owner,
            repo,
            tag: `v${newVersion}`,
            name: `v${newVersion}`,
            body: releaseBody
        });
        format.success(`Release created: ${releaseUrl}`);
    }
    catch (error) {
        format.warning(`Failed to create GitHub release: ${error}`);
    }
    // Send Telegram notification
    if (shipConfig.telegram?.notifyOnShip && releaseUrl) {
        try {
            const message = (0, telegram_js_1.formatShipNotification)(options.repo, newVersion, releaseUrl);
            await (0, telegram_js_1.sendTelegramNotification)(message);
        }
        catch (error) {
            format.warning('Failed to send Telegram notification');
        }
    }
    format.divider();
    format.success(`🚀 Released v${newVersion}`);
    if (releaseUrl) {
        console.log(`Release URL: ${releaseUrl}`);
    }
    return {
        version: newVersion,
        tag: `v${newVersion}`,
        releaseUrl,
        changelogUpdated: true
    };
}
function getCurrentVersion() {
    try {
        const packageJson = JSON.parse((0, fs_1.readFileSync)('package.json', 'utf-8'));
        return packageJson.version || '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
function calculateVersion(current, versionInput) {
    // If explicit version number provided
    if ((0, semver_1.valid)(versionInput)) {
        return versionInput;
    }
    // Otherwise treat as semver increment type
    const validCurrent = (0, semver_1.valid)(current) || '0.0.0';
    const incremented = (0, semver_1.inc)(validCurrent, versionInput);
    if (!incremented) {
        throw new Error(`Invalid version or increment type: ${versionInput}`);
    }
    return incremented;
}
function updatePackageVersion(version) {
    const packageJson = JSON.parse((0, fs_1.readFileSync)('package.json', 'utf-8'));
    packageJson.version = version;
    (0, fs_1.writeFileSync)('package.json', JSON.stringify(packageJson, null, 2) + '\n');
}
function generateChangelog(version, config) {
    const lines = [];
    lines.push(`## [${version}] - ${new Date().toISOString().split('T')[0]}`);
    lines.push('');
    // Get commits since last tag
    const lastTag = git.getLastTag();
    const commits = git.getConventionalCommits(lastTag);
    // Group by type
    const groups = {};
    for (const commit of commits) {
        const type = commit.type;
        if (!groups[type])
            groups[type] = [];
        let line = `- ${commit.message}`;
        if (commit.scope) {
            line = `- **${commit.scope}:** ${commit.message}`;
        }
        groups[type].push(line);
    }
    // Output in conventional order
    const typeOrder = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'];
    const typeLabels = {
        feat: '### Features',
        fix: '### Bug Fixes',
        docs: '### Documentation',
        style: '### Styling',
        refactor: '### Code Refactoring',
        perf: '### Performance',
        test: '### Tests',
        chore: '### Chores'
    };
    for (const type of typeOrder) {
        if (groups[type]?.length) {
            lines.push(typeLabels[type] || `### ${type}`);
            lines.push('');
            groups[type].forEach(line => lines.push(line));
            lines.push('');
        }
    }
    // Add other types
    for (const [type, items] of Object.entries(groups)) {
        if (!typeOrder.includes(type) && items.length) {
            lines.push(`### ${type}`);
            lines.push('');
            items.forEach(line => lines.push(line));
            lines.push('');
        }
    }
    return lines.join('\n');
}
function updateChangelogFile(newEntry, version) {
    const changelogPath = 'CHANGELOG.md';
    let existingContent = '';
    try {
        existingContent = (0, fs_1.readFileSync)(changelogPath, 'utf-8');
    }
    catch {
        // File doesn't exist, create header
        existingContent = '# Changelog\n\nAll notable changes will be documented in this file.\n';
    }
    // Insert new entry after header
    const lines = existingContent.split('\n');
    const insertIndex = lines.findIndex(line => line.startsWith('## ['));
    if (insertIndex >= 0) {
        lines.splice(insertIndex, 0, newEntry, '');
    }
    else {
        // No existing entries, add after title
        const titleEnd = lines.findIndex(line => line.trim() === '') + 1;
        lines.splice(titleEnd, 0, '', newEntry);
    }
    (0, fs_1.writeFileSync)(changelogPath, lines.join('\n'));
}
//# sourceMappingURL=ship.js.map