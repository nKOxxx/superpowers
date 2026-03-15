import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';

export type VersionBump = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  version?: VersionBump | string;
  dryRun?: boolean;
  skipChangelog?: boolean;
  skipGit?: boolean;
  skipGithubRelease?: boolean;
}

export interface ShipResult {
  success: boolean;
  previousVersion?: string;
  newVersion?: string;
  changelogEntry?: string;
  tagName?: string;
  githubReleaseUrl?: string;
  error?: string;
  duration: number;
  changes: string[];
}

interface ConventionalCommit {
  type: string;
  scope?: string;
  message: string;
  breaking: boolean;
}

function parseConventionalCommit(message: string): ConventionalCommit | null {
  // Match patterns like "feat(scope): message" or "fix: message"
  const pattern = /^(\w+)(?:\(([^)]+)\))?!?: (.+)$/;
  const match = message.match(pattern);
  
  if (!match) return null;
  
  return {
    type: match[1],
    scope: match[2],
    message: match[3],
    breaking: message.includes('!') || message.includes('BREAKING CHANGE'),
  };
}

function getCommitsSinceLastTag(): string[] {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const output = execSync(`git log ${lastTag}..HEAD --pretty=format:"%s"`, { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    // No previous tag, get all commits
    try {
      const output = execSync('git log --pretty=format:"%s"', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

function categorizeCommits(commits: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    breaking: [],
    feat: [],
    fix: [],
    docs: [],
    refactor: [],
    test: [],
    chore: [],
    other: [],
  };

  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit);
    if (!parsed) {
      categories.other.push(commit);
      continue;
    }

    if (parsed.breaking) {
      categories.breaking.push(commit);
    }

    const typeMap: Record<string, string> = {
      feat: 'feat',
      feature: 'feat',
      fix: 'fix',
      bugfix: 'fix',
      docs: 'docs',
      doc: 'docs',
      refactor: 'refactor',
      test: 'test',
      tests: 'test',
      chore: 'chore',
    };

    const category = typeMap[parsed.type] || 'other';
    if (!parsed.breaking || category !== 'breaking') {
      categories[category].push(commit);
    }
  }

  return categories;
}

function determineVersionBump(commits: string[]): VersionBump {
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit);
    if (parsed?.breaking) return 'major';
  }
  
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit);
    if (parsed?.type === 'feat' || parsed?.type === 'feature') return 'minor';
  }
  
  return 'patch';
}

function bumpVersion(currentVersion: string, bump: VersionBump): string {
  const version = currentVersion.replace(/^v/, '');
  const parts = version.split('.').map(Number);
  
  switch (bump) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      return version;
  }
}

function generateChangelogEntry(version: string, categories: Record<string, string[]>): string {
  const date = new Date().toISOString().split('T')[0];
  let entry = `## [${version}] - ${date}\n\n`;

  if (categories.breaking.length > 0) {
    entry += '### ⚠ BREAKING CHANGES\n\n';
    for (const commit of categories.breaking) {
      entry += `- ${commit}\n`;
    }
    entry += '\n';
  }

  if (categories.feat.length > 0) {
    entry += '### Features\n\n';
    for (const commit of categories.feat) {
      entry += `- ${commit}\n`;
    }
    entry += '\n';
  }

  if (categories.fix.length > 0) {
    entry += '### Bug Fixes\n\n';
    for (const commit of categories.fix) {
      entry += `- ${commit}\n`;
    }
    entry += '\n';
  }

  if (categories.docs.length > 0) {
    entry += '### Documentation\n\n';
    for (const commit of categories.docs) {
      entry += `- ${commit}\n`;
    }
    entry += '\n';
  }

  if (categories.refactor.length > 0) {
    entry += '### Code Refactoring\n\n';
    for (const commit of categories.refactor) {
      entry += `- ${commit}\n`;
    }
    entry += '\n';
  }

  if (categories.test.length > 0) {
    entry += '### Tests\n\n';
    for (const commit of categories.test) {
      entry += `- ${commit}\n`;
    }
    entry += '\n';
  }

  if (categories.chore.length > 0) {
    entry += '### Chores\n\n';
    for (const commit of categories.chore) {
      entry += `- ${commit}\n`;
    }
    entry += '\n';
  }

  return entry;
}

