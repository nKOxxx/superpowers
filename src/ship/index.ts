import { simpleGit, type SimpleGit } from 'simple-git';
import { Octokit } from '@octokit/rest';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export type VersionBump = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  version: VersionBump | string;
  dryRun?: boolean;
  skipChangelog?: boolean;
  skipGit?: boolean;
  skipGithub?: boolean;
}

export interface ChangelogEntry {
  type: string;
  scope?: string;
  message: string;
  hash: string;
}

export function bumpVersion(currentVersion: string, bump: VersionBump): string {
  const [major, minor, patch] = currentVersion.replace(/^v/, '').split('.').map(Number);
  
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

export function parseConventionalCommits(commits: string[]): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?!?:\s*(.+)$/i;
  
  for (const commit of commits) {
    const match = commit.match(conventionalPattern);
    if (match) {
      entries.push({
        type: match[1].toLowerCase(),
        scope: match[2]?.slice(1, -1), // Remove parentheses
        message: match[3],
        hash: commit.split(' ')[0] || ''
      });
    }
  }
  
  return entries;
}

export function generateChangelog(entries: ChangelogEntry[], version: string): string {
  const now = new Date().toISOString().split('T')[0];
  let changelog = `## [${version}] - ${now}\n\n`;
  
  const typeLabels: Record<string, string> = {
    feat: '### ✨ Features\n',
    fix: '### 🐛 Bug Fixes\n',
    docs: '### 📚 Documentation\n',
    style: '### 💎 Styles\n',
    refactor: '### ♻️ Refactoring\n',
    perf: '### ⚡ Performance\n',
    test: '### ✅ Tests\n',
    chore: '### 🔧 Chores\n',
    build: '### 📦 Build\n',
    ci: '### 🔄 CI/CD\n',
    revert: '### ⏪ Reverts\n'
  };
  
  // Group by type
  const grouped: Record<string, ChangelogEntry[]> = {};
  for (const entry of entries) {
    if (!grouped[entry.type]) grouped[entry.type] = [];
    grouped[entry.type].push(entry);
  }
  
  // Output in order
  for (const [type, label] of Object.entries(typeLabels)) {
    if (grouped[type]?.length) {
      changelog += label;
      for (const entry of grouped[type]) {
        const scope = entry.scope ? `**${entry.scope}:** ` : '';
        changelog += `- ${scope}${entry.message}\n`;
      }
      changelog += '\n';
    }
  }
  
  return changelog;
}

export async function ship(options: ShipOptions, cwd: string = process.cwd()): Promise<void> {
  const git: SimpleGit = simpleGit(cwd);
  
  // Check if we're in a git repo
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('Not a git repository');
  }
  
  // Check for uncommitted changes
  const status = await git.status();
  if (status.files.length > 0 && !options.dryRun) {
    throw new Error('You have uncommitted changes. Please commit or stash them first.');
  }
  
  // Read current version from package.json
  const packageJsonPath = join(cwd, 'package.json');
  let packageJson: { version: string; name?: string };
  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  } catch {
    throw new Error('Could not read package.json');
  }
  
  const currentVersion = packageJson.version;
  
  // Determine new version
  let newVersion: string;
  if (['patch', 'minor', 'major'].includes(options.version)) {
    newVersion = bumpVersion(currentVersion, options.version as VersionBump);
  } else {
    newVersion = options.version.replace(/^v/, '');
  }
  
  console.log(chalk.blue('🚢 Release Pipeline'));
  console.log(chalk.gray(`   Current: v${currentVersion}`));
  console.log(chalk.gray(`   New:     v${newVersion}`));
  
  if (options.dryRun) {
    console.log(chalk.yellow('\n🧪 DRY RUN - No changes will be made\n'));
  }
  
  // Get commits since last tag
  const tags = await git.tags();
  const latestTag = tags.latest;
  
  let commits: string[] = [];
  if (latestTag) {
    const log = await git.log({ from: latestTag, to: 'HEAD' });
    commits = log.all.map(c => `${c.hash.substring(0, 7)} ${c.message}`);
  } else {
    const log = await git.log();
    commits = log.all.map(c => `${c.hash.substring(0, 7)} ${c.message}`);
  }
  
  console.log(chalk.gray(`   Commits since last tag: ${commits.length}`));
  
  // Generate changelog
  if (!options.skipChangelog) {
    const entries = parseConventionalCommits(commits);
    const changelogContent = generateChangelog(entries, newVersion);
    
    console.log(chalk.blue('\n📝 Changelog Preview:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(changelogContent);
    console.log(chalk.gray('─'.repeat(50)));
    
    if (!options.dryRun) {
      // Update CHANGELOG.md
      const changelogPath = join(cwd, 'CHANGELOG.md');
      let existingChangelog = '';
      try {
        existingChangelog = readFileSync(changelogPath, 'utf8');
      } catch { /* no existing changelog */ }
      
      const newChangelog = `# Changelog\n\n${changelogContent}${existingChangelog.replace('# Changelog\n\n', '')}`;
      writeFileSync(changelogPath, newChangelog);
      console.log(chalk.green('✅ Updated CHANGELOG.md'));
    }
  }
  
  // Update package.json version
  if (!options.dryRun) {
    packageJson.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(chalk.green('✅ Updated package.json'));
  }
  
  // Git operations
  if (!options.skipGit && !options.dryRun) {
    await git.add(['package.json', 'CHANGELOG.md']);
    await git.commit(`chore(release): v${newVersion}`);
    console.log(chalk.green('✅ Committed version bump'));
    
    const tagName = `v${newVersion}`;
    await git.addTag(tagName);
    console.log(chalk.green(`✅ Created tag: ${tagName}`));
    
    // Push
    console.log(chalk.blue('\n📤 Pushing to remote...'));
    await git.push();
    await git.pushTags();
    console.log(chalk.green('✅ Pushed to remote'));
    
    // GitHub release
    if (!options.skipGithub) {
      const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
      if (token) {
        try {
          const octokit = new Octokit({ auth: token });
          
          // Get remote URL to extract owner/repo
          const remotes = await git.getRemotes(true);
          const origin = remotes.find(r => r.name === 'origin');
          
          if (origin) {
            const match = origin.refs.fetch.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
            if (match) {
              const [, owner, repo] = match;
              
              const entries = parseConventionalCommits(commits);
              const body = generateChangelog(entries, newVersion);
              
              await octokit.repos.createRelease({
                owner,
                repo,
                tag_name: `v${newVersion}`,
                name: `Release v${newVersion}`,
                body,
                draft: false,
                prerelease: false
              });
              
              console.log(chalk.green(`✅ Created GitHub release: v${newVersion}`));
            }
          }
        } catch (err) {
          console.warn(chalk.yellow('⚠️  Could not create GitHub release:'), err);
        }
      } else {
        console.log(chalk.yellow('⚠️  No GH_TOKEN found, skipping GitHub release'));
      }
    }
  }
  
  console.log(chalk.green(`\n🎉 Release v${newVersion} complete!`));
}

export { chalk };