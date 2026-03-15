import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import semver from 'semver';

export interface ShipOptions {
  version: string;
  dryRun?: boolean;
  tag?: boolean;
  release?: boolean;
  message?: string;
}

interface ConventionalCommit {
  type: string;
  scope?: string;
  message: string;
  breaking: boolean;
}

function getCurrentVersion(): string {
  if (existsSync('package.json')) {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    return pkg.version || '0.0.0';
  }
  return '0.0.0';
}

function parseConventionalCommit(commit: string): ConventionalCommit | null {
  // Format: type(scope): message or type: message
  const match = commit.match(/^(\w+)(?:\(([^)]+)\))?\s*:\s*(.+)$/);
  if (!match) return null;

  const [, type, scope, message] = match;
  const breaking = message.includes('BREAKING CHANGE') || message.startsWith('!');

  return { type, scope, message: message.replace(/^!\s*/, ''), breaking };
}

function getCommitsSinceLastTag(): string[] {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    const output = execSync(`git log ${range} --pretty=format:"%s"`, { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function categorizeCommits(commits: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    feat: [],
    fix: [],
    docs: [],
    style: [],
    refactor: [],
    perf: [],
    test: [],
    chore: [],
    other: []
  };

  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit);
    if (parsed) {
      const category = categories[parsed.type] ? parsed.type : 'other';
      categories[category].push(parsed.message);
    } else {
      categories.other.push(commit);
    }
  }

  return categories;
}

function determineBumpType(commits: string[]): 'major' | 'minor' | 'patch' {
  let hasBreaking = false;
  let hasFeature = false;

  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit);
    if (parsed) {
      if (parsed.breaking) hasBreaking = true;
      if (parsed.type === 'feat') hasFeature = true;
    }
  }

  if (hasBreaking) return 'major';
  if (hasFeature) return 'minor';
  return 'patch';
}

