import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import semver from 'semver';
import { simpleGit } from 'simple-git';
import chalk from 'chalk';
// Telegram notification helper
async function sendTelegramNotification(botToken, chatId, message) {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        if (!response.ok) {
            console.warn(chalk.yellow(`Telegram notification failed: ${response.statusText}`));
        }
    }
    catch (error) {
        console.warn(chalk.yellow(`Telegram notification error: ${error instanceof Error ? error.message : String(error)}`));
    }
}
const DEFAULT_CONFIG = {
    defaultBump: 'patch',
    changelogPath: 'CHANGELOG.md',
    packageFiles: ['package.json', 'package-lock.json'],
    tagPrefix: 'v',
    releaseBranch: 'main',
    requireCleanWorkingDir: true,
    runTests: true,
    testCommand: 'npm test',
    preReleaseHooks: [],
    postReleaseHooks: []
};
export class ShipSkill {
    config;
    git = simpleGit();
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async loadConfig() {
        try {
            const configPath = path.join(process.cwd(), '.ship.config.json');
            const content = await fs.readFile(configPath, 'utf-8');
            const userConfig = JSON.parse(content);
            this.config = { ...this.config, ...userConfig };
        }
        catch {
            // Use default config
        }
    }
    async getStatus() {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
        const branch = await this.git.branch();
        const status = await this.git.status();
        const tags = await this.git.tags(['--sort=-creatordate']);
        const latestTag = tags.latest || 'v0.0.0';
        const currentVersion = pkg.version;
        // Get commits since last tag
        const logs = await this.git.log({ from: latestTag, to: 'HEAD' });
        const commits = logs.all.map((l) => l.message);
        // Determine recommended bump
        const recommendedBump = this.determineBumpFromCommits(commits);
        return {
            currentVersion,
            currentBranch: branch.current,
            isClean: status.isClean(),
            lastTag: latestTag,
            commitsSinceTag: commits.length,
            recommendedBump,
            hasGhToken: !!process.env.GH_TOKEN || !!process.env.GITHUB_TOKEN,
            hasNpmToken: !!process.env.NPM_TOKEN
        };
    }
    async release(type, options = {}) {
        const status = await this.getStatus();
        // Pre-release checks
        if (!options.skipGitChecks) {
            if (status.currentBranch !== this.config.releaseBranch && !options.force) {
                return {
                    success: false,
                    message: `Not on ${this.config.releaseBranch} branch (current: ${status.currentBranch}). Use --force to override.`
                };
            }
            if (!status.isClean && this.config.requireCleanWorkingDir && !options.force) {
                return { success: false, message: 'Working directory is not clean. Use --force to override.' };
            }
        }
        // Run pre-release hooks
        for (const hook of this.config.preReleaseHooks) {
            try {
                execSync(hook, { stdio: 'inherit' });
            }
            catch {
                return { success: false, message: `Pre-release hook failed: ${hook}` };
            }
        }
        // Run tests if configured
        if (this.config.runTests && !options.skipTests) {
            try {
                console.log(chalk.blue('Running tests...'));
                execSync(this.config.testCommand, { stdio: 'inherit' });
            }
            catch {
                return { success: false, message: 'Tests failed' };
            }
        }
        // Calculate new version
        const currentVersion = status.currentVersion;
        let newVersion;
        if (options.version) {
            newVersion = options.version;
        }
        else {
            const prereleaseId = options.tag || 'alpha';
            newVersion = semver.inc(currentVersion, type, prereleaseId) || currentVersion;
        }
        if (options.dryRun) {
            return {
                success: true,
                message: `Dry run: Would release ${currentVersion} → ${newVersion}`
            };
        }
        try {
            // Update version in package files
            for (const file of this.config.packageFiles) {
                const filePath = path.join(process.cwd(), file);
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    const json = JSON.parse(content);
                    json.version = newVersion;
                    await fs.writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
                }
                catch {
                    // File might not exist, skip
                }
            }
            // Update changelog
            if (!options.skipChangelog) {
                await this.updateChangelog(newVersion, status.commitsSinceTag);
            }
            // Commit changes
            await this.git.add('.');
            await this.git.commit(`chore(release): ${this.config.tagPrefix}${newVersion}`);
            // Create tag
            const tagName = `${this.config.tagPrefix}${newVersion}`;
            await this.git.addTag(tagName);
            // Push to origin
            if (!options.skipGitChecks) {
                await this.git.push('origin', status.currentBranch);
                await this.git.pushTags('origin');
            }
            // Run post-release hooks
            for (const hook of this.config.postReleaseHooks) {
                try {
                    execSync(hook, { stdio: 'inherit' });
                }
                catch {
                    console.warn(chalk.yellow(`Post-release hook failed: ${hook}`));
                }
            }
            // Send Telegram notification if configured
            if (this.config.telegram) {
                const telegramMessage = `
🚀 <b>Release Published</b>

📦 Package: ${process.env.npm_package_name || 'unknown'}
🔖 Version: ${newVersion}
🌿 Branch: ${status.currentBranch}
📝 Commits: ${status.commitsSinceTag}

<a href="https://github.com/${this.config.githubRepo || 'owner/repo'}/releases/tag/${this.config.tagPrefix}${newVersion}">View Release</a>
        `.trim();
                await sendTelegramNotification(this.config.telegram.botToken, this.config.telegram.chatId, telegramMessage);
            }
            return { success: true, message: `Released ${currentVersion} → ${newVersion}` };
        }
        catch (error) {
            return {
                success: false,
                message: `Release failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    async preview(type) {
        const status = await this.getStatus();
        const currentVersion = status.currentVersion;
        let newVersion;
        if (type === 'prerelease') {
            newVersion = semver.inc(currentVersion, type, 'alpha') || currentVersion;
        }
        else {
            newVersion = semver.inc(currentVersion, type) || currentVersion;
        }
        const changelog = await this.generateChangelogPreview(newVersion, status.commitsSinceTag);
        return { currentVersion, newVersion, changelog };
    }
    determineBumpFromCommits(commits) {
        let hasBreaking = false;
        let hasFeature = false;
        for (const commit of commits) {
            if (commit.includes('BREAKING CHANGE') || commit.includes('!:')) {
                hasBreaking = true;
                break;
            }
            if (commit.startsWith('feat')) {
                hasFeature = true;
            }
        }
        if (hasBreaking)
            return 'major';
        if (hasFeature)
            return 'minor';
        return 'patch';
    }
    async updateChangelog(version, commitCount) {
        const logs = await this.git.log({ maxCount: commitCount || 20 });
        const entries = this.parseChangelogEntries(logs.all.map((l) => l.message));
        const changelogPath = path.join(process.cwd(), this.config.changelogPath);
        let existingContent = '';
        try {
            existingContent = await fs.readFile(changelogPath, 'utf-8');
        }
        catch {
            // File doesn't exist
        }
        const newSection = this.formatChangelogSection(version, entries);
        const updatedContent = newSection + '\n\n' + existingContent;
        await fs.writeFile(changelogPath, updatedContent);
    }
    async generateChangelogPreview(version, commitCount) {
        const logs = await this.git.log({ maxCount: commitCount || 20 });
        const entries = this.parseChangelogEntries(logs.all.map((l) => l.message));
        return this.formatChangelogSection(version, entries);
    }
    parseChangelogEntries(commits) {
        const entries = [];
        for (const commit of commits) {
            const lines = commit.split('\n');
            const firstLine = lines[0];
            // Parse conventional commit
            const match = firstLine.match(/^(\w+)(?:\([^)]+\))?!?:\s*(.+)$/);
            if (match) {
                const [, type, message] = match;
                const isBreaking = firstLine.includes('!:') || commit.includes('BREAKING CHANGE:');
                entries.push({
                    type: isBreaking ? 'breaking' : type,
                    message,
                    isBreaking
                });
            }
        }
        return entries;
    }
    formatChangelogSection(version, entries) {
        const date = new Date().toISOString().split('T')[0];
        let section = `## [${version}] - ${date}\n\n`;
        const groups = {
            breaking: [],
            feat: [],
            fix: [],
            docs: [],
            style: [],
            refactor: [],
            perf: [],
            test: [],
            chore: []
        };
        for (const entry of entries) {
            const key = entry.type in groups ? entry.type : 'chore';
            groups[key].push(entry);
        }
        if (groups.breaking.length > 0) {
            section += '### ⚠ BREAKING CHANGES\n\n';
            for (const entry of groups.breaking) {
                section += `- ${entry.message}\n`;
            }
            section += '\n';
        }
        if (groups.feat.length > 0) {
            section += '### ✨ Features\n\n';
            for (const entry of groups.feat) {
                section += `- ${entry.message}\n`;
            }
            section += '\n';
        }
        if (groups.fix.length > 0) {
            section += '### 🐛 Bug Fixes\n\n';
            for (const entry of groups.fix) {
                section += `- ${entry.message}\n`;
            }
            section += '\n';
        }
        return section;
    }
    async initConfig() {
        const configPath = path.join(process.cwd(), '.ship.config.json');
        await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
    getConfig() {
        return this.config;
    }
}
//# sourceMappingURL=index.js.map