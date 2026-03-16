import { execSync } from 'child_process';
import chalk from 'chalk';

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getCurrentVersion(): string {
  try {
    const pkg = JSON.parse(execSync('cat package.json', { encoding: 'utf-8' }));
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

function getLastTag(): string | undefined {
  try {
    return exec('git describe --tags --abbrev=0');
  } catch {
    return undefined;
  }
}

function getCommitsSinceTag(tag?: string): string[] {
  if (!tag) return [];
  try {
    return exec(`git log ${tag}..HEAD --pretty=format:"%s"`).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function incrementVersion(version: string, bump: string): string {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return version;
  }
}

function generateChangelogEntry(version: string, commits: string[]): string {
  const sections: Record<string, string[]> = {
    breaking: [],
    feat: [],
    fix: [],
    docs: [],
    other: [],
  };
  
  for (const commit of commits) {
    const match = commit.match(/^(\w+)(\(.+\))?!?:\s*(.+)$/);
    if (match) {
      const [, type, , message] = match;
      if (commit.includes('BREAKING CHANGE') || commit.includes('!:')) {
        sections.breaking.push(message);
      } else if (type === 'feat') {
        sections.feat.push(message);
      } else if (type === 'fix') {
        sections.fix.push(message);
      } else if (type === 'docs') {
        sections.docs.push(message);
      } else {
        sections.other.push(message);
      }
    } else {
      sections.other.push(commit);
    }
  }
  
  const date = new Date().toISOString().split('T')[0];
  let entry = `## [${version}] - ${date}\n\n`;
  
  if (sections.breaking.length > 0) {
    entry += '### ⚠ BREAKING CHANGES\n\n';
    for (const msg of sections.breaking) {
      entry += `- ${msg}\n`;
    }
    entry += '\n';
  }
  
  if (sections.feat.length > 0) {
    entry += '### ✨ Features\n\n';
    for (const msg of sections.feat) {
      entry += `- ${msg}\n`;
    }
    entry += '\n';
  }
  
  if (sections.fix.length > 0) {
    entry += '### 🐛 Bug Fixes\n\n';
    for (const msg of sections.fix) {
      entry += `- ${msg}\n`;
    }
    entry += '\n';
  }
  
  return entry;
}

export async function preview(bump: string): Promise<void> {
  console.log(chalk.blue('🔮 Release Preview\n'));
  
  const currentVersion = getCurrentVersion();
  const newVersion = incrementVersion(currentVersion, bump);
  const lastTag = getLastTag();
  const commits = getCommitsSinceTag(lastTag);
  
  console.log(chalk.bold('Version:'));
  console.log(`  ${chalk.gray(currentVersion)} → ${chalk.cyan(newVersion)}\n`);
  
  console.log(chalk.bold('Commits to include:'));
  console.log(`  ${chalk.gray(`${commits.length} commits`)}\n`);
  
  if (commits.length > 0) {
    console.log(chalk.gray('  Commits:'));
    for (const commit of commits) {
      console.log(chalk.gray(`    • ${commit.substring(0, 70)}${commit.length > 70 ? '...' : ''}`));
    }
    console.log();
    
    console.log(chalk.bold('Changelog entry:'));
    console.log(chalk.gray(generateChangelogEntry(newVersion, commits)));
  }
}