function generateChangelog(commits: string[], version: string): string {
  const categories = categorizeCommits(commits);
  const date = new Date().toISOString().split('T')[0];
  
  let changelog = `## [${version}] - ${date}\n\n`;

  if (categories.feat.length > 0) {
    changelog += '### Features\n';
    for (const msg of categories.feat) {
      changelog += `- ${msg}\n`;
    }
    changelog += '\n';
  }

  if (categories.fix.length > 0) {
    changelog += '### Bug Fixes\n';
    for (const msg of categories.fix) {
      changelog += `- ${msg}\n`;
    }
    changelog += '\n';
  }

  if (categories.docs.length > 0) {
    changelog += '### Documentation\n';
    for (const msg of categories.docs) {
      changelog += `- ${msg}\n`;
    }
    changelog += '\n';
  }

  const otherTypes = ['refactor', 'perf', 'test', 'chore', 'style', 'other'];
  for (const type of otherTypes) {
    if (categories[type]?.length > 0) {
      changelog += `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
      for (const msg of categories[type]) {
        changelog += `- ${msg}\n`;
      }
      changelog += '\n';
    }
  }

  return changelog;
}

function updateChangelog(newSection: string): void {
  const changelogPath = 'CHANGELOG.md';
  const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  
  if (existsSync(changelogPath)) {
    const existing = readFileSync(changelogPath, 'utf-8');
    writeFileSync(changelogPath, existing.replace('# Changelog\n\n', header) + '\n' + newSection);
  } else {
    writeFileSync(changelogPath, header + newSection);
  }
}

function updatePackageVersion(version: string): void {
  if (existsSync('package.json')) {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    pkg.version = version;
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  }
}

async function createGitHubRelease(version: string, changelog: string, message?: string): Promise<void> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.log(chalk.yellow('⚠️ No GH_TOKEN found. Skipping GitHub release.'));
    return;
  }

  const tag = version.startsWith('v') ? version : `v${version}`;
  const releaseBody = message || changelog;

  try {
    // Use gh CLI if available
    execSync('which gh', { stdio: 'ignore' });
    
    const cmd = [
      'gh', 'release', 'create', tag,
      '--title', tag,
      '--notes', releaseBody
    ].join(' ');
    
    execSync(cmd, { stdio: 'inherit' });
    console.log(chalk.green(`✅ GitHub release ${tag} created`));
  } catch {
    console.log(chalk.yellow('⚠️ GitHub CLI not available. Create release manually.'));
  }
}

export async function ship(options: ShipOptions): Promise<boolean> {
  console.log(chalk.blue.bold('\n🚀 Ship Release\n'));

  const spinner = ora('Analyzing repository...').start();

  try {
    // Check git status
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      spinner.fail(chalk.red('Working directory is not clean. Commit or stash changes first.'));
      return false;
    }

    // Get current version
    const currentVersion = getCurrentVersion();
    spinner.text = `Current version: ${currentVersion}`;

    // Calculate new version
    let newVersion: string;
    const versionInput = options.version;

    if (['major', 'minor', 'patch'].includes(versionInput)) {
      const bumpType = versionInput as 'major' | 'minor' | 'patch';
      newVersion = semver.inc(currentVersion, bumpType) || currentVersion;
    } else if (semver.valid(versionInput)) {
      newVersion = versionInput;
    } else {
      // Try to auto-detect from commits
      const commits = getCommitsSinceLastTag();
      const bumpType = determineBumpType(commits);
      newVersion = semver.inc(currentVersion, bumpType) || currentVersion;
      spinner.text = `Auto-detected ${bumpType} bump: ${currentVersion} → ${newVersion}`;
    }

    spinner.succeed(`Version: ${currentVersion} → ${newVersion}`);

    // Get commits for changelog
    const commits = getCommitsSinceLastTag();
    const changelog = generateChangelog(commits, newVersion);

    console.log(chalk.gray('\nChanges to be released:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(changelog);
    console.log(chalk.gray('─'.repeat(40)));

    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 Dry run - no changes made'));
      return true;
    }

    // Update version
    const versionSpinner = ora('Updating version...').start();
    updatePackageVersion(newVersion);
    versionSpinner.succeed(`Updated to v${newVersion}`);

    // Update changelog
    const changelogSpinner = ora('Updating CHANGELOG...').start();
    updateChangelog(changelog);
    changelogSpinner.succeed('CHANGELOG updated');

    // Git commit
    const commitSpinner = ora('Creating git commit...').start();
    execSync('git add -A');
    execSync(`git commit -m "chore(release): v${newVersion}"`);
    commitSpinner.succeed('Commit created');

    // Git tag
    if (options.tag !== false) {
      const tagSpinner = ora('Creating git tag...').start();
      const tag = newVersion.startsWith('v') ? newVersion : `v${newVersion}`;
      execSync(`git tag -a ${tag} -m "Release ${tag}"`);
      tagSpinner.succeed(`Tag ${tag} created`);

      // Push
      const pushSpinner = ora('Pushing to remote...').start();
      execSync('git push origin HEAD');
      execSync('git push origin --tags');
      pushSpinner.succeed('Pushed to remote');
    }

    // GitHub release
    if (options.release !== false) {
      await createGitHubRelease(newVersion, changelog, options.message);
    }

    console.log(chalk.green.bold(`\n✅ Successfully shipped v${newVersion}\n`));
    return true;

  } catch (error) {
    spinner.fail(chalk.red(`Release failed: ${error instanceof Error ? error.message : String(error)}`));
    return false;
  }
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const version = args.find(a => a.startsWith('--version='))?.split('=')[1] || '';
  const dryRun = args.includes('--dry-run');
  const noTag = args.includes('--no-tag');
  const noRelease = args.includes('--no-release');
  const message = args.find(a => a.startsWith('--message='))?.split('=')[1];
  
  if (!version) {
    console.error(chalk.red('Usage: ship --version=<patch|minor|major|x.x.x>'));
    process.exit(1);
  }
  
  ship({ version, dryRun, tag: !noTag, release: !noRelease, message }).then(success => {
    process.exit(success ? 0 : 1);
  });
}
