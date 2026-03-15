"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipCommand = shipCommand;
const child_process_1 = require("child_process");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const picocolors_1 = __importDefault(require("picocolors"));
const ora_1 = __importDefault(require("ora"));
const semver_1 = __importDefault(require("semver"));
async function shipCommand(options) {
    console.log(picocolors_1.default.blue('══════════════════════════════════════════════════'));
    console.log(picocolors_1.default.blue('Release Pipeline'));
    console.log(picocolors_1.default.blue('══════════════════════════════════════════════════\n'));
    if (options.dryRun) {
        console.log(picocolors_1.default.yellow('⚠ DRY RUN MODE - No changes will be made\n'));
    }
    const spinner = (0, ora_1.default)('Validating repository...').start();
    try {
        // Step 1: Validate git status
        spinner.text = 'Checking git status...';
        const gitStatus = (0, child_process_1.execSync)('git status --porcelain', { encoding: 'utf-8', stdio: 'pipe' });
        if (gitStatus.trim() !== '') {
            spinner.fail(picocolors_1.default.red('Working directory is not clean. Commit or stash changes first.'));
            console.log(picocolors_1.default.gray(gitStatus));
            process.exit(1);
        }
        // Step 2: Read current version
        spinner.text = 'Reading package.json...';
        const packagePath = path_1.default.resolve(process.cwd(), 'package.json');
        const packageContent = await promises_1.default.readFile(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent);
        const currentVersion = packageJson.version;
        // Step 3: Calculate new version
        let newVersion;
        if (['patch', 'minor', 'major'].includes(options.version)) {
            const bumped = semver_1.default.inc(currentVersion, options.version);
            if (!bumped) {
                throw new Error(`Failed to bump version: ${currentVersion} with ${options.version}`);
            }
            newVersion = bumped;
        }
        else {
            // Explicit version
            if (!semver_1.default.valid(options.version)) {
                throw new Error(`Invalid version: ${options.version}`);
            }
            newVersion = options.version;
        }
        spinner.stop();
        console.log(picocolors_1.default.cyan(`Current version: ${currentVersion}`));
        console.log(picocolors_1.default.cyan(`New version: ${newVersion}\n`));
        if (options.dryRun) {
            console.log(picocolors_1.default.yellow('Dry run - would execute:'));
            console.log(picocolors_1.default.gray('  1. Update version in package.json'));
            console.log(picocolors_1.default.gray('  2. Generate changelog'));
            console.log(picocolors_1.default.gray('  3. Create release commit'));
            console.log(picocolors_1.default.gray('  4. Create git tag'));
            console.log(picocolors_1.default.gray('  5. Push to remote'));
            if (process.env.GH_TOKEN) {
                console.log(picocolors_1.default.gray('  6. Create GitHub release'));
            }
            return;
        }
        // Step 4: Run tests
        if (!options.skipTests) {
            spinner.start('Running tests...');
            try {
                (0, child_process_1.execSync)('npm test', { stdio: 'pipe' });
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
        await promises_1.default.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        spinner.succeed(`Version updated to ${newVersion}`);
        // Step 6: Generate changelog
        spinner.start('Generating changelog...');
        const changelog = await generateChangelog(currentVersion);
        // Update CHANGELOG.md
        const changelogPath = path_1.default.resolve(process.cwd(), 'CHANGELOG.md');
        let existingChangelog = '';
        try {
            existingChangelog = await promises_1.default.readFile(changelogPath, 'utf-8');
        }
        catch {
            // File doesn't exist yet
        }
        const newChangelogEntry = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n${changelog}\n`;
        const updatedChangelog = existingChangelog
            ? newChangelogEntry + '\n' + existingChangelog
            : '# Changelog\n\n' + newChangelogEntry;
        await promises_1.default.writeFile(changelogPath, updatedChangelog);
        spinner.succeed('Changelog updated');
        // Step 7: Create release commit
        spinner.start('Creating release commit...');
        (0, child_process_1.execSync)('git add package.json CHANGELOG.md', { stdio: 'pipe' });
        (0, child_process_1.execSync)(`git commit -m "chore(release): ${newVersion}"`, { stdio: 'pipe' });
        spinner.succeed('Commit created');
        // Step 8: Create git tag
        spinner.start('Creating git tag...');
        (0, child_process_1.execSync)(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'pipe' });
        spinner.succeed(`Tag v${newVersion} created`);
        // Step 9: Push to remote
        spinner.start('Pushing to remote...');
        (0, child_process_1.execSync)('git push origin HEAD', { stdio: 'pipe' });
        (0, child_process_1.execSync)(`git push origin v${newVersion}`, { stdio: 'pipe' });
        spinner.succeed('Pushed to remote');
        // Step 10: Create GitHub release
        if (process.env.GH_TOKEN) {
            spinner.start('Creating GitHub release...');
            await createGitHubRelease(options, newVersion, changelog);
            spinner.succeed('GitHub release created');
        }
        console.log();
        console.log(picocolors_1.default.green('✓'), picocolors_1.default.bold(`Released ${newVersion}`));
    }
    catch (error) {
        spinner.fail(picocolors_1.default.red(`Release failed: ${error instanceof Error ? error.message : String(error)}`));
        throw error;
    }
}
async function generateChangelog(sinceTag) {
    try {
        // Get commits since last tag
        const log = (0, child_process_1.execSync)(`git log v${sinceTag}..HEAD --pretty=format:"%s" --no-merges`, { encoding: 'utf-8', stdio: 'pipe' });
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
        (0, child_process_1.execSync)('which gh', { stdio: 'pipe' });
        const prereleaseFlag = options.prerelease ? '--prerelease' : '';
        const cmd = `echo ${JSON.stringify(releaseNotes)} | gh release create v${version} \
      --title "v${version}" \
      --notes-file - \
      ${prereleaseFlag}`.trim();
        (0, child_process_1.execSync)(cmd, {
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
        const remote = (0, child_process_1.execSync)('git remote get-url origin', { encoding: 'utf-8', stdio: 'pipe' });
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
//# sourceMappingURL=index.js.map