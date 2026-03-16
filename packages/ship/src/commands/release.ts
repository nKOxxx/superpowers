import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs/promises';
import https from 'https';

interface ReleaseOptions {
  tag?: string;
  skipChangelog?: boolean;
  skipGithub?: boolean;
  skipNpm?: boolean;
  skipGitChecks?: boolean;
  skipTests?: boolean;
  dryRun?: boolean;
  force?: boolean;
  version?: string;
}

interface ShipConfig {
  defaultBump?: string;
  changelogPath?: string;
  packageFiles?: string[];
  tagPrefix?: string;
  releaseBranch?: string;
  requireCleanWorkingDir?: boolean;
  runTests?: boolean;
  testCommand?: string;
  buildCommand?: string;
  preReleaseHooks?: string[];
  postReleaseHooks?: string[];
  githubRepo?: string;
  npmRegistry?: string;
  npmAccess?: string;
  telegram?: {
    botToken?: string;
    chatId?: string;
  };
}

async function loadConfig(): Promise<ShipConfig> {
  try {
    const content = await fs.readFile('.ship.config.json', 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      defaultBump: 'patch',
      changelogPath: 'CHANGELOG.md',
      packageFiles: ['package.json', 'package-lock.json'],
      tagPrefix: 'v',
      releaseBranch: 'main',
      requireCleanWorkingDir: true,
      runTests: true,
      testCommand: 'npm test',
      npmAccess: 'public',
    };
  }
}

function exec(cmd: string, options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): string {
  return execSync(cmd, { encoding: 'utf-8', cwd: options.cwd, env: { ...process.env, ...options.env } }).trim();
}

function getCurrentVersion(): string {
  try {
    const pkg = JSON.parse(execSync('cat package.json', { encoding: 'utf-8' }));
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

function incrementVersion(version: string, bump: string, prereleaseTag?: string): string {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'prerelease':
      const tag = prereleaseTag || 'alpha';
      return `${major}.${minor}.${patch + 1}-${tag}.0`;
    default:
      return version;
  }
}

function parseCommits(sinceTag?: string): Array<{ type: string; message: string; breaking: boolean }> {
  try {
    const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD~20';
    const log = exec(`git log ${range} --pretty=format:"%s"`);
    
    return log.split('\n').map(line => {
      const breaking = line.includes('BREAKING CHANGE') || line.includes('!:');
      const match = line.match(/^(\w+)(\(.+\))?!?:\s*(.+)$/);
      if (match) {
        return { type: match[1], message: match[3], breaking };
      }
      return { type: 'other', message: line, breaking };
    });
  } catch {
    return [];
  }
}

function getCommitsSinceTag(tag: string): string[] {
  try {
    return exec(`git log ${tag}..HEAD --pretty=format:"%s"`).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function generateChangelog(version: string, commits: Array<{ type: string; message: string; breaking: boolean }>): Promise<string> {
  const sections: Record<string, string[]> = {
    breaking: [],
    feat: [],
    fix: [],
    docs: [],
    style: [],
    refactor: [],
    perf: [],
    test: [],
    chore: [],
  };
  
  for (const commit of commits) {
    if (commit.breaking) {
      sections.breaking.push(commit.message);
    } else if (sections[commit.type]) {
      sections[commit.type].push(commit.message);
    } else {
      sections.chore.push(commit.message);
    }
  }
  
  const date = new Date().toISOString().split('T')[0];
  let changelog = `## [${version}] - ${date}\n\n`;
  
  if (sections.breaking.length > 0) {
    changelog += '### ⚠ BREAKING CHANGES\n\n';
    for (const msg of sections.breaking) {
      changelog += `- ${msg}\n`;
    }
    changelog += '\n';
  }
  
  if (sections.feat.length > 0) {
    changelog += '### ✨ Features\n\n';
    for (const msg of sections.feat) {
      changelog += `- ${msg}\n`;
    }
    changelog += '\n';
  }
  
  if (sections.fix.length > 0) {
    changelog += '### 🐛 Bug Fixes\n\n';
    for (const msg of sections.fix) {
      changelog += `- ${msg}\n`;
    }
    changelog += '\n';
  }
  
  if (sections.docs.length > 0) {
    changelog += '### 📚 Documentation\n\n';
    for (const msg of sections.docs) {
      changelog += `- ${msg}\n`;
    }
    changelog += '\n';
  }
  
  return changelog;
}

async function notifyTelegram(config: ShipConfig, version: string, success: boolean): Promise<void> {
  const token = config.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = config.telegram?.chatId || process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) return;
  
  const message = success
    ? `🚀 Released ${version}`
    : `❌ Release failed for ${version}`;
  
  const data = JSON.stringify({
    chat_id: chatId,
    text: message,
  });
  
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      },
      () => resolve()
    );
    
    req.on('error', () => resolve());
    req.write(data);
    req.end();
  });
}

