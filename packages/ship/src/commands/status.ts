import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs/promises';

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
    return {};
  }
}

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

function getRecommendedBump(commits: string[]): string {
  let hasBreaking = false;
  let hasFeature = false;
  
  for (const commit of commits) {
    if (commit.includes('BREAKING CHANGE') || commit.match(/^[\w]+!:/)) {
      hasBreaking = true;
      break;
    }
    if (commit.startsWith('feat:') || commit.startsWith('feat(')) {
      hasFeature = true;
    }
  }
  
  if (hasBreaking) return 'major';
  if (hasFeature) return 'minor';
  return 'patch';
}

export async function status(): Promise<void> {
  console.log(chalk.blue('📊 Release Status\n'));
  
  const config = await loadConfig();
  const version = getCurrentVersion();
  const branch = exec('git branch --show-current') || 'unknown';
  const workingDir = exec('git status --porcelain');
  const lastTag = getLastTag();
  const commits = getCommitsSinceTag(lastTag);
  const recommendedBump = getRecommendedBump(commits);
  
  console.log(chalk.bold('Current State:'));
  console.log(`  Version: ${chalk.cyan(version)}`);
  console.log(`  Branch: ${chalk.cyan(branch)}`);
  console.log(`  Working dir: ${workingDir ? chalk.yellow('dirty') : chalk.green('clean')}`);
  console.log(`  Last tag: ${lastTag ? chalk.cyan(lastTag) : chalk.gray('none')}`);
  
  console.log(chalk.bold('\nCommits:'));
  console.log(`  Since last tag: ${chalk.cyan(commits.length.toString())}`);
  console.log(`  Recommended bump: ${chalk.cyan(recommendedBump)}`);
  
  if (commits.length > 0) {
    console.log(chalk.gray('\n  Recent commits:'));
    for (const commit of commits.slice(0, 5)) {
      console.log(chalk.gray(`    • ${commit.substring(0, 60)}${commit.length > 60 ? '...' : ''}`));
    }
  }
  
  console.log(chalk.bold('\nConfiguration:'));
  console.log(`  GH_TOKEN: ${process.env.GH_TOKEN ? chalk.green('✓') : chalk.red('✗')}`);
  console.log(`  NPM_TOKEN: ${process.env.NPM_TOKEN ? chalk.green('✓') : chalk.red('✗')}`);
  console.log(`  TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? chalk.green('✓') : chalk.red('✗')}`);
  console.log(`  TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? chalk.green('✓') : chalk.red('✗')}`);
}
