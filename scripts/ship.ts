#!/usr/bin/env tsx
/**
 * /ship - Release Pipeline Skill
 * 
 * One-command release: version bump, changelog, GitHub release
 */
import { Command } from 'commander';
import pc from 'picocolors';
import { loadConfig } from './lib/config.js';
import { bump, validateBump, type VersionBump } from './lib/version.js';
import { generateChangelogEntry, getCommits, updateChangelog, getLastTag } from './lib/changelog.js';
import {
  getRepoFromGit,
  parseRepo,
  isWorkingDirectoryClean,
  createReleaseCommit,
  createGitTag,
  pushCommits,
  pushTag,
  createRelease,
  sendTelegramNotification
} from './lib/github.js';
import { runTests } from './lib/test-runner.js';

const program = new Command();

program
  .name('ship')
  .description('One-command release pipeline')
  .version('1.0.0');

program
  .requiredOption('-r, --repo <repo>', 'Repository (owner/repo or just repo for default org)')
  .requiredOption('-v, --version <bump>', 'Version bump: patch, minor, major, or explicit version (x.y.z)')
  .option('-d, --dry-run', 'Preview changes without executing', false)
  .option('--skip-tests', 'Skip running tests', false)
  .option('--skip-commit', 'Skip creating release commit', false)
  .option('--skip-tag', 'Skip creating git tag', false)
  .option('--skip-release', 'Skip creating GitHub release', false)
  .option('--skip-push', 'Skip pushing to remote', false)
  .option('--force', 'Force release even with dirty working directory', false)
  .option('--notes <text>', 'Custom release notes')
  .option('--config <path>', 'Path to config file')
  .action(async (options: { repo: string; version: string; dryRun?: boolean; skipTests?: boolean; skipCommit?: boolean; skipTag?: boolean; skipRelease?: boolean; skipPush?: boolean; force?: boolean; notes?: string; config?: string }) => {
    try {
      const config = loadConfig(options.config);
      
      console.log(pc.cyan('🚢 Ship: Release Pipeline'));
      console.log(pc.gray(`Repository: ${options.repo}`));
      console.log(pc.gray(`Version: ${options.version}`));
      console.log('');

      // Parse repo
      let owner: string;
      let repo: string;
      
      if (options.repo.includes('/')) {
        ({ owner, repo } = parseRepo(options.repo));
      } else {
        // Use default org from config
        const gitInfo = getRepoFromGit();
        owner = config.ship.github.defaultOrg || gitInfo.owner;
        repo = options.repo;
      }

      // Check working directory
      if (!options.force && config.ship.requireCleanWorkingDir) {
        if (!isWorkingDirectoryClean()) {
          console.error(pc.red('❌ Working directory is not clean'));
          console.error(pc.gray('Commit or stash changes first, or use --force'));
          process.exit(1);
        }
        console.log(pc.green('✅ Working directory is clean'));
      }

      // Bump version
      const bumpType = options.version as VersionBump;
      const versionResult = bump(bumpType);
      
      console.log(pc.yellow(`📦 Version: ${versionResult.oldVersion} → ${versionResult.newVersion}`));

      // Validate version bump
      const validation = validateBump(versionResult.oldVersion, versionResult.newVersion);
      if (!validation.valid) {
        console.error(pc.red(`❌ Invalid version bump: ${validation.reason}`));
        process.exit(1);
      }

      // Run tests
      if (!options.skipTests && config.ship.runTestsBeforeRelease) {
        console.log(pc.yellow('🧪 Running tests...'));
        
        if (options.dryRun) {
          console.log(pc.blue('📋 Would run:'), config.ship.testCommand);
        } else {
          const testResult = await runTests(config.ship.testCommand, { silent: true });
          
          if (!testResult.passed) {
            console.error(pc.red('❌ Tests failed'));
            if (testResult.stats) {
              console.error(pc.gray(`  ${testResult.stats.failed} tests failed`));
            }
            process.exit(1);
          }
          
          console.log(pc.green(`✅ Tests passed (${testResult.stats?.passed || 0} tests)`));
        }
      }

      // Generate changelog
      console.log(pc.yellow('📝 Generating changelog...'));
      
      const lastTag = getLastTag();
      const commits = getCommits(lastTag);
      
      if (options.dryRun) {
        console.log(pc.blue(`📋 Would add ${commits.length} commits to changelog`));
      } else {
        const changelogEntry = generateChangelogEntry(versionResult.newVersion, commits, {
          preset: config.ship.changelog.preset as 'conventional' | 'angular' | 'eslint',
          includeContributors: config.ship.changelog.includeContributors
        });
        
        updateChangelog(changelogEntry);
        console.log(pc.green(`✅ Changelog updated (${commits.length} commits)`));
      }

      // Create release commit
      if (!options.skipCommit) {
        console.log(pc.yellow('💾 Creating release commit...'));
        
        if (options.dryRun) {
          console.log(pc.blue('📋 Would commit:'), `chore(release): ${versionResult.newVersion}`);
        } else {
          createReleaseCommit(versionResult.newVersion, versionResult.filesUpdated);
          console.log(pc.green('✅ Release commit created'));
        }
      }

      // Create git tag
      if (!options.skipTag) {
        console.log(pc.yellow('🏷️  Creating git tag...'));
        
        const tagName = `v${versionResult.newVersion}`;
        
        if (options.dryRun) {
          console.log(pc.blue('📋 Would create tag:'), tagName);
        } else {
          createGitTag(tagName, `Release ${versionResult.newVersion}`);
          console.log(pc.green(`✅ Tag created: ${tagName}`));
        }
      }

      // Push to remote
      if (!options.skipPush) {
        console.log(pc.yellow('☁️  Pushing to remote...'));
        
        if (options.dryRun) {
          console.log(pc.blue('📋 Would push commits and tag'));
        } else {
          pushCommits();
          pushTag(`v${versionResult.newVersion}`);
          console.log(pc.green('✅ Pushed to remote'));
        }
      }

      // Create GitHub release
      if (!options.skipRelease) {
        console.log(pc.yellow('🚀 Creating GitHub release...'));
        
        const tagName = `v${versionResult.newVersion}`;
        
        if (options.dryRun) {
          console.log(pc.blue('📋 Would create release:'), tagName);
        } else {
          const release = await createRelease({
            owner,
            repo,
            tag: tagName,
            name: options.notes ? undefined : `Release ${versionResult.newVersion}`,
            body: options.notes,
            draft: false,
            prerelease: false
          });
          
          console.log(pc.green('✅ GitHub release created'));
          console.log(pc.blue(`   URL: ${release.url}`));
        }
      }

      // Send notification
      if (config.ship.telegram.notifyOnShip) {
        console.log(pc.yellow('📱 Sending notification...'));
        
        const message = `🚀 *Shipped* ${repo}@${versionResult.newVersion}`;
        
        if (options.dryRun) {
          console.log(pc.blue('📋 Would send Telegram notification'));
        } else {
          await sendTelegramNotification(message);
        }
      }

      // Summary
      console.log('');
      console.log(pc.green('✨ Release complete!'));
      console.log(pc.gray(`   Version: ${versionResult.newVersion}`));
      console.log(pc.gray(`   Tag: v${versionResult.newVersion}`));
      console.log(pc.gray(`   Repo: ${owner}/${repo}`));

      if (options.dryRun) {
        console.log('');
        console.log(pc.yellow('⚠️  This was a dry run. No changes were made.'));
      }

    } catch (error) {
      console.error(pc.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
