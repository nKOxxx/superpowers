#!/usr/bin/env node
/**
 * /ship - Release Pipeline Skill
 * One-command releases: version bump, changelog, GitHub release
 */
import { execSync } from 'child_process';
import { loadConfig } from './lib/config.js';
import { bumpVersion } from './lib/version.js';
import { generateChangelog } from './lib/changelog.js';
import { createGitHubRelease } from './lib/github.js';
import { sendTelegramNotification } from './lib/telegram.js';
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printHelp();
        process.exit(0);
    }
    const options = parseShipArgs(args);
    const config = await loadConfig();
    console.log(`🚀 Ship: ${options.repo} ${options.version}`);
    if (options.dryRun) {
        console.log('🔍 DRY RUN - No changes will be made');
    }
    console.log('='.repeat(50));
    try {
        const result = await runShip(options, config);
        if (result.success) {
            console.log('\n✅ Release successful!');
            console.log(`Version: ${result.version}`);
            console.log(`Tag: ${result.tag}`);
            if (result.githubUrl) {
                console.log(`Release: ${result.githubUrl}`);
            }
        }
        else {
            console.error('\n❌ Release failed:', result.error);
            process.exit(1);
        }
    }
    catch (error) {
        console.error('\n❌ Ship failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
function parseShipArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--repo' || arg === '-r') {
            options.repo = args[++i];
        }
        else if (arg === '--version' || arg === '-v') {
            options.version = args[++i];
        }
        else if (arg === '--dry-run' || arg === '-d') {
            options.dryRun = true;
        }
        else if (arg === '--skip-tests') {
            options.skipTests = true;
        }
        else if (arg === '--notes' || arg === '-n') {
            options.notes = args[++i];
        }
        else if (arg === '--force' || arg === '-f') {
            options.force = true;
        }
    }
    if (!options.repo || !options.version) {
        console.error('Error: --repo and --version are required');
        printHelp();
        process.exit(1);
    }
    return options;
}
async function runShip(options, config) {
    // Validation checks
    if (!options.dryRun) {
        // Check working directory
        if (config?.ship?.requireCleanWorkingDir !== false && !options.force) {
            const status = execSync('git status --porcelain', { encoding: 'utf-8' });
            if (status.trim()) {
                throw new Error('Working directory not clean. Use --force to override.');
            }
        }
        // Run tests
        if (config?.ship?.runTestsBeforeRelease !== false && !options.skipTests) {
            console.log('🧪 Running tests...');
            const testCommand = config?.ship?.testCommand || 'npm test';
            try {
                execSync(testCommand, { stdio: 'inherit' });
            }
            catch {
                throw new Error('Tests failed. Fix before shipping or use --skip-tests');
            }
        }
    }
    // Bump version
    console.log('📦 Bumping version...');
    const newVersion = await bumpVersion(options.version, { dryRun: options.dryRun });
    // Generate changelog
    console.log('📝 Generating changelog...');
    const changelog = await generateChangelog(newVersion, {
        dryRun: options.dryRun,
        preset: config?.ship?.changelog?.preset || 'conventional'
    });
    if (!options.dryRun) {
        // Commit changes
        console.log('💾 Committing changes...');
        execSync('git add -A');
        execSync(`git commit -m "chore(release): ${newVersion}"`);
        // Create tag
        const tag = `v${newVersion}`;
        console.log(`🏷️  Creating tag: ${tag}`);
        execSync(`git tag -a ${tag} -m "Release ${newVersion}"`);
        // Push to remote
        console.log('📤 Pushing to remote...');
        execSync('git push origin HEAD');
        execSync('git push origin --tags');
        // Create GitHub release
        let githubUrl;
        if (config?.github?.token || process.env.GH_TOKEN) {
            console.log('🐙 Creating GitHub release...');
            githubUrl = await createGitHubRelease(options.repo, {
                tag,
                version: newVersion,
                notes: options.notes || changelog,
                token: config?.github?.token || process.env.GH_TOKEN
            });
        }
        // Telegram notification
        if (config?.telegram?.notifyOnShip) {
            await sendTelegramNotification(config.telegram.target, {
                repo: options.repo,
                version: newVersion,
                url: githubUrl
            });
        }
        return {
            success: true,
            version: newVersion,
            tag,
            changelog,
            githubUrl
        };
    }
    return {
        success: true,
        version: newVersion,
        tag: `v${newVersion}`,
        changelog
    };
}
function printHelp() {
    console.log(`
/ship - Release Pipeline

Usage:
  ship --repo=<owner/repo> --version=<type|semver> [options]

Options:
  --repo, -r        Repository (owner/repo format)
  --version, -v     Version bump: patch, minor, major, or specific semver
  --dry-run, -d     Preview changes without applying
  --skip-tests      Skip test execution
  --notes, -n       Custom release notes
  --force, -f       Force release even with uncommitted changes
  --help            Show this help

Examples:
  ship --repo=nKOxxx/app --version=patch
  ship --repo=nKOxxx/app --version=minor --dry-run
  ship --repo=nKOxxx/app --version=1.2.0 --notes="Bug fixes"
`);
}
main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
//# sourceMappingURL=ship.js.map