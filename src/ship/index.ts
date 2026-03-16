#!/usr/bin/env node
import { Command } from 'commander';
import { release, getStatus, preview, initConfig } from './releaser.js';
import { fileURLToPath } from 'url';

const program = new Command();

program
  .name('ship')
  .description('One-command release pipeline - version bump, changelog, GitHub release')
  .version('1.0.0');

program
  .command('release [bump]')
  .description('Create a new release (major, minor, patch, prerelease)')
  .option('-t, --tag <tag>', 'Prerelease tag (alpha, beta, rc)')
  .option('--skip-changelog', 'Skip changelog generation')
  .option('--skip-github', 'Skip GitHub release')
  .option('--skip-npm', 'Skip npm publishing')
  .option('--skip-git-checks', 'Skip git checks')
  .option('--skip-tests', 'Skip running tests')
  .option('-n, --dry-run', 'Preview without making changes')
  .option('-f, --force', 'Force release')
  .option('-v, --version <version>', 'Custom version')
  .action(async (bump, options) => {
    const success = await release({
      bump,
      tag: options.tag,
      skipChangelog: options.skipChangelog,
      skipGithub: options.skipGithub,
      skipNpm: options.skipNpm,
      skipGitChecks: options.skipGitChecks,
      skipTests: options.skipTests,
      dryRun: options.dryRun,
      force: options.force,
      version: options.version
    });
    process.exit(success ? 0 : 1);
  });

program
  .command('status')
  .description('Show current release status')
  .action(async () => {
    await getStatus();
  });

program
  .command('preview [bump]')
  .description('Preview what would be released')
  .action(async (bump) => {
    await preview(bump);
  });

program
  .command('init')
  .description('Initialize Ship configuration')
  .option('--default-bump <type>', 'Set default bump type')
  .option('--changelog-path <path>', 'Set changelog path')
  .option('--release-branch <branch>', 'Set release branch')
  .action(async (options) => {
    await initConfig({
      defaultBump: options.defaultBump,
      changelogPath: options.changelogPath,
      releaseBranch: options.releaseBranch
    });
  });

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  program.parse();
}

export { program };