function updateChangelog(entry: string): void {
  const changelogPath = 'CHANGELOG.md';
  const existing = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : '# Changelog\n\nAll notable changes to this project will be documented in this file.\n';
  
  // Insert after the header
  const lines = existing.split('\n');
  const insertIndex = lines.findIndex(line => line.startsWith('## ')) || 3;
  lines.splice(insertIndex, 0, entry);
  
  writeFileSync(changelogPath, lines.join('\n'));
}

export async function ship(options: ShipOptions = {}): Promise<ShipResult> {
  const startTime = Date.now();
  
  try {
    // Get current version from package.json
    const pkgPath = 'package.json';
    if (!existsSync(pkgPath)) {
      throw new Error('package.json not found');
    }

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const currentVersion = pkg.version;

    // Get commits since last tag
    const commits = getCommitsSinceLastTag();
    if (commits.length === 0) {
      throw new Error('No commits since last tag');
    }

    // Determine version bump
    let bump: VersionBump;
    let newVersion: string;
    
    if (options.version && ['patch', 'minor', 'major'].includes(options.version)) {
      bump = options.version as VersionBump;
      newVersion = bumpVersion(currentVersion, bump);
    } else if (options.version) {
      // Explicit version provided
      newVersion = options.version.replace(/^v/, '');
      bump = 'patch'; // default
    } else {
      bump = determineVersionBump(commits);
      newVersion = bumpVersion(currentVersion, bump);
    }

    // Categorize commits
    const categories = categorizeCommits(commits);

    if (options.dryRun) {
      return {
        success: true,
        previousVersion: currentVersion,
        newVersion,
        duration: Date.now() - startTime,
        changes: commits,
      };
    }

    // Generate changelog
    let changelogEntry: string | undefined;
    if (!options.skipChangelog) {
      changelogEntry = generateChangelogEntry(newVersion, categories);
      updateChangelog(changelogEntry);
      console.log('Updated CHANGELOG.md');
    }

    // Update package.json
    pkg.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated package.json to v${newVersion}`);

    // Git operations
    if (!options.skipGit) {
      execSync('git add package.json CHANGELOG.md');
      execSync(`git commit -m "chore(release): v${newVersion}"`);
      
      const tagName = `v${newVersion}`;
      execSync(`git tag -a ${tagName} -m "Release ${tagName}"`);
      execSync('git push');
      execSync('git push --tags');
      console.log(`Pushed tag ${tagName}`);

      // GitHub release
      let githubReleaseUrl: string | undefined;
      if (!options.skipGithubRelease && process.env.GH_TOKEN) {
        try {
          const releaseNotes = generateChangelogEntry(newVersion, categories);
          execSync(
            `gh release create ${tagName} --title "${tagName}" --notes "${releaseNotes}"`,
            { env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN } }
          );
          githubReleaseUrl = `https://github.com/${process.env.GITHUB_REPOSITORY || 'owner/repo'}/releases/tag/${tagName}`;
          console.log(`Created GitHub release: ${githubReleaseUrl}`);
        } catch (e) {
          console.warn('Failed to create GitHub release:', e);
        }
      }

      return {
        success: true,
        previousVersion: currentVersion,
        newVersion,
        changelogEntry,
        tagName,
        githubReleaseUrl,
        duration: Date.now() - startTime,
        changes: commits,
      };
    }

    return {
      success: true,
      previousVersion: currentVersion,
      newVersion,
      changelogEntry,
      duration: Date.now() - startTime,
      changes: commits,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
      changes: [],
    };
  }
}