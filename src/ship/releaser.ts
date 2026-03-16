import { execSync } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileExists, log, readJson, writeJson, notifyTelegram } from '../shared/utils.js';
import { ShipConfig } from '../shared/types.js';
import semver from 'semver';

const DEFAULT_CONFIG: ShipConfig = {
  defaultBump: 'patch',
  changelogPath: 'CHANGELOG.md',
  packageFiles: ['package.json', 'package-lock.json'],
  tagPrefix: 'v',
  releaseBranch: 'main',
  requireCleanWorkingDir: true,
  runTests: true,
  testCommand: 'npm test',
  buildCommand: 'npm run build',
  preReleaseHooks: [],
  postReleaseHooks: [],
  npmRegistry: 'https://registry.npmjs.org/',
  npmAccess: 'public'
};

const CONFIG_PATH = '.ship.config.json';

export async function getConfig(): Promise<ShipConfig> {
  const saved = await readJson<ShipConfig>(CONFIG_PATH);
  const config = { ...DEFAULT_CONFIG, ...saved };
  
  // Auto-detect GitHub repo
  if (!config.githubRepo) {
    try {
      const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = remote.match(/github\.com[:/](.+?)\.git?$/);
      if (match) config.githubRepo = match[1];
    } catch {}
  }
  
  return config;
}

export async function initConfig(options: Partial<ShipConfig> = {}): Promise<void> {
  const config = { ...DEFAULT_CONFIG, ...options };
  await writeJson(CONFIG_PATH, config);
  log(`Config initialized: ${CONFIG_PATH}`, 'success');
}

export function getCurrentVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

export function isWorkingDirClean(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    return status === '';
  } catch {
    return false;
  }
}

export function getLastTag(): string | null {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

export function getCommitsSince(tag: string | null): string[] {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    const output = execSync(`git log ${range} --pretty=format:"%s"`, { encoding: 'utf-8' }).trim();
    return output ? output.split('\n') : [];
  } catch {
    return [];
  }
}

export interface CommitAnalysis {
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'chore' | 'unknown';
  scope?: string;
  message: string;
  breaking: boolean;
}

export function analyzeCommit(message: string): CommitAnalysis {
  const conventionalMatch = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/);
  
  if (conventionalMatch) {
    const [, type, scope, breaking, msg] = conventionalMatch;
    return {
      type: type as CommitAnalysis['type'],
      scope,
      message: msg,
      breaking: !!breaking || message.includes('BREAKING CHANGE')
    };
  }
  
  return {
    type: 'unknown',
    message,
    breaking: message.includes('BREAKING CHANGE')
  };
}

export function recommendBump(commits: string[]): 'major' | 'minor' | 'patch' {
  let hasBreaking = false;
  let hasFeature = false;
  
  for (const commit of commits) {
    const analysis = analyzeCommit(commit);
    if (analysis.breaking) hasBreaking = true;
    if (analysis.type === 'feat') hasFeature = true;
  }
  
  if (hasBreaking) return 'major';
  if (hasFeature) return 'minor';
  return 'patch';
}

