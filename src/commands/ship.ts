import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { 
  isGitRepo, 
  isWorkingDirectoryClean, 
  getLastTag,
  getCommitsSinceLastTag,
  createTag,
  pushToRemote,
  commitAll,
  getRepoFromRemote
} from '../lib/git.js';
import {
  generateChangelog,
  bumpVersion,
  updatePackageVersion,
  getCurrentVersion,
  updateChangelog
} from '../lib/utils.js';
import {
  createGitHubRelease,
  hasGitHubToken,
  getGitHubToken
} from '../lib/github.js';
import type { ShipOptions } from '../types/index.js';

export const shipCommand = new Command('ship')
  .description('One-command release pipeline')
  .requiredOption('-v, --version <type>', 'Version bump: patch, minor, major, or explicit version')
  .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
  .option('-d, --dry-run', 'Preview changes without executing')
  .option('-s, --skip-tests', 'Skip test run before release')
  .option('-n, --notes <text>', 'Custom release notes')
  .option('-p, --prerelease', 'Mark as prerelease')
  .action(async (options: ShipOptions) => {
    console.log(chalk.blue('══════════════════════════════════════════════════'));
    console.log(chalk.blue('Release Pipeline'));
    console.log(chalk.blue('══════════════════════════════════════════════════\n'));
    
    try {
      // Validate git repo
      if (!isGitRepo()) {
        console.error(chalk.red('✗ Not a git repository'));
        process.exit(1);
      }
      
      // Check working directory
      if (!isWorkingDirectoryClean() && !options.dryRun) {
        console.error(chalk.red('✗ Working directory is not clean'));
        console.log(chalk.gray('Commit or stash your changes first'));
        process.exit(1);
      }
      
      // Get current and new version
      const currentVersion = getCurrentVersion();
      const newVersion = bumpVersion(currentVersion, options.version);
      
      console.log(chalk.gray(`Current version: ${currentVersion}`));
      console.log(chalk.gray(`New version: ${newVersion}`));
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n[DRY RUN] No changes will be made\n'));
      }
      
      // Run tests
      if (!options.skipTests && !options.dryRun) {
        console.log(chalk.blue('\nRunning tests...'));
        try {
          execSync('npm test', { stdio: 'inherit' });
          console.log(chalk.green('✓ Tests passed\n'));
        } catch {
          console.error(chalk.red('✗ Tests failed'));
          process.exit(1);
        }
      } else if (options.skipTests) {
        console.log(chalk.yellow('\n⚠ Skipping tests\n'));
      }
      
      // Get commits for changelog
      const commits = getCommitsSinceLastTag();
      console.log(chalk.blue(`Commits since last tag: ${commits.length}`));
      
      // Generate changelog
      const changelog = generateChangelog(newVersion, commits, currentVersion);
      
      if (options.dryRun) {
        console.log(chalk.blue('\nChangelog preview:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(changelog);
        console.log(chalk.gray('─'.repeat(50)));
      }
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n[DRY RUN] Release preview complete'));
        console.log(chalk.gray('Remove --dry-run to execute'));
        return;
      }
      
      // Update version
      console.log(chalk.blue('\nUpdating version...'));
      updatePackageVersion(newVersion);
      console.log(chalk.green(`✓ Version updated to ${newVersion}`));
      
      // Update changelog
      console.log(chalk.blue('\nGenerating changelog...'));
      updateChangelog(changelog);
      console.log(chalk.green('✓ Changelog updated'));
      
      // Create release commit
      console.log(chalk.blue('\nCreating release commit...'));
      commitAll(`chore(release): v${newVersion}`);
      console.log(chalk.green('✓ Commit created'));
      
      // Create tag
      console.log(chalk.blue('\nCreating git tag...'));
      createTag(newVersion);
      console.log(chalk.green(`✓ Tag v${newVersion} created`));
      
      // Push to remote
      console.log(chalk.blue('\nPushing to remote...'));
      pushToRemote();
      console.log(chalk.green('✓ Pushed to remote'));
      
      // Create GitHub release
      if (hasGitHubToken()) {
        const repo = options.repo || getRepoFromRemote();
        if (repo) {
          console.log(chalk.blue('\nCreating GitHub release...'));
          const releaseNotes = options.notes 
            ? `${options.notes}\n\n${changelog}` 
            : changelog;
          
          await createGitHubRelease(
            repo,
            newVersion,
            releaseNotes,
            getGitHubToken()!,
            options.prerelease || false
          );
          console.log(chalk.green('✓ GitHub release created'));
        } else {
          console.log(chalk.yellow('\n⚠ Could not detect repo, skipping GitHub release'));
        }
      } else {
        console.log(chalk.yellow('\n⚠ GH_TOKEN not set, skipping GitHub release'));
      }
      
      console.log(chalk.blue('\n══════════════════════════════════════════════════'));
      console.log(chalk.green(`✓ Released v${newVersion}`));
      console.log(chalk.blue('══════════════════════════════════════════════════'));
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
