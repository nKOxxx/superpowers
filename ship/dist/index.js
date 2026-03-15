import { execSync } from 'child_process';
import * as fs from 'fs';
import semver from 'semver';
export function getCurrentVersion() {
    if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return pkg.version || '0.0.0';
    }
    // Try git tags
    try {
        const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
        return tag.replace(/^v/, '');
    }
    catch {
        return '0.0.0';
    }
}
export function bumpVersion(currentVersion, bumpType) {
    if (semver.valid(bumpType)) {
        return bumpType;
    }
    switch (bumpType) {
        case 'patch':
            return semver.inc(currentVersion, 'patch') || currentVersion;
        case 'minor':
            return semver.inc(currentVersion, 'minor') || currentVersion;
        case 'major':
            return semver.inc(currentVersion, 'major') || currentVersion;
        default:
            throw new Error(`Invalid version bump: ${bumpType}`);
    }
}
export function generateChangelog(newVersion) {
    let lastTag = '';
    try {
        lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    }
    catch {
        // No previous tag
    }
    const commitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    let commits = '';
    try {
        commits = execSync(`git log ${commitRange} --pretty=format:"%s"`, { encoding: 'utf8' });
    }
    catch {
        commits = execSync('git log --pretty=format:"%s" -10', { encoding: 'utf8' });
    }
    const sections = {
        'Features': [],
        'Bug Fixes': [],
        'Documentation': [],
        'Code Refactoring': [],
        'Tests': [],
        'Chores': [],
        'Other': []
    };
    const breakingChanges = [];
    for (const line of commits.split('\n')) {
        const commit = line.trim();
        if (commit.match(/^feat(\(.+\))?:/i)) {
            sections['Features'].push(commit.replace(/^feat(\(.+\))?:\s*/i, ''));
        }
        else if (commit.match(/^fix(\(.+\))?:/i)) {
            sections['Bug Fixes'].push(commit.replace(/^fix(\(.+\))?:\s*/i, ''));
        }
        else if (commit.match(/^docs(\(.+\))?:/i)) {
            sections['Documentation'].push(commit.replace(/^docs(\(.+\))?:\s*/i, ''));
        }
        else if (commit.match(/^refactor(\(.+\))?:/i)) {
            sections['Code Refactoring'].push(commit.replace(/^refactor(\(.+\))?:\s*/i, ''));
        }
        else if (commit.match(/^test(\(.+\))?:/i)) {
            sections['Tests'].push(commit.replace(/^test(\(.+\))?:\s*/i, ''));
        }
        else if (commit.match(/^chore(\(.+\))?:/i)) {
            sections['Chores'].push(commit.replace(/^chore(\(.+\))?:\s*/i, ''));
        }
        else if (commit.includes('BREAKING CHANGE')) {
            breakingChanges.push(commit);
        }
        else {
            sections['Other'].push(commit);
        }
    }
    let changelog = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n`;
    for (const [section, items] of Object.entries(sections)) {
        if (items.length > 0) {
            changelog += `### ${section}\n`;
            for (const item of items) {
                changelog += `- ${item}\n`;
            }
            changelog += '\n';
        }
    }
    if (breakingChanges.length > 0) {
        changelog += '### Breaking Changes\n';
        for (const item of breakingChanges) {
            changelog += `- ${item}\n`;
        }
        changelog += '\n';
    }
    return changelog;
}
export function ship(options) {
    const currentVersion = getCurrentVersion();
    const newVersion = bumpVersion(currentVersion, options.version);
    if (options.dryRun) {
        return {
            oldVersion: currentVersion,
            newVersion,
            changelog: generateChangelog(newVersion),
            tagCreated: false,
            pushed: false,
            released: false
        };
    }
    // Update package.json if exists
    if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = newVersion;
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        execSync('git add package.json');
    }
    // Update CHANGELOG.md
    const changelog = generateChangelog(newVersion);
    const changelogPath = 'CHANGELOG.md';
    if (fs.existsSync(changelogPath)) {
        const existing = fs.readFileSync(changelogPath, 'utf8');
        fs.writeFileSync(changelogPath, `# Changelog\n\n${changelog}\n${existing.replace('# Changelog\n\n', '')}`);
    }
    else {
        fs.writeFileSync(changelogPath, `# Changelog\n\n${changelog}`);
    }
    execSync('git add CHANGELOG.md');
    // Commit
    execSync(`git commit -m "chore(release): v${newVersion}"`);
    // Create tag
    execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
    // Push
    let pushed = false;
    if (!options.noPush) {
        try {
            execSync('git push origin HEAD');
            execSync(`git push origin v${newVersion}`);
            pushed = true;
        }
        catch {
            // Push failed
        }
    }
    // Create GitHub release
    let released = false;
    let releaseUrl;
    if (!options.noRelease && process.env.GH_TOKEN) {
        try {
            const repoUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
            const repoMatch = repoUrl.match(/github\.com[:/](.+?)(\.git)?$/);
            if (repoMatch) {
                const repo = repoMatch[1];
                const escapedChangelog = changelog.replace(/"/g, '\\"').replace(/\n/g, '\\n');
                execSync(`curl -X POST -H "Authorization: token ${process.env.GH_TOKEN}" \
          -H "Accept: application/vnd.github.v3+json" \
          https://api.github.com/repos/${repo}/releases \
          -d '{"tag_name":"v${newVersion}","name":"Release v${newVersion}","body":"${escapedChangelog}"}'`, { stdio: 'pipe' });
                released = true;
                releaseUrl = `https://github.com/${repo}/releases/tag/v${newVersion}`;
            }
        }
        catch {
            // Release creation failed
        }
    }
    return {
        oldVersion: currentVersion,
        newVersion,
        changelog,
        tagCreated: true,
        pushed,
        released,
        releaseUrl
    };
}
//# sourceMappingURL=index.js.map