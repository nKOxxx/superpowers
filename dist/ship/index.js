import { execSync } from 'child_process';
import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
export async function shipCommand(options) {
    console.log(chalk.blue('🚢 Ship'), chalk.cyan(options.version || 'patch'));
    if (options.dryRun) {
        console.log(chalk.yellow('🔍 DRY RUN - No changes will be applied'));
    }
    // Check if we're in a git repo
    if (!isGitRepo()) {
        console.error(chalk.red('❌ Not a git repository'));
        process.exit(1);
    }
    // Check for uncommitted changes
    if (hasUncommittedChanges()) {
        console.error(chalk.red('❌ Uncommitted changes detected. Commit or stash first.'));
        process.exit(1);
    }
    // Get current version
    const currentVersion = getCurrentVersion();
    console.log(chalk.gray(`Current version: ${currentVersion}`));
    // Calculate new version
    const newVersion = calculateNewVersion(currentVersion, options.version || 'patch');
    console.log(chalk.cyan(`New version: ${newVersion}`));
    // Generate changelog
    const changelog = generateChangelog();
    console.log(chalk.gray(`Changelog entries: ${changelog.length}`));
    // Preview changes
    if (options.dryRun) {
        console.log('\n' + chalk.blue('📋 Preview:'));
        console.log(chalk.gray('Version bump:'), `${currentVersion} → ${newVersion}`);
        console.log(chalk.gray('Changelog:'));
        changelog.slice(0, 10).forEach(entry => {
            console.log(chalk.gray(`  - ${entry}`));
        });
        return;
    }
    // Update version in package.json
    updateVersion(newVersion);
    // Update CHANGELOG.md if exists
    updateChangelogFile(newVersion, changelog);
    // Commit version bump
    commitVersionBump(newVersion);
    // Create git tag
    createGitTag(newVersion);
    // Push to remote
    if (!options.skipPush) {
        pushToRemote(newVersion);
    }
    // Create GitHub release
    if (!options.skipRelease && process.env.GH_TOKEN) {
        await createGitHubRelease(newVersion, changelog);
    }
    console.log(chalk.green('\n✅ Released successfully!'));
    console.log(chalk.cyan(`Version: ${newVersion}`));
}
function isGitRepo() {
    try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
function hasUncommittedChanges() {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' });
        return status.trim().length > 0;
    }
    catch {
        return false;
    }
}
function getCurrentVersion() {
    const packageJsonPath = resolve('package.json');
    if (!existsSync(packageJsonPath)) {
        return '0.0.0';
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '0.0.0';
}
function parseVersion(version) {
    const parts = version.split('.').map(Number);
    return {
        major: parts[0] || 0,
        minor: parts[1] || 0,
        patch: parts[2] || 0
    };
}
function formatVersion(version) {
    return `${version.major}.${version.minor}.${version.patch}`;
}
function calculateNewVersion(current, bump) {
    // If bump is a full semver, use it directly
    if (/^\d+\.\d+\.\d+/.test(bump)) {
        return bump;
    }
    const version = parseVersion(current);
    switch (bump) {
        case 'major':
            version.major++;
            version.minor = 0;
            version.patch = 0;
            break;
        case 'minor':
            version.minor++;
            version.patch = 0;
            break;
        case 'patch':
        default:
            version.patch++;
    }
    return formatVersion(version);
}
function generateChangelog() {
    try {
        // Get commits since last tag
        const lastTag = getLastTag();
        const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
        const output = execSync(`git log ${range} --pretty=format:"%h|%s|%b---END---"`, { encoding: 'utf-8' });
        const commits = output.split('---END---').filter(c => c.trim());
        const entries = [];
        for (const commit of commits) {
            const lines = commit.trim().split('\n');
            const header = lines[0];
            const match = header.match(/^([a-f0-9]+)\|(.+)$/);
            if (match) {
                const [, hash, message] = match;
                const parsed = parseCommitMessage(message);
                if (parsed.type && parsed.subject) {
                    entries.push(`[${parsed.type}] ${parsed.subject}`);
                }
            }
        }
        return entries;
    }
    catch (error) {
        return [];
    }
}
function parseCommitMessage(message) {
    // Conventional commit format: type(scope): subject
    const match = message.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
    if (match) {
        return {
            type: match[1],
            scope: match[2],
            subject: match[3]
        };
    }
    return { subject: message };
}
function getLastTag() {
    try {
        return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    }
    catch {
        return null;
    }
}
function updateVersion(newVersion) {
    const packageJsonPath = resolve('package.json');
    if (!existsSync(packageJsonPath)) {
        return;
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    packageJson.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(chalk.gray('Updated package.json'));
}
function updateChangelogFile(version, entries) {
    const changelogPath = resolve('CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];
    let existingContent = '';
    if (existsSync(changelogPath)) {
        existingContent = readFileSync(changelogPath, 'utf-8');
    }
    const newSection = `## [${version}] - ${date}\n\n${entries.map(e => `- ${e}`).join('\n')}\n\n`;
    const newContent = existingContent.startsWith('# Changelog')
        ? existingContent.replace('# Changelog\n\n', `# Changelog\n\n${newSection}`)
        : `# Changelog\n\n${newSection}${existingContent}`;
    writeFileSync(changelogPath, newContent);
    console.log(chalk.gray('Updated CHANGELOG.md'));
}
function commitVersionBump(version) {
    try {
        execSync('git add package.json CHANGELOG.md', { stdio: 'pipe' });
        execSync(`git commit -m "chore(release): ${version}"`, { stdio: 'pipe' });
        console.log(chalk.gray('Committed version bump'));
    }
    catch (error) {
        console.warn(chalk.yellow('Warning: Could not commit version bump'));
    }
}
function createGitTag(version) {
    try {
        const tagName = `v${version}`;
        execSync(`git tag -a ${tagName} -m "Release ${version}"`, { stdio: 'pipe' });
        console.log(chalk.gray(`Created tag: ${tagName}`));
    }
    catch (error) {
        console.error(chalk.red('Error creating tag:'), error);
        throw error;
    }
}
function pushToRemote(version) {
    try {
        execSync('git push', { stdio: 'pipe' });
        execSync(`git push origin v${version}`, { stdio: 'pipe' });
        console.log(chalk.gray('Pushed to remote'));
    }
    catch (error) {
        console.warn(chalk.yellow('Warning: Could not push to remote'));
    }
}
async function createGitHubRelease(version, changelog) {
    const tagName = `v${version}`;
    const title = `Release ${version}`;
    const body = changelog.map(e => `- ${e}`).join('\n') || 'No changes';
    try {
        // Check if gh CLI is available
        execSync('which gh', { stdio: 'pipe' });
        const command = `gh release create ${tagName} --title "${title}" --notes "${body}"`;
        execSync(command, { stdio: 'pipe' });
        console.log(chalk.gray('Created GitHub release'));
    }
    catch (error) {
        console.warn(chalk.yellow('Warning: Could not create GitHub release'));
        console.warn(chalk.yellow('Ensure GH_TOKEN is set or gh CLI is authenticated'));
    }
}
//# sourceMappingURL=index.js.map