export function generateChangelogEntry(version: string, commits: string[]): string {
  const groups: Record<string, string[]> = {
    breaking: [],
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
  
  const emojis: Record<string, string> = {
    breaking: '⚠️',
    feat: '✨',
    fix: '🐛',
    docs: '📚',
    style: '💄',
    refactor: '♻️',
    perf: '⚡',
    test: '✅',
    chore: '🔧',
    other: '📝'
  };
  
  for (const commit of commits) {
    const analysis = analyzeCommit(commit);
    const key = analysis.breaking ? 'breaking' : analysis.type === 'unknown' ? 'other' : analysis.type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(analysis.message);
  }
  
  const date = new Date().toISOString().split('T')[0];
  let entry = `\n## [${version}] - ${date}\n\n`;
  
  for (const [type, messages] of Object.entries(groups)) {
    if (messages.length === 0) continue;
    entry += `### ${emojis[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;
    for (const msg of messages) {
      entry += `- ${msg}\n`;
    }
    entry += '\n';
  }
  
  return entry;
}

export async function updatePackageVersion(version: string, files: string[]): Promise<void> {
  for (const file of files) {
    if (!await fileExists(file)) continue;
    
    const content = await readFile(file, 'utf-8');
    const json = JSON.parse(content);
    json.version = version;
    await writeFile(file, JSON.stringify(json, null, 2) + '\n');
  }
}

export async function updateChangelog(entry: string, changelogPath: string): Promise<void> {
  const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n';
  
  let existing = '';
  if (await fileExists(changelogPath)) {
    existing = await readFile(changelogPath, 'utf-8');
    existing = existing.replace(header, '');
  }
  
  await writeFile(changelogPath, header + entry + existing);
}

export interface ReleaseOptions {
  bump?: 'major' | 'minor' | 'patch' | 'prerelease';
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

export async function release(options: ReleaseOptions = {}): Promise<boolean> {
  const config = await getConfig();
  const currentVersion = getCurrentVersion();
  const currentBranch = getCurrentBranch();
  
  // Validation
  if (!options.skipGitChecks && !options.dryRun) {
    if (config.requireCleanWorkingDir && !isWorkingDirClean()) {
      if (!options.force) {
        log('Working directory is not clean. Commit changes first or use --skip-git-checks', 'error');
        return false;
      }
    }
    
    if (config.releaseBranch && currentBranch !== config.releaseBranch) {
      if (!options.force) {
        log(`Must be on ${config.releaseBranch} branch. Current: ${currentBranch}`, 'error');
        return false;
      }
    }
  }
  
  // Determine new version
  let newVersion: string;
  if (options.version) {
    newVersion = options.version;
  } else {
    const bump = options.bump || config.defaultBump || 'patch';
    const result = bump === 'prerelease'
      ? semver.inc(currentVersion, 'prerelease', options.tag || 'alpha')
      : semver.inc(currentVersion, bump);
    newVersion = result || currentVersion;
  }
  
  const lastTag = getLastTag();
  const commits = getCommitsSince(lastTag);
  
  if (commits.length === 0 && !options.force) {
    log('No commits since last release', 'warn');
    return false;
  }
  
  log(`Releasing ${currentVersion} → ${newVersion}`);
  
  if (options.dryRun) {
    log('DRY RUN - No changes will be made', 'warn');
    console.log('\nCommits to include:');
    for (const commit of commits.slice(0, 10)) {
      console.log(`  • ${commit}`);
    }
    console.log('\nChangelog entry that would be generated:');
    console.log(generateChangelogEntry(newVersion, commits));
    return true;
  }
  
  // Run tests
  if (config.runTests && !options.skipTests) {
    log('Running tests...');
    try {
      execSync(config.testCommand || 'npm test', { stdio: 'inherit' });
    } catch {
      log('Tests failed', 'error');
      return false;
    }
  }
  
  // Build
  if (config.buildCommand) {
    log('Building...');
    try {
      execSync(config.buildCommand, { stdio: 'inherit' });
    } catch {
      log('Build failed', 'error');
      return false;
    }
  }
  
  // Pre-release hooks
  for (const hook of config.preReleaseHooks || []) {
    log(`Running: ${hook}`);
    execSync(hook, { stdio: 'inherit' });
  }
  
  // Update version
  log('Updating version...');
  await updatePackageVersion(newVersion, config.packageFiles || ['package.json']);
  
  // Update changelog
  if (!options.skipChangelog) {
    log('Updating changelog...');
    const entry = generateChangelogEntry(newVersion, commits);
    await updateChangelog(entry, config.changelogPath || 'CHANGELOG.md');
  }
  
  // Git commit and tag
  log('Creating commit and tag...');
  execSync('git add -A');
  execSync(`git commit -m "chore(release): ${newVersion}"`);
  execSync(`git tag ${config.tagPrefix}${newVersion}`);
  
  // Push
  log('Pushing to origin...');
  execSync('git push');
  execSync('git push --tags');
  
  // GitHub release
  if (!options.skipGithub && process.env.GH_TOKEN) {
    log('Creating GitHub release...');
    try {
      const changelogEntry = generateChangelogEntry(newVersion, commits);
      execSync(
        `gh release create ${config.tagPrefix}${newVersion} --title "${newVersion}" --notes "${changelogEntry.replace(/"/g, '\\"')}"`,
        { env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN } }
      );
    } catch (err) {
      log(`GitHub release failed: ${err}`, 'warn');
    }
  }
  
  // npm publish
  if (!options.skipNpm && process.env.NPM_TOKEN) {
    log('Publishing to npm...');
    try {
      execSync('npm publish --access public', {
        env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_TOKEN }
      });
    } catch (err) {
      log(`npm publish failed: ${err}`, 'warn');
    }
  }
  
  // Telegram notification
  if (config.telegram?.botToken && config.telegram?.chatId) {
    const message = `🚀 <b>Release ${newVersion}</b>\n\nRepository: ${config.githubRepo || 'unknown'}\nCommits: ${commits.length}\n\nChangelog:\n${commits.slice(0, 5).map(c => `• ${c}`).join('\n')}`;
    await notifyTelegram(config.telegram.botToken, config.telegram.chatId, message);
  }
  
  // Post-release hooks
  for (const hook of config.postReleaseHooks || []) {
    log(`Running: ${hook}`);
    execSync(hook, { stdio: 'inherit' });
  }
  
  log(`Released ${newVersion}!`, 'success');
  return true;
}

