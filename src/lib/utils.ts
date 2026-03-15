import { getLastTag, getCommitsSinceLastTag } from './git.js';
import type { GitCommit } from '../types/index.js';

/**
 * Parse conventional commits and categorize them
 */
export function parseConventionalCommits(commits: GitCommit[]): {
  features: GitCommit[];
  fixes: GitCommit[];
  chores: GitCommit[];
  others: GitCommit[];
} {
  const features: GitCommit[] = [];
  const fixes: GitCommit[] = [];
  const chores: GitCommit[] = [];
  const others: GitCommit[] = [];
  
  for (const commit of commits) {
    const msg = commit.message.toLowerCase();
    if (msg.startsWith('feat:') || msg.startsWith('feat(')) {
      features.push(commit);
    } else if (msg.startsWith('fix:') || msg.startsWith('fix(')) {
      fixes.push(commit);
    } else if (msg.startsWith('chore:') || msg.startsWith('chore(')) {
      chores.push(commit);
    } else {
      others.push(commit);
    }
  }
  
  return { features, fixes, chores, others };
}

/**
 * Generate markdown changelog
 */
export function generateChangelog(
  version: string,
  commits: GitCommit[],
  previousVersion?: string
): string {
  const { features, fixes, chores, others } = parseConventionalCommits(commits);
  const date = new Date().toISOString().split('T')[0];
  
  let changelog = `## [${version}] - ${date}\n\n`;
  
  if (features.length > 0) {
    changelog += '### Features\n\n';
    for (const commit of features) {
      const message = commit.message.replace(/^feat(\([^)]+\))?:\s*/i, '');
      changelog += `- ${message} (${commit.hash.slice(0, 7)})\n`;
    }
    changelog += '\n';
  }
  
  if (fixes.length > 0) {
    changelog += '### Bug Fixes\n\n';
    for (const commit of fixes) {
      const message = commit.message.replace(/^fix(\([^)]+\))?:\s*/i, '');
      changelog += `- ${message} (${commit.hash.slice(0, 7)})\n`;
    }
    changelog += '\n';
  }
  
  if (chores.length > 0) {
    changelog += '### Chores\n\n';
    for (const commit of chores) {
      const message = commit.message.replace(/^chore(\([^)]+\))?:\s*/i, '');
      changelog += `- ${message} (${commit.hash.slice(0, 7)})\n`;
    }
    changelog += '\n';
  }
  
  if (others.length > 0) {
    changelog += '### Other Changes\n\n';
    for (const commit of others) {
      changelog += `- ${commit.message} (${commit.hash.slice(0, 7)})\n`;
    }
    changelog += '\n';
  }
  
  return changelog;
}

/**
 * Bump version based on type
 */
export function bumpVersion(
  currentVersion: string,
  bumpType: 'patch' | 'minor' | 'major' | string
): string {
  // If explicit version provided
  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    return bumpType.replace(/^v/, '');
  }
  
  const parts = currentVersion.replace(/^v/, '').split('.').map(Number);
  const [major, minor, patch] = parts;
  
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Update version in package.json
 */
export function updatePackageVersion(version: string): void {
  const fs = require('fs');
  const path = require('path');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

/**
 * Read current version from package.json
 */
export function getCurrentVersion(): string {
  const fs = require('fs');
  const path = require('path');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version || '0.0.0';
}

/**
 * Read or create CHANGELOG.md
 */
export function updateChangelog(changelog: string): void {
  const fs = require('fs');
  const path = require('path');
  
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  let existing = '';
  
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, 'utf-8');
  }
  
  const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  const newContent = existing.startsWith('# Changelog') 
    ? existing.replace('# Changelog\n\n', header) + '\n' + changelog
    : header + changelog + '\n' + existing.replace(header, '');
  
  fs.writeFileSync(changelogPath, newContent);
}
