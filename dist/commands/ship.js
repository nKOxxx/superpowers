"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const git_js_1 = require("../lib/git.js");
const utils_js_1 = require("../lib/utils.js");
const github_js_1 = require("../lib/github.js");
exports.shipCommand = new commander_1.Command('ship')
    .description('One-command release pipeline')
    .requiredOption('-v, --version <type>', 'Version bump: patch, minor, major, or explicit version')
    .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
    .option('-d, --dry-run', 'Preview changes without executing')
    .option('-s, --skip-tests', 'Skip test run before release')
    .option('-n, --notes <text>', 'Custom release notes')
    .option('-p, --prerelease', 'Mark as prerelease')
    .action(async (options) => {
    console.log(chalk_1.default.blue('══════════════════════════════════════════════════'));
    console.log(chalk_1.default.blue('Release Pipeline'));
    console.log(chalk_1.default.blue('══════════════════════════════════════════════════\n'));
    try {
        // Validate git repo
        if (!(0, git_js_1.isGitRepo)()) {
            console.error(chalk_1.default.red('✗ Not a git repository'));
            process.exit(1);
        }
        // Check working directory
        if (!(0, git_js_1.isWorkingDirectoryClean)() && !options.dryRun) {
            console.error(chalk_1.default.red('✗ Working directory is not clean'));
            console.log(chalk_1.default.gray('Commit or stash your changes first'));
            process.exit(1);
        }
        // Get current and new version
        const currentVersion = (0, utils_js_1.getCurrentVersion)();
        const newVersion = (0, utils_js_1.bumpVersion)(currentVersion, options.version);
        console.log(chalk_1.default.gray(`Current version: ${currentVersion}`));
        console.log(chalk_1.default.gray(`New version: ${newVersion}`));
        if (options.dryRun) {
            console.log(chalk_1.default.yellow('\n[DRY RUN] No changes will be made\n'));
        }
        // Run tests
        if (!options.skipTests && !options.dryRun) {
            console.log(chalk_1.default.blue('\nRunning tests...'));
            try {
                (0, child_process_1.execSync)('npm test', { stdio: 'inherit' });
                console.log(chalk_1.default.green('✓ Tests passed\n'));
            }
            catch {
                console.error(chalk_1.default.red('✗ Tests failed'));
                process.exit(1);
            }
        }
        else if (options.skipTests) {
            console.log(chalk_1.default.yellow('\n⚠ Skipping tests\n'));
        }
        // Get commits for changelog
        const commits = (0, git_js_1.getCommitsSinceLastTag)();
        console.log(chalk_1.default.blue(`Commits since last tag: ${commits.length}`));
        // Generate changelog
        const changelog = (0, utils_js_1.generateChangelog)(newVersion, commits, currentVersion);
        if (options.dryRun) {
            console.log(chalk_1.default.blue('\nChangelog preview:'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(changelog);
            console.log(chalk_1.default.gray('─'.repeat(50)));
        }
        if (options.dryRun) {
            console.log(chalk_1.default.yellow('\n[DRY RUN] Release preview complete'));
            console.log(chalk_1.default.gray('Remove --dry-run to execute'));
            return;
        }
        // Update version
        console.log(chalk_1.default.blue('\nUpdating version...'));
        (0, utils_js_1.updatePackageVersion)(newVersion);
        console.log(chalk_1.default.green(`✓ Version updated to ${newVersion}`));
        // Update changelog
        console.log(chalk_1.default.blue('\nGenerating changelog...'));
        (0, utils_js_1.updateChangelog)(changelog);
        console.log(chalk_1.default.green('✓ Changelog updated'));
        // Create release commit
        console.log(chalk_1.default.blue('\nCreating release commit...'));
        (0, git_js_1.commitAll)(`chore(release): v${newVersion}`);
        console.log(chalk_1.default.green('✓ Commit created'));
        // Create tag
        console.log(chalk_1.default.blue('\nCreating git tag...'));
        (0, git_js_1.createTag)(newVersion);
        console.log(chalk_1.default.green(`✓ Tag v${newVersion} created`));
        // Push to remote
        console.log(chalk_1.default.blue('\nPushing to remote...'));
        (0, git_js_1.pushToRemote)();
        console.log(chalk_1.default.green('✓ Pushed to remote'));
        // Create GitHub release
        if ((0, github_js_1.hasGitHubToken)()) {
            const repo = options.repo || (0, git_js_1.getRepoFromRemote)();
            if (repo) {
                console.log(chalk_1.default.blue('\nCreating GitHub release...'));
                const releaseNotes = options.notes
                    ? `${options.notes}\n\n${changelog}`
                    : changelog;
                await (0, github_js_1.createGitHubRelease)(repo, newVersion, releaseNotes, (0, github_js_1.getGitHubToken)(), options.prerelease || false);
                console.log(chalk_1.default.green('✓ GitHub release created'));
            }
            else {
                console.log(chalk_1.default.yellow('\n⚠ Could not detect repo, skipping GitHub release'));
            }
        }
        else {
            console.log(chalk_1.default.yellow('\n⚠ GH_TOKEN not set, skipping GitHub release'));
        }
        console.log(chalk_1.default.blue('\n══════════════════════════════════════════════════'));
        console.log(chalk_1.default.green(`✓ Released v${newVersion}`));
        console.log(chalk_1.default.blue('══════════════════════════════════════════════════'));
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
//# sourceMappingURL=ship.js.map