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
exports.ShipSkill = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const semver_1 = require("semver");
class ShipSkill {
    getCurrentVersion() {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            return pkg.version || '0.0.0';
        }
        return '0.0.0';
    }
    getCommitsSinceLastTag() {
        try {
            // Get the latest tag
            let lastTag = '';
            try {
                lastTag = (0, child_process_1.execSync)('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
            }
            catch {
                // No tags yet
                lastTag = '';
            }
            // Get commits since last tag
            const format = '%H|%s';
            const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
            const output = (0, child_process_1.execSync)(`git log ${range} --pretty=format:"${format}"`, { encoding: 'utf-8' });
            return output.trim().split('\n').filter(Boolean).map(line => {
                const [hash, ...subjectParts] = line.split('|');
                const subject = subjectParts.join('|');
                // Parse conventional commit
                const match = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
                if (match) {
                    return {
                        hash: hash.slice(0, 7),
                        type: match[1],
                        scope: match[2],
                        subject: match[3],
                    };
                }
                return {
                    hash: hash.slice(0, 7),
                    type: 'other',
                    subject,
                };
            });
        }
        catch {
            return [];
        }
    }
    generateChangelog(commits, version) {
        const sections = {
            feat: [],
            fix: [],
            docs: [],
            style: [],
            refactor: [],
            perf: [],
            test: [],
            chore: [],
            other: [],
        };
        for (const commit of commits) {
            if (sections[commit.type]) {
                sections[commit.type].push(commit);
            }
            else {
                sections.other.push(commit);
            }
        }
        const date = new Date().toISOString().split('T')[0];
        let changelog = `## [${version}] - ${date}\n\n`;
        const typeLabels = {
            feat: '### ✨ Features',
            fix: '### 🐛 Bug Fixes',
            docs: '### 📚 Documentation',
            style: '### 💎 Styles',
            refactor: '### ♻️ Code Refactoring',
            perf: '### ⚡ Performance',
            test: '### ✅ Tests',
            chore: '### 🔧 Chores',
            other: '### 📝 Other',
        };
        for (const [type, typeCommits] of Object.entries(sections)) {
            if (typeCommits.length > 0) {
                changelog += `${typeLabels[type]}\n`;
                for (const commit of typeCommits) {
                    const scope = commit.scope ? `**${commit.scope}:** ` : '';
                    changelog += `- ${scope}${commit.subject} (${commit.hash})\n`;
                }
                changelog += '\n';
            }
        }
        return changelog;
    }
    updateChangelogFile(newEntry) {
        const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
        let existing = '';
        if (fs.existsSync(changelogPath)) {
            existing = fs.readFileSync(changelogPath, 'utf-8');
            // Remove the header if it exists
            existing = existing.replace(/^# Changelog\n\n/i, '');
        }
        const content = `# Changelog\n\n${newEntry}${existing}`;
        fs.writeFileSync(changelogPath, content);
    }
    updatePackageVersion(version) {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        pkg.version = version;
        fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    }
    async release(options) {
        const currentVersion = this.getCurrentVersion();
        // Determine new version
        let newVersion;
        if (options.version) {
            if (['patch', 'minor', 'major'].includes(options.version)) {
                const bumped = (0, semver_1.inc)(currentVersion, options.version);
                if (!bumped) {
                    throw new Error(`Failed to bump version: ${currentVersion} with ${options.version}`);
                }
                newVersion = bumped;
            }
            else if ((0, semver_1.valid)(options.version)) {
                newVersion = options.version;
            }
            else {
                throw new Error(`Invalid version: ${options.version}`);
            }
        }
        else {
            newVersion = (0, semver_1.inc)(currentVersion, 'patch');
        }
        if (options.dryRun) {
            console.log(`📝 Dry run mode - no changes will be made`);
            console.log(`   Current version: ${currentVersion}`);
            console.log(`   New version: ${newVersion}`);
        }
        // Get commits and generate changelog
        const commits = this.getCommitsSinceLastTag();
        const changelogEntry = this.generateChangelog(commits, newVersion);
        if (options.dryRun) {
            console.log(`\n📋 Changelog preview:\n${changelogEntry}`);
        }
        if (options.dryRun) {
            return {
                success: true,
                version: newVersion,
                changelog: changelogEntry,
                dryRun: true,
            };
        }
        // Update files
        this.updatePackageVersion(newVersion);
        if (!options.skipChangelog) {
            this.updateChangelogFile(changelogEntry);
        }
        // Git operations
        if (!options.skipTag) {
            // Stage changes
            (0, child_process_1.execSync)('git add package.json');
            if (!options.skipChangelog) {
                (0, child_process_1.execSync)('git add CHANGELOG.md');
            }
            // Commit
            (0, child_process_1.execSync)(`git commit -m "chore(release): v${newVersion}"`);
            // Create tag
            (0, child_process_1.execSync)(`git tag v${newVersion}`);
            // Push
            (0, child_process_1.execSync)('git push origin HEAD --follow-tags');
        }
        // GitHub release
        let releaseUrl;
        if (!options.skipRelease) {
            try {
                const ghToken = process.env.GH_TOKEN;
                if (ghToken) {
                    // Check if gh CLI is available
                    (0, child_process_1.execSync)('which gh');
                    // Create release
                    (0, child_process_1.execSync)(`GH_TOKEN=${ghToken} gh release create v${newVersion} --title "v${newVersion}" --notes "${changelogEntry}"`);
                    releaseUrl = `https://github.com/${this.getRepoSlug()}/releases/tag/v${newVersion}`;
                }
            }
            catch {
                console.log('⚠️ GitHub release creation skipped (gh CLI not available or GH_TOKEN not set)');
            }
        }
        return {
            success: true,
            version: newVersion,
            changelog: changelogEntry,
            tag: `v${newVersion}`,
            releaseUrl,
        };
    }
    getRepoSlug() {
        try {
            const remote = (0, child_process_1.execSync)('git remote get-url origin', { encoding: 'utf-8' }).trim();
            const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
            if (match) {
                return `${match[1]}/${match[2]}`;
            }
        }
        catch {
            // Ignore
        }
        return 'owner/repo';
    }
}
exports.ShipSkill = ShipSkill;
// CLI entry point
if (require.main === module) {
    async function main() {
        const args = process.argv.slice(2);
        const options = {};
        // Parse arguments
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--version=') || arg.startsWith('-v=')) {
                options.version = arg.split('=')[1];
            }
            else if (arg === '--dry-run' || arg === '-d') {
                options.dryRun = true;
            }
            else if (arg === '--skip-changelog') {
                options.skipChangelog = true;
            }
            else if (arg === '--skip-tag') {
                options.skipTag = true;
            }
            else if (arg === '--skip-release') {
                options.skipRelease = true;
            }
        }
        const skill = new ShipSkill();
        try {
            const result = await skill.release(options);
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        }
        catch (error) {
            console.error(JSON.stringify({
                success: false,
                error: error.message
            }, null, 2));
            process.exit(1);
        }
    }
    main();
}
//# sourceMappingURL=index.js.map