export async function getStatus(): Promise<void> {
  const config = await getConfig();
  const currentVersion = getCurrentVersion();
  const currentBranch = getCurrentBranch();
  const isClean = isWorkingDirClean();
  const lastTag = getLastTag();
  const commits = getCommitsSince(lastTag);
  const recommendedBump = recommendBump(commits);
  
  console.log('\n📊 Release Status\n');
  console.log(`Current State:`);
  console.log(`  Version: ${currentVersion}`);
  console.log(`  Branch: ${currentBranch}`);
  console.log(`  Working dir: ${isClean ? 'clean' : 'dirty'}`);
  console.log(`  Last tag: ${lastTag || 'none'}`);
  
  console.log(`\nCommits:`);
  console.log(`  Since last tag: ${commits.length}`);
  console.log(`  Recommended bump: ${recommendedBump}`);
  
  if (commits.length > 0) {
    console.log(`\nRecent commits:`);
    for (const commit of commits.slice(0, 5)) {
      console.log(`  ${commit}`);
    }
  }
  
  console.log(`\nConfiguration:`);
  console.log(`  GH_TOKEN: ${process.env.GH_TOKEN ? '✓' : '✗'}`);
  console.log(`  NPM_TOKEN: ${process.env.NPM_TOKEN ? '✓' : '✗'}`);
  console.log('');
}

export async function preview(bump?: string): Promise<void> {
  const currentVersion = getCurrentVersion();
  const lastTag = getLastTag();
  const commits = getCommitsSince(lastTag);
  
  let newVersion: string;
  if (bump) {
    const result = semver.inc(currentVersion, bump as semver.ReleaseType);
    newVersion = result || currentVersion;
  } else {
    const rec = recommendBump(commits);
    const result = semver.inc(currentVersion, rec);
    newVersion = result || currentVersion;
  }
  
  console.log(`\n📋 Release Preview\n`);
  console.log(`Current: ${currentVersion}`);
  console.log(`New:     ${newVersion}\n`);
  
  console.log('Commits to include:');
  for (const commit of commits) {
    console.log(`  • ${commit}`);
  }
  
  console.log('\nChangelog entry:');
  console.log(generateChangelogEntry(newVersion, commits));
}