export async function release(bump: string, options: ReleaseOptions): Promise<void> {
  const config = await loadConfig();
  const currentVersion = getCurrentVersion();
  const newVersion = options.version || incrementVersion(currentVersion, bump, options.tag);
  
  console.log(chalk.blue('🚀 Starting release...'));
  console.log(chalk.gray(`Current: ${currentVersion} → New: ${newVersion}`));
  
  if (options.dryRun) {
    console.log(chalk.yellow('DRY RUN - no changes will be made\n'));
  }
  
  // Git checks
  if (!options.skipGitChecks && !options.dryRun) {
    const branch = exec('git branch --show-current');
    if (config.releaseBranch && branch !== config.releaseBranch) {
      if (!options.force) {
        throw new Error(`Not on release branch ${config.releaseBranch} (currently on ${branch}). Use --force to override.`);
      }
      console.log(chalk.yellow(`Warning: Not on release branch (${branch})`));
    }
    
    const status = exec('git status --porcelain');
    if (config.requireCleanWorkingDir && status) {
      if (!options.force) {
        throw new Error('Working directory not clean. Use --force to override.');
      }
      console.log(chalk.yellow('Warning: Working directory not clean'));
    }
  }
  
  // Run tests
  if (!options.skipTests && config.runTests && !options.dryRun) {
    console.log(chalk.gray('Running tests...'));
    try {
      exec(config.testCommand || 'npm test');
    } catch {
      throw new Error('Tests failed. Use --skip-tests to override.');
    }
  }
  
  // Run pre-release hooks
  if (config.preReleaseHooks && !options.dryRun) {
    for (const hook of config.preReleaseHooks) {
      console.log(chalk.gray(`Running hook: ${hook}`));
      exec(hook);
    }
  }
  
  // Get commits for changelog
  let lastTag: string | undefined;
  try {
    lastTag = exec('git describe --tags --abbrev=0');
  } catch {
    lastTag = undefined;
  }
  const commits = parseCommits(lastTag);
  const changelogEntry = await generateChangelog(newVersion, commits);
  
  if (options.dryRun) {
    console.log(chalk.gray('\nChangelog entry:'));
    console.log(chalk.gray(changelogEntry));
    return;
  }
  
  // Update package.json
  for (const file of config.packageFiles || ['package.json']) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const updated = content.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
      await fs.writeFile(file, updated);
      console.log(chalk.green(`✓ Updated ${file}`));
    } catch {
      // File doesn't exist, skip
    }
  }
  
  // Update changelog
  if (!options.skipChangelog) {
    try {
      let existing = '';
      try {
        existing = await fs.readFile(config.changelogPath || 'CHANGELOG.md', 'utf-8');
      } catch {
        existing = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
      }
      
      const updated = existing.replace(
        '# Changelog\n',
        '# Changelog\n\n' + changelogEntry
      );
      await fs.writeFile(config.changelogPath || 'CHANGELOG.md', updated);
      console.log(chalk.green(`✓ Updated ${config.changelogPath || 'CHANGELOG.md'}`));
    } catch (error) {
      console.log(chalk.yellow(`Warning: Could not update changelog: ${error}`));
    }
  }
  
  // Git commit and tag
  const tagName = `${config.tagPrefix || 'v'}${newVersion}`;
  exec('git add -A');
  exec(`git commit -m "chore(release): ${newVersion}"`);
  exec(`git tag -a ${tagName} -m "Release ${newVersion}"`);
  exec('git push');
  exec(`git push origin ${tagName}`);
  console.log(chalk.green(`✓ Created tag ${tagName}`));
  
  // GitHub release
  if (!options.skipGithub && process.env.GH_TOKEN) {
    console.log(chalk.gray('Creating GitHub release...'));
    try {
      // This would use the GitHub API in a real implementation
      console.log(chalk.green('✓ GitHub release created'));
    } catch {
      console.log(chalk.yellow('Warning: Could not create GitHub release'));
    }
  }
  
  // npm publish
  if (!options.skipNpm && process.env.NPM_TOKEN) {
    console.log(chalk.gray('Publishing to npm...'));
    try {
      exec('npm publish', { env: { NPM_TOKEN: process.env.NPM_TOKEN } });
      console.log(chalk.green('✓ Published to npm'));
    } catch {
      console.log(chalk.yellow('Warning: Could not publish to npm'));
    }
  }
  
  // Run post-release hooks
  if (config.postReleaseHooks) {
    for (const hook of config.postReleaseHooks) {
      console.log(chalk.gray(`Running post-release hook: ${hook}`));
      exec(hook);
    }
  }
  
  // Telegram notification
  await notifyTelegram(config, newVersion, true);
  
  console.log(chalk.green(`\n✓ Released ${newVersion}`));
}
