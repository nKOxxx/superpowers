import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import pc from 'picocolors';
import ora from 'ora';
import semver from 'semver';
export async function shipCommand(options) {
    console.log(pc.blue('══════════════════════════════════════════════════'));
    console.log(pc.blue('Release Pipeline'));
    console.log(pc.blue('══════════════════════════════════════════════════\n'));
    if (options.dryRun) {
        console.log(pc.yellow('⚠ DRY RUN MODE - No changes will be made\n'));
    }
    const spinner = ora('Validating repository...').start();
    try {
        // Step 1: Validate git status
        spinner.text = 'Checking git status...';
        const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8', stdio: 'pipe' });
        if (gitStatus.trim() !== '') {
            spinner.fail(pc.red('Working directory is not clean. Commit or stash changes first.'));
            console.log(pc.gray(gitStatus));
            process.exit(1);
        }
        // Step 2: Read current version
        spinner.text = 'Reading package.json...';
        const packagePath = path.resolve(process.cwd(), 'package.json');
        const packageContent = await fs.readFile(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent);
        const currentVersion = packageJson.version;
        // Step 3: Calculate new version
        let newVersion;
        if (['patch', 'minor', 'major'].includes(options.version)) {
            const bumped = semver.inc(currentVersion, options.version);
            if (!bumped) {
                throw new Error(`Failed to bump version: ${currentVersion} with ${options.version}`);
            }
            newVersion = bumped;
        }
        else {
            // Explicit version
            if (!semver.valid(options.version)) {
                throw new Error(`Invalid version: ${options.version}`);
            }
            newVersion = options.version;
        }
        spinner.stop();
        console.log(pc.cyan(`Current version: ${currentVersion}`));
        console.log(pc.cyan(`New version: ${newVersion}\n`));
        if (options.dryRun) {
            console.log(pc.yellow('Dry run - would execute:'));
            console.log(pc.gray('  1. Update version in package.json'));
            console.log(pc.gray('  2. Generate changelog'));
            console.log(pc.gray('  3. Create release commit'));
            console.log(pc.gray('  4. Create git tag'));
            console.log(pc.gray('  5. Push to remote'));
            if (process.env.GH_TOKEN) {
                console.log(pc.gray('  6. Create GitHub release'));
            }
            return;
        }
        // Step 4: Run tests
        if (!options.skipTests) {
            spinner.start('Running tests...');
            try {
                execSync('npm test', { stdio: 'pipe' });
                spinner.succeed('Tests passed');
            }
            catch {
                spinner.fail('Tests failed. Use --skip-tests to bypass.');
                process.exit(1);
            }
        }
        // Step 5: Update version
        spinner.start('Updating version...');
        packageJson.version = newVersion;
        await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        spinner.succeed(`Version updated to ${newVersion}`);
        // Step 6: Generate changelog
        spinner.start('Generating changelog...');
        const changelog = await generateChangelog(currentVersion);
        // Update CHANGELOG.md
        const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
        let existingChangelog = '';
        try {
            existingChangelog = await fs.readFile(changelogPath, 'utf-8');
        }
        catch {
            // File doesn't exist yet
        }
        const newChangelogEntry = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n${changelog}\n`;
        const updatedChangelog = existingChangelog
            ? newChangelogEntry + '\n' + existingChangelog
            : '# Changelog\n\n' + newChangelogEntry;
        await fs.writeFile(changelogPath, updatedChangelog);
        spinner.succeed('Changelog updated');
        // Step 7: Create release commit
        spinner.start('Creating release commit...');
        execSync('git add package.json CHANGELOG.md', { stdio: 'pipe' });
        execSync(`git commit -m "chore(release): ${newVersion}"`, { stdio: 'pipe' });
        spinner.succeed('Commit created');
        // Step 8: Create git tag
        spinner.start('Creating git tag...');
        execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'pipe' });
        spinner.succeed(`Tag v${newVersion} created`);
        // Step 9: Push to remote
        spinner.start('Pushing to remote...');
        execSync('git push origin HEAD', { stdio: 'pipe' });
        execSync(`git push origin v${newVersion}`, { stdio: 'pipe' });
        spinner.succeed('Pushed to remote');
        // Step 10: Create GitHub release
        if (process.env.GH_TOKEN) {
            spinner.start('Creating GitHub release...');
            await createGitHubRelease(options, newVersion, changelog);
            spinner.succeed('GitHub release created');
        }
        console.log();
        console.log(pc.green('✓'), pc.bold(`Released ${newVersion}`));
    }
    catch (error) {
        spinner.fail(pc.red(`Release failed: ${error instanceof Error ? error.message : String(error)}`));
        throw error;
    }
}
async function generateChangelog(sinceTag) {
    try {
        // Get commits since last tag
        const log = execSync(`git log v${sinceTag}..HEAD --pretty=format:"%s" --no-merges`, { encoding: 'utf-8', stdio: 'pipe' });
        const commits = log.split('\n').filter(c => c.trim() !== '');
        const features = [];
        const fixes = [];
        const chores = [];
        const others = [];
        for (const commit of commits) {
            const cleanCommit = commit.replace(/^\w+\(|\):/g, '').trim();
            if (commit.startsWith('feat:') || commit.startsWith('feat(')) {
                features.push(cleanCommit);
            }
            else if (commit.startsWith('fix:') || commit.startsWith('fix(')) {
                fixes.push(cleanCommit);
            }
            else if (commit.startsWith('chore:') || commit.startsWith('chore(')) {
                chores.push(cleanCommit);
            }
            else if (!commit.startsWith('release:') && !commit.startsWith('chore(release)')) {
                others.push(commit);
            }
        }
        let changelog = '';
        if (features.length > 0) {
            changelog += '### Features\n';
            for (const feat of features) {
                changelog += `- ${feat}\n`;
            }
            changelog += '\n';
        }
        if (fixes.length > 0) {
            changelog += '### Bug Fixes\n';
            for (const fix of fixes) {
                changelog += `- ${fix}\n`;
            }
            changelog += '\n';
        }
        if (chores.length > 0) {
            changelog += '### Chores\n';
            for (const chore of chores) {
                changelog += `- ${chore}\n`;
            }
            changelog += '\n';
        }
        if (others.length > 0) {
            changelog += '### Other Changes\n';
            for (const other of others.slice(0, 10)) {
                changelog += `- ${other}\n`;
            }
            if (others.length > 10) {
                changelog += `- ... and ${others.length - 10} more changes\n`;
            }
        }
        return changelog.trim() || 'No notable changes';
    }
    catch {
        return 'See commit history for changes';
    }
}
async function createGitHubRelease(options, version, changelog) {
    const repo = options.repo || await detectRepo();
    if (!repo) {
        throw new Error('Could not detect repository. Use --repo=owner/repo');
    }
    const releaseNotes = options.notes || changelog;
    // Use GitHub CLI if available
    try {
        execSync('which gh', { stdio: 'pipe' });
        const prereleaseFlag = options.prerelease ? '--prerelease' : '';
        const cmd = `echo ${JSON.stringify(releaseNotes)} | gh release create v${version} \
      --title "v${version}" \
      --notes-file - \
      ${prereleaseFlag}`.trim();
        execSync(cmd, {
            stdio: 'pipe',
            env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN }
        });
    }
    catch {
        // Fallback: GitHub API
        const response = await fetch(`https://api.github.com/repos/${repo}/releases`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GH_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tag_name: `v${version}`,
                name: `v${version}`,
                body: releaseNotes,
                prerelease: options.prerelease
            })
        });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
        }
    }
}
async function detectRepo() {
    try {
        const remote = execSync('git remote get-url origin', { encoding: 'utf-8', stdio: 'pipe' });
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (match) {
            return `${match[1]}/${match[2]}`;
        }
    }
    catch {
        // Ignore
    }
    return null;
}
