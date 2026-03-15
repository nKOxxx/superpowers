import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import pc from 'picocolors';
import type { ChangelogEntry } from '../types/index.js';
import { loadConfig, mergeWithDefaults } from '../lib/config.js';
import {
  isGitRepo,
  isWorkingDirectoryClean,
  getLatestTag,
  getCommitsSince,
  createTag,
  pushToRemote,
  getRemoteUrl,
  parseRepoFromRemote,
  runTests,
} from '../lib/git.js';
import { createRelease } from '../lib/github.js';
import { sendTelegramMessage, formatReleaseMessage } from '../lib/telegram.js';

interface ShipOptions {
  version: string;
  repo?: string;
  dryRun?: boolean;
  skipTests?: boolean;
  notes?: string;
  prerelease?: boolean;
}

export function shipCommand(program: Command): void {
  program
    .command('ship')
    .description('One-command release pipeline')
    .requiredOption('-v, --version <type>', 'Version: patch, minor, major, or explicit (e.g., 1.2.3)')
    .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
    .option('-d, --dry-run', 'Preview changes without executing')
    .option('-s, --skip-tests', 'Skip test run before release')
    .option('-n, --notes <text>', 'Custom release notes')
    .option('-p, --prerelease', 'Mark as prerelease')
    .action(async (options: ShipOptions) => {
      try {
        await runShip(options);
      } catch (error) {
        console.error(pc.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}

async function runShip(options: ShipOptions): Promise<void> {
  const config = mergeWithDefaults(loadConfig());
  const cwd = process.cwd();

  // Validate git repo
  if (!isGitRepo(cwd)) {
    throw new Error('Not a git repository');
  }

  // Check working directory
  if (config.ship.requireCleanWorkingDir && !isWorkingDirectoryClean(cwd)) {
    throw new Error('Working directory is not clean. Commit or stash changes first.');
  }

  console.log(pc.cyan('══════════════════════════════════════════════════'));
  console.log(pc.cyan('Release Pipeline'));
  console.log(pc.cyan('══════════════════════════════════════════════════'));
  console.log();

  // Get current version
  const packagePath = join(cwd, 'package.json');
  if (!existsSync(packagePath)) {
    throw new Error('package.json not found');
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  const currentVersion = pkg.version;
  const newVersion = calculateNewVersion(currentVersion, options.version);

  console.log(pc.blue(`Current version: ${currentVersion}`));
  console.log(pc.blue(`New version: ${newVersion}`));
  console.log();

  if (options.dryRun) {
    console.log(pc.yellow('DRY RUN - No changes will be made'));
    console.log();
  }

  // Run tests
  if (!options.skipTests && config.ship.runTestsBeforeRelease) {
    console.log(pc.blue('Running tests...'));
    const { success } = await runTests(config.qa.testCommand || 'npm test', cwd);
    
    if (!success) {
      throw new Error('Tests failed. Fix before releasing.');
    }
    console.log(pc.green('✓ Tests passed'));
    console.log();
  }

  // Get changelog
  const latestTag = getLatestTag(cwd);
  const commits = getCommitsSince(latestTag, cwd);
  const changelog = generateChangelog(commits);

  if (options.dryRun) {
    console.log(pc.cyan('Changelog:'));
    console.log(changelog || '  (no conventional commits found)');
    console.log();
    console.log(pc.yellow('Dry run complete. No changes made.'));
    return;
  }

  // Update version
  console.log(pc.blue('Updating version...'));
  pkg.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(pc.green(`✓ Version updated to ${newVersion}`));
  console.log();

  // Update additional version files
  if (config.ship.versionFiles && config.ship.versionFiles.length > 0) {
    for (const versionFile of config.ship.versionFiles) {
      if (!versionFile) continue;
      const filePath = resolve(cwd, versionFile);
      if (existsSync(filePath)) {
        let content = readFileSync(filePath, 'utf-8');
        // Replace version patterns
        content = content.replace(/version\s*=\s*['"][\d.]+['"]/, `version = '${newVersion}'`);
        content = content.replace(/VERSION\s*=\s*['"][\d.]+['"]/, `VERSION = '${newVersion}'`);
        content = content.replace(/version:\s*['"][\d.]+['"]/, `version: '${newVersion}'`);
        writeFileSync(filePath, content);
        console.log(pc.green(`✓ Updated ${versionFile}`));
      }
    }
    console.log();
  }

  // Update changelog
  console.log(pc.blue('Generating changelog...'));
  await updateChangelog(config.ship.changelogPath || 'CHANGELOG.md', newVersion, changelog, options.notes);
  console.log(pc.green('✓ Changelog updated'));
  console.log();

  // Git operations
  console.log(pc.blue('Creating release commit...'));
  const { execSync } = require('child_process');
  execSync('git add -A', { cwd });
  execSync(`git commit -m "chore(release): v${newVersion}"`, { cwd });
  console.log(pc.green('✓ Commit created'));
  console.log();

  console.log(pc.blue('Creating git tag...'));
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { cwd });
  console.log(pc.green(`✓ Tag v${newVersion} created`));
  console.log();

  console.log(pc.blue('Pushing to remote...'));
  execSync('git push && git push --tags', { cwd, stdio: 'pipe' });
  console.log(pc.green('✓ Pushed to remote'));
  console.log();

  // Create GitHub release
  console.log(pc.blue('Creating GitHub release...'));
  const repoInfo = options.repo || parseRepoFromRemote(getRemoteUrl(cwd) || '');
  
  if (repoInfo && typeof repoInfo !== 'string') {
    const releaseBody = options.notes || changelog || `Release v${newVersion}`;
    const { success, url, error } = await createRelease(repoInfo.owner, repoInfo.repo, {
      tag_name: `v${newVersion}`,
      name: `v${newVersion}`,
      body: releaseBody,
      prerelease: options.prerelease || false,
    });

    if (success) {
      console.log(pc.green('✓ GitHub release created'));
      if (url) {
        console.log(pc.blue(`  ${url}`));
      }
    } else {
      console.warn(pc.yellow(`Warning: Failed to create GitHub release: ${error}`));
    }
  } else if (options.repo) {
    const [owner, repo] = options.repo.split('/');
    if (owner && repo) {
      const releaseBody = options.notes || changelog || `Release v${newVersion}`;
      const { success, url, error } = await createRelease(owner, repo, {
        tag_name: `v${newVersion}`,
        name: `v${newVersion}`,
        body: releaseBody,
        prerelease: options.prerelease || false,
      });

      if (success) {
        console.log(pc.green('✓ GitHub release created'));
        if (url) {
          console.log(pc.blue(`  ${url}`));
        }
      } else {
        console.warn(pc.yellow(`Warning: Failed to create GitHub release: ${error}`));
      }
    }
  } else {
    console.warn(pc.yellow('Warning: Could not detect repository. Skipping GitHub release.'));
  }

  console.log();

  // Telegram notification
  const telegramMessage = formatReleaseMessage(
    pkg.name || 'unknown',
    newVersion,
    changelog
  );
  const { success: telegramSuccess, error: telegramError } = await sendTelegramMessage(telegramMessage);
  
  if (telegramSuccess) {
    console.log(pc.green('✓ Telegram notification sent'));
  } else if (telegramError?.includes('Missing')) {
    // Silently skip if no telegram config
  } else if (telegramError) {
    console.warn(pc.yellow(`Warning: Failed to send Telegram notification: ${telegramError}`));
  }

  console.log();
  console.log(pc.cyan('══════════════════════════════════════════════════'));
  console.log(pc.green(`✓ Released ${newVersion}`));
  console.log(pc.cyan('══════════════════════════════════════════════════'));
}

function calculateNewVersion(current: string, bump: string): string {
  // If explicit version provided
  if (/^\d+\.\d+\.\d+/.test(bump)) {
    return bump;
  }

  const parts = current.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid current version: ${current}`);
  }

  const [major, minor, patch] = parts;

  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version bump: ${bump}. Use patch, minor, major, or explicit version.`);
  }
}

function generateChangelog(commits: string[]): string {
  if (commits.length === 0) {
    return '';
  }

  const entries: ChangelogEntry[] = commits.map(msg => {
    const conventional = msg.match(/^(feat|fix|chore|docs|refactor|test)(?:\(([^)]+)\))?:\s*(.+)/);
    if (conventional) {
      return {
        type: conventional[1] as ChangelogEntry['type'],
        scope: conventional[2],
        message: conventional[3],
      };
    }
    return { type: 'other', message: msg };
  });

  const sections: Record<string, string[]> = {
    feat: [],
    fix: [],
    chore: [],
    docs: [],
    refactor: [],
    test: [],
    other: [],
  };

  for (const entry of entries) {
    const scope = entry.scope ? `**${entry.scope}:** ` : '';
    sections[entry.type].push(`- ${scope}${entry.message}`);
  }

  const lines: string[] = [];
  
  if (sections.feat.length) {
    lines.push('### Features', ...sections.feat, '');
  }
  if (sections.fix.length) {
    lines.push('### Bug Fixes', ...sections.fix, '');
  }
  if (sections.docs.length) {
    lines.push('### Documentation', ...sections.docs, '');
  }
  if (sections.refactor.length) {
    lines.push('### Refactoring', ...sections.refactor, '');
  }
  if (sections.test.length) {
    lines.push('### Tests', ...sections.test, '');
  }
  if (sections.chore.length) {
    lines.push('### Chores', ...sections.chore, '');
  }
  if (sections.other.length) {
    lines.push('### Other Changes', ...sections.other, '');
  }

  return lines.join('\n');
}

async function updateChangelog(
  changelogPath: string,
  version: string,
  changelog: string,
  customNotes?: string
): Promise<void> {
  const fullPath = resolve(changelogPath);
  const date = new Date().toISOString().split('T')[0];
  
  const newEntry = [
    `## [${version}] - ${date}`,
    '',
    customNotes || changelog || '(No changes documented)',
    '',
  ].join('\n');

  if (existsSync(fullPath)) {
    const existing = readFileSync(fullPath, 'utf-8');
    // Insert after header
    const lines = existing.split('\n');
    const headerEnd = lines.findIndex(line => line.startsWith('## '));
    
    if (headerEnd === -1) {
      // No existing entries, append at end
      writeFileSync(fullPath, `${existing}\n${newEntry}`);
    } else {
      // Insert before first entry
      const before = lines.slice(0, headerEnd).join('\n');
      const after = lines.slice(headerEnd).join('\n');
      writeFileSync(fullPath, `${before}\n${newEntry}${after}`);
    }
  } else {
    // Create new changelog
    const content = [
      '# Changelog',
      '',
      'All notable changes to this project will be documented in this file.',
      '',
      newEntry,
    ].join('\n');
    writeFileSync(fullPath, content);
  }
}
