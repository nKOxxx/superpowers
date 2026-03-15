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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const https_1 = __importDefault(require("https"));
function getCurrentVersion() {
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        return packageJson.version || '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
function bumpVersion(current, bumpType) {
    const [major, minor, patch] = current.split('.').map(Number);
    if (bumpType === 'major') {
        return `${major + 1}.0.0`;
    }
    else if (bumpType === 'minor') {
        return `${major}.${minor + 1}.0`;
    }
    else if (bumpType === 'patch') {
        return `${major}.${minor}.${patch + 1}`;
    }
    else if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
        return bumpType; // Explicit version
    }
    return `${major}.${minor}.${patch + 1}`;
}
function updateVersion(newVersion) {
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}
function getCommitsSinceLastTag() {
    try {
        const lastTag = (0, child_process_1.execSync)('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
        const range = lastTag ? `${lastTag}..HEAD` : 'HEAD~20';
        const output = (0, child_process_1.execSync)(`git log ${range} --pretty=format:"%h|%s"`, { encoding: 'utf-8' });
        return output.trim().split('\n').map(line => {
            const [hash, ...messageParts] = line.split('|');
            const message = messageParts.join('|');
            let type = 'other';
            if (message.startsWith('feat:') || message.startsWith('feature:'))
                type = 'feat';
            else if (message.startsWith('fix:') || message.startsWith('bugfix:'))
                type = 'fix';
            else if (message.startsWith('chore:'))
                type = 'chore';
            else if (message.startsWith('docs:'))
                type = 'docs';
            else if (message.startsWith('refactor:'))
                type = 'refactor';
            else if (message.startsWith('test:'))
                type = 'test';
            return { type, message, hash };
        });
    }
    catch {
        return [];
    }
}
function generateChangelog(commits, version) {
    const sections = {
        feat: [],
        fix: [],
        chore: [],
        docs: [],
        refactor: [],
        test: [],
        other: []
    };
    for (const commit of commits) {
        const cleanMessage = commit.message.replace(/^(feat|fix|chore|docs|refactor|test):\s*/, '');
        sections[commit.type].push(`- ${cleanMessage} (${commit.hash})`);
    }
    const date = new Date().toISOString().split('T')[0];
    let changelog = `## [${version}] - ${date}\n\n`;
    if (sections.feat.length > 0) {
        changelog += '### Features\n' + sections.feat.join('\n') + '\n\n';
    }
    if (sections.fix.length > 0) {
        changelog += '### Bug Fixes\n' + sections.fix.join('\n') + '\n\n';
    }
    if (sections.chore.length > 0) {
        changelog += '### Chores\n' + sections.chore.join('\n') + '\n\n';
    }
    if (sections.docs.length > 0) {
        changelog += '### Documentation\n' + sections.docs.join('\n') + '\n\n';
    }
    if (sections.refactor.length > 0) {
        changelog += '### Refactoring\n' + sections.refactor.join('\n') + '\n\n';
    }
    if (sections.other.length > 0) {
        changelog += '### Other Changes\n' + sections.other.join('\n') + '\n\n';
    }
    return changelog;
}
function updateChangelogFile(newEntry) {
    const changelogPath = 'CHANGELOG.md';
    if (fs.existsSync(changelogPath)) {
        const existing = fs.readFileSync(changelogPath, 'utf-8');
        const header = existing.startsWith('# Changelog') ? '' : '# Changelog\n\n';
        fs.writeFileSync(changelogPath, header + newEntry + existing.replace(/^# Changelog\n\n/, ''));
    }
    else {
        fs.writeFileSync(changelogPath, '# Changelog\n\n' + newEntry);
    }
}
function createGitHubRelease(repo, version, notes, prerelease, token) {
    return new Promise((resolve, reject) => {
        const [owner, repoName] = repo.split('/');
        const data = JSON.stringify({
            tag_name: `v${version}`,
            name: `v${version}`,
            body: notes,
            prerelease: prerelease
        });
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repoName}/releases`,
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'superpowers-cli',
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        const req = https_1.default.request(options, (res) => {
            if (res.statusCode === 201) {
                resolve();
            }
            else {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => reject(new Error(`GitHub API error: ${res.statusCode} - ${body}`)));
            }
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
function getRepoInfo() {
    try {
        const remote = (0, child_process_1.execSync)('git remote get-url origin', { encoding: 'utf-8' }).trim();
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+)(\.git)?$/);
        if (match) {
            return `${match[1]}/${match[2].replace(/\.git$/, '')}`;
        }
    }
    catch {
        // Ignore
    }
    return null;
}
async function run(options) {
    console.log(chalk_1.default.cyan('══════════════════════════════════════════════════'));
    console.log(chalk_1.default.cyan('Release Pipeline'));
    console.log(chalk_1.default.cyan('══════════════════════════════════════════════════\n'));
    const currentVersion = getCurrentVersion();
    const newVersion = bumpVersion(currentVersion, options.version);
    console.log(chalk_1.default.gray(`Current version: ${currentVersion}`));
    console.log(chalk_1.default.gray(`New version: ${newVersion}`));
    if (options.dryRun) {
        console.log(chalk_1.default.yellow('\n⚠ DRY RUN - No changes will be made\n'));
    }
    // Check git status
    try {
        const status = (0, child_process_1.execSync)('git status --porcelain', { encoding: 'utf-8' }).trim();
        if (status && !options.dryRun) {
            console.log(chalk_1.default.red('\n✗ Working directory is not clean'));
            console.log(chalk_1.default.gray('Commit or stash changes first'));
            process.exit(1);
        }
    }
    catch {
        console.log(chalk_1.default.yellow('\n⚠ Not a git repository or git not available'));
    }
    // Run tests
    if (!options.skipTests && !options.dryRun) {
        console.log(chalk_1.default.blue('\nℹ Running tests...'));
        try {
            (0, child_process_1.execSync)('npm test', { stdio: 'inherit' });
            console.log(chalk_1.default.green('✓ Tests passed'));
        }
        catch {
            console.log(chalk_1.default.red('\n✗ Tests failed'));
            process.exit(1);
        }
    }
    else if (options.skipTests) {
        console.log(chalk_1.default.yellow('\n⚠ Skipping tests'));
    }
    // Get commits for changelog
    const commits = getCommitsSinceLastTag();
    const changelogEntry = generateChangelog(commits, newVersion);
    if (!options.dryRun) {
        // Update version
        console.log(chalk_1.default.blue('\nℹ Updating version...'));
        updateVersion(newVersion);
        console.log(chalk_1.default.green(`✓ Version updated to ${newVersion}`));
        // Update changelog
        console.log(chalk_1.default.blue('\nℹ Updating changelog...'));
        updateChangelogFile(changelogEntry);
        console.log(chalk_1.default.green('✓ Changelog updated'));
        // Create commit
        console.log(chalk_1.default.blue('\nℹ Creating release commit...'));
        (0, child_process_1.execSync)('git add package.json CHANGELOG.md');
        (0, child_process_1.execSync)(`git commit -m "chore(release): v${newVersion}"`);
        console.log(chalk_1.default.green('✓ Commit created'));
        // Create tag
        console.log(chalk_1.default.blue('\nℹ Creating git tag...'));
        (0, child_process_1.execSync)(`git tag v${newVersion}`);
        console.log(chalk_1.default.green(`✓ Tag v${newVersion} created`));
        // Push
        console.log(chalk_1.default.blue('\nℹ Pushing to remote...'));
        (0, child_process_1.execSync)('git push origin HEAD');
        (0, child_process_1.execSync)('git push origin --tags');
        console.log(chalk_1.default.green('✓ Pushed to remote'));
        // Create GitHub release
        const repo = options.repo || getRepoInfo();
        const token = process.env.GH_TOKEN;
        if (repo && token) {
            console.log(chalk_1.default.blue('\nℹ Creating GitHub release...'));
            try {
                const releaseNotes = options.notes || changelogEntry;
                await createGitHubRelease(repo, newVersion, releaseNotes, options.prerelease, token);
                console.log(chalk_1.default.green('✓ GitHub release created'));
            }
            catch (err) {
                console.log(chalk_1.default.yellow(`\n⚠ Failed to create GitHub release: ${err.message}`));
            }
        }
        else if (!token) {
            console.log(chalk_1.default.yellow('\n⚠ GH_TOKEN not set, skipping GitHub release'));
        }
        else if (!repo) {
            console.log(chalk_1.default.yellow('\n⚠ Could not detect repository, skipping GitHub release'));
        }
    }
    else {
        console.log(chalk_1.default.blue('\nℹ Would update version to:'), newVersion);
        console.log(chalk_1.default.blue('ℹ Would update CHANGELOG.md'));
        console.log(chalk_1.default.blue('ℹ Would create commit and tag'));
        console.log(chalk_1.default.blue('ℹ Would push to remote'));
    }
    console.log(chalk_1.default.cyan('\n══════════════════════════════════════════════════'));
    console.log(chalk_1.default.green(`✓ Released ${newVersion}`));
    console.log(chalk_1.default.cyan('══════════════════════════════════════════════════'));
}
//# sourceMappingURL=index.js.map