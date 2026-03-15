import { execSync } from 'child_process';
import * as fs from 'fs';
import chalk from 'chalk';
import https from 'https';
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
        const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
        const range = lastTag ? `${lastTag}..HEAD` : 'HEAD~20';
        const output = execSync(`git log ${range} --pretty=format:"%h|%s"`, { encoding: 'utf-8' });
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
        const req = https.request(options, (res) => {
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
        const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
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
export async function run(options) {
    console.log(chalk.cyan('══════════════════════════════════════════════════'));
    console.log(chalk.cyan('Release Pipeline'));
    console.log(chalk.cyan('══════════════════════════════════════════════════\n'));
    const currentVersion = getCurrentVersion();
    const newVersion = bumpVersion(currentVersion, options.version);
    console.log(chalk.gray(`Current version: ${currentVersion}`));
    console.log(chalk.gray(`New version: ${newVersion}`));
    if (options.dryRun) {
        console.log(chalk.yellow('\n⚠ DRY RUN - No changes will be made\n'));
    }
    // Check git status
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
        if (status && !options.dryRun) {
            console.log(chalk.red('\n✗ Working directory is not clean'));
            console.log(chalk.gray('Commit or stash changes first'));
            process.exit(1);
        }
    }
    catch {
        console.log(chalk.yellow('\n⚠ Not a git repository or git not available'));
    }
    // Run tests
    if (!options.skipTests && !options.dryRun) {
        console.log(chalk.blue('\nℹ Running tests...'));
        try {
            execSync('npm test', { stdio: 'inherit' });
            console.log(chalk.green('✓ Tests passed'));
        }
        catch {
            console.log(chalk.red('\n✗ Tests failed'));
            process.exit(1);
        }
    }
    else if (options.skipTests) {
        console.log(chalk.yellow('\n⚠ Skipping tests'));
    }
    // Get commits for changelog
    const commits = getCommitsSinceLastTag();
    const changelogEntry = generateChangelog(commits, newVersion);
    if (!options.dryRun) {
        // Update version
        console.log(chalk.blue('\nℹ Updating version...'));
        updateVersion(newVersion);
        console.log(chalk.green(`✓ Version updated to ${newVersion}`));
        // Update changelog
        console.log(chalk.blue('\nℹ Updating changelog...'));
        updateChangelogFile(changelogEntry);
        console.log(chalk.green('✓ Changelog updated'));
        // Create commit
        console.log(chalk.blue('\nℹ Creating release commit...'));
        execSync('git add package.json CHANGELOG.md');
        execSync(`git commit -m "chore(release): v${newVersion}"`);
        console.log(chalk.green('✓ Commit created'));
        // Create tag
        console.log(chalk.blue('\nℹ Creating git tag...'));
        execSync(`git tag v${newVersion}`);
        console.log(chalk.green(`✓ Tag v${newVersion} created`));
        // Push
        console.log(chalk.blue('\nℹ Pushing to remote...'));
        execSync('git push origin HEAD');
        execSync('git push origin --tags');
        console.log(chalk.green('✓ Pushed to remote'));
        // Create GitHub release
        const repo = options.repo || getRepoInfo();
        const token = process.env.GH_TOKEN;
        if (repo && token) {
            console.log(chalk.blue('\nℹ Creating GitHub release...'));
            try {
                const releaseNotes = options.notes || changelogEntry;
                await createGitHubRelease(repo, newVersion, releaseNotes, options.prerelease, token);
                console.log(chalk.green('✓ GitHub release created'));
            }
            catch (err) {
                console.log(chalk.yellow(`\n⚠ Failed to create GitHub release: ${err.message}`));
            }
        }
        else if (!token) {
            console.log(chalk.yellow('\n⚠ GH_TOKEN not set, skipping GitHub release'));
        }
        else if (!repo) {
            console.log(chalk.yellow('\n⚠ Could not detect repository, skipping GitHub release'));
        }
    }
    else {
        console.log(chalk.blue('\nℹ Would update version to:'), newVersion);
        console.log(chalk.blue('ℹ Would update CHANGELOG.md'));
        console.log(chalk.blue('ℹ Would create commit and tag'));
        console.log(chalk.blue('ℹ Would push to remote'));
    }
    console.log(chalk.cyan('\n══════════════════════════════════════════════════'));
    console.log(chalk.green(`✓ Released ${newVersion}`));
    console.log(chalk.cyan('══════════════════════════════════════════════════'));
}
//# sourceMappingURL=index.js.map