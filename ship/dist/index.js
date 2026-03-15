import { program } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
function parseConventionalCommit(message) {
    const patterns = {
        feat: /^feat(\(.+\))?:/,
        fix: /^fix(\(.+\))?:/,
        docs: /^docs(\(.+\))?:/,
        style: /^style(\(.+\))?:/,
        refactor: /^refactor(\(.+\))?:/,
        test: /^test(\(.+\))?:/,
        chore: /^chore(\(.+\))?:/,
    };
    for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(message))
            return type;
    }
    return 'other';
}
function isBreakingChange(message) {
    return message.includes('BREAKING CHANGE:') || message.includes('!:');
}
function getCommits(sinceTag) {
    try {
        const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD~20';
        const output = execSync(`git log ${range} --pretty=format:"%H|%s|%b" --no-merges`, { encoding: 'utf-8' });
        return output.split('\n').filter(line => line).map(line => {
            const parts = line.split('|');
            const hash = parts[0];
            const msg = parts[1] || '';
            const body = parts[2] || '';
            return {
                hash: hash.slice(0, 7),
                message: msg,
                type: parseConventionalCommit(msg),
                breaking: isBreakingChange(msg) || isBreakingChange(body)
            };
        });
    }
    catch {
        return [];
    }
}
function getCurrentVersion() {
    try {
        const pkgPath = join(process.cwd(), 'package.json');
        if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            return pkg.version || '0.0.0';
        }
    }
    catch { }
    try {
        return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim().replace(/^v/, '');
    }
    catch {
        return '0.0.0';
    }
}
function bumpVersion(current, bump) {
    const parts = current.split('.').map(Number);
    const [major, minor, patch] = parts;
    switch (bump) {
        case 'major': return `${major + 1}.0.0`;
        case 'minor': return `${major}.${minor + 1}.0`;
        case 'patch': return `${major}.${minor}.${patch + 1}`;
        default:
            // Check if it's a valid version string
            if (/^\d+\.\d+\.\d+/.test(bump))
                return bump;
            throw new Error(`Invalid version bump: ${bump}`);
    }
}
function generateChangelog(commits, newVersion) {
    const sections = {
        'Features': [],
        'Bug Fixes': [],
        'Documentation': [],
        'Styles': [],
        'Code Refactoring': [],
        'Tests': [],
        'Chores': [],
        'Other': []
    };
    for (const commit of commits) {
        switch (commit.type) {
            case 'feat':
                sections['Features'].push(commit);
                break;
            case 'fix':
                sections['Bug Fixes'].push(commit);
                break;
            case 'docs':
                sections['Documentation'].push(commit);
                break;
            case 'style':
                sections['Styles'].push(commit);
                break;
            case 'refactor':
                sections['Code Refactoring'].push(commit);
                break;
            case 'test':
                sections['Tests'].push(commit);
                break;
            case 'chore':
                sections['Chores'].push(commit);
                break;
            default: sections['Other'].push(commit);
        }
    }
    const date = new Date().toISOString().split('T')[0];
    let markdown = `## [${newVersion}] - ${date}\n\n`;
    for (const [section, items] of Object.entries(sections)) {
        if (items.length === 0)
            continue;
        markdown += `### ${section}\n\n`;
        for (const item of items) {
            const breaking = item.breaking ? ' [BREAKING]' : '';
            markdown += `- ${item.message}${breaking} (${item.hash})\n`;
        }
        markdown += '\n';
    }
    return markdown;
}
async function updateChangelog(newContent, dryRun) {
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');
    let existing = '';
    if (existsSync(changelogPath)) {
        existing = readFileSync(changelogPath, 'utf-8');
    }
    const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    const full = header + newContent + existing.replace(header, '');
    if (dryRun) {
        console.log(chalk.yellow('[DRY RUN] Would update CHANGELOG.md'));
        console.log(newContent);
    }
    else {
        writeFileSync(changelogPath, full);
        console.log(chalk.green('✅ CHANGELOG.md updated'));
    }
}
async function updatePackageVersion(version, dryRun) {
    const pkgPath = join(process.cwd(), 'package.json');
    if (!existsSync(pkgPath))
        return;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    pkg.version = version;
    if (dryRun) {
        console.log(chalk.yellow(`[DRY RUN] Would update package.json version to ${version}`));
    }
    else {
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(chalk.green(`✅ package.json updated to v${version}`));
    }
}
async function createGitTag(version, message, dryRun) {
    const tag = version.startsWith('v') ? version : `v${version}`;
    const tagMessage = message || `Release ${tag}`;
    if (dryRun) {
        console.log(chalk.yellow(`[DRY RUN] Would create git tag: ${tag}`));
    }
    else {
        execSync(`git tag -a ${tag} -m "${tagMessage}"`);
        console.log(chalk.green(`✅ Git tag created: ${tag}`));
    }
}
async function pushToRemote(dryRun) {
    if (dryRun) {
        console.log(chalk.yellow('[DRY RUN] Would push commits and tags'));
    }
    else {
        execSync('git push');
        execSync('git push --tags');
        console.log(chalk.green('✅ Pushed to remote'));
    }
}
async function createGitHubRelease(version, changelog, dryRun) {
    const token = process.env.GH_TOKEN;
    if (!token) {
        console.log(chalk.yellow('⚠️  GH_TOKEN not set, skipping GitHub release'));
        return;
    }
    const tag = version.startsWith('v') ? version : `v${version}`;
    if (dryRun) {
        console.log(chalk.yellow(`[DRY RUN] Would create GitHub release for ${tag}`));
        return;
    }
    try {
        const repo = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
        const match = repo.match(/github\.com[:/](.+?)\.git?$/);
        if (!match) {
            console.log(chalk.yellow('⚠️  Could not determine GitHub repo'));
            return;
        }
        const repoSlug = match[1];
        const response = await fetch(`https://api.github.com/repos/${repoSlug}/releases`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tag_name: tag,
                name: `Release ${tag}`,
                body: changelog,
                draft: false,
                prerelease: false
            })
        });
        if (response.ok) {
            console.log(chalk.green(`✅ GitHub release created: ${tag}`));
        }
        else {
            console.log(chalk.red(`❌ GitHub release failed: ${response.statusText}`));
        }
    }
    catch (error) {
        console.log(chalk.red(`❌ GitHub release error: ${error}`));
    }
}
export async function ship(options) {
    try {
        console.log(chalk.blue('🚀 Starting release pipeline...\n'));
        // Check git status
        try {
            execSync('git diff-index --quiet HEAD --');
        }
        catch {
            console.log(chalk.red('❌ Working directory not clean. Commit changes first.'));
            return { success: false, version: '' };
        }
        const currentVersion = getCurrentVersion();
        const newVersion = bumpVersion(currentVersion, options.version);
        console.log(chalk.gray(`   Current: v${currentVersion}`));
        console.log(chalk.gray(`   New: v${newVersion}\n`));
        // Get commits
        const commits = getCommits();
        console.log(chalk.gray(`   Found ${commits.length} commits since last tag\n`));
        // Generate changelog
        const changelog = generateChangelog(commits, newVersion);
        // Update files
        await updatePackageVersion(newVersion, options.dryRun || false);
        if (!options.skipChangelog) {
            await updateChangelog(changelog, options.dryRun || false);
        }
        // Commit version bump
        if (!options.dryRun) {
            execSync('git add -A');
            execSync(`git commit -m "chore(release): v${newVersion}"`);
            console.log(chalk.green('✅ Version bump committed'));
        }
        // Create tag
        if (!options.skipTag) {
            await createGitTag(newVersion, options.message, options.dryRun || false);
        }
        // Push
        await pushToRemote(options.dryRun || false);
        // GitHub release
        if (!options.skipRelease) {
            await createGitHubRelease(newVersion, changelog, options.dryRun || false);
        }
        console.log(chalk.green(`\n✅ Released v${newVersion}`));
        return { success: true, version: newVersion, changelog };
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`\n❌ Release failed: ${msg}`));
        return { success: false, version: '' };
    }
}
export { bumpVersion, generateChangelog, getCommits, getCurrentVersion };
// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    program
        .name('ship')
        .description('One-command release pipeline')
        .version('1.0.0')
        .argument('<version>', 'Version bump: patch, minor, major, or explicit version')
        .option('-d, --dry-run', 'Preview without making changes', false)
        .option('--skip-changelog', 'Skip changelog update', false)
        .option('--skip-tag', 'Skip git tag creation', false)
        .option('--skip-release', 'Skip GitHub release', false)
        .option('-m, --message <msg>', 'Tag message')
        .action(async (version, opts) => {
        const result = await ship({ ...opts, version });
        process.exit(result.success ? 0 : 1);
    });
    program.parse();
}
