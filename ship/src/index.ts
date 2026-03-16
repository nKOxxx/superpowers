import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import semver from 'semver';
import { simpleGit } from 'simple-git';
import { ShipConfig, ReleaseOptions, ReleaseType, ReleaseStatus, ChangelogEntry } from './types.js';
import chalk from 'chalk';

const DEFAULT_CONFIG: ShipConfig = {
  defaultBump: 'patch',
  changelogPath: 'CHANGELOG.md',
  packageFiles: ['package.json', 'package-lock.json'],
  tagPrefix: 'v',
  releaseBranch: 'main',
  requireCleanWorkingDir: true,
  runTests: true,
  testCommand: 'npm test',
  preReleaseHooks: [],
  postReleaseHooks: []
};

export class ShipSkill {
  private config: ShipConfig;
  private git = simpleGit();

  constructor(config: Partial<ShipConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async loadConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), '.ship.config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const userConfig = JSON.parse(content);
      this.config = { ...this.config, ...userConfig };
    } catch {
      // Use default config
    }
  }

  async getStatus(): Promise<ReleaseStatus> {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
    
    const branch = await this.git.branch();
    const status = await this.git.status();
    const tags = await this.git.tags(['--sort=-creatordate']);
    
    const latestTag = tags.latest || 'v0.0.0';
    const currentVersion = pkg.version;
    
    // Get commits since last tag
    const logs = await this.git.log({ from: latestTag, to: 'HEAD' });
    const commits = logs.all.map((l: { message: string }) => l.message);
    
    // Determine recommended bump
    const recommendedBump = this.determineBumpFromCommits(commits);
    
    return {
      currentVersion,
      currentBranch: branch.current,
      isClean: status.isClean(),
      lastTag: latestTag,
      commitsSinceTag: commits.length,
      recommendedBump,
      hasGhToken: !!process.env.GH_TOKEN || !!process.env.GITHUB_TOKEN,
      hasNpmToken: !!process.env.NPM_TOKEN
    };
  }

  async release(type: ReleaseType, options: ReleaseOptions = {}): Promise<{ success: boolean; message: string }> {
    const status = await this.getStatus();
    
    // Pre-release checks
    if (!options.skipGitChecks) {
      if (status.currentBranch !== this.config.releaseBranch && !options.force) {
        return { 
          success: false, 
          message: `Not on ${this.config.releaseBranch} branch (current: ${status.currentBranch}). Use --force to override.` 
        };
      }
      
      if (!status.isClean && this.config.requireCleanWorkingDir && !options.force) {
        return { success: false, message: 'Working directory is not clean. Use --force to override.' };
      }
    }

    // Run pre-release hooks
    for (const hook of this.config.preReleaseHooks) {
      try {
        execSync(hook, { stdio: 'inherit' });
      } catch {
        return { success: false, message: `Pre-release hook failed: ${hook}` };
      }
    }

    // Run tests if configured
    if (this.config.runTests && !options.skipTests) {
      try {
        console.log(chalk.blue('Running tests...'));
        execSync(this.config.testCommand, { stdio: 'inherit' });
      } catch {
        return { success: false, message: 'Tests failed' };
      }
    }

    // Calculate new version
    const currentVersion = status.currentVersion;
    let newVersion: string;
    
    if (options.version) {
      newVersion = options.version;
    } else {
      const prereleaseId = options.tag || 'alpha';
      newVersion = semver.inc(currentVersion, type, prereleaseId) || currentVersion;
    }

    if (options.dryRun) {
      return { 
        success: true, 
        message: `Dry run: Would release ${currentVersion} → ${newVersion}` 
      };
    }

    try {
      // Update version in package files
      for (const file of this.config.packageFiles) {
        const filePath = path.join(process.cwd(), file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const json = JSON.parse(content);
          json.version = newVersion;
          await fs.writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
        } catch {
          // File might not exist, skip
        }
      }

      // Update changelog
      if (!options.skipChangelog) {
        await this.updateChangelog(newVersion, status.commitsSinceTag);
      }

      // Commit changes
      await this.git.add('.');
      await this.git.commit(`chore(release): ${this.config.tagPrefix}${newVersion}`);

      // Create tag
      const tagName = `${this.config.tagPrefix}${newVersion}`;
      await this.git.addTag(tagName);

      // Push to origin
      if (!options.skipGitChecks) {
        await this.git.push('origin', status.currentBranch);
        await this.git.pushTags('origin');
      }

      // Run post-release hooks
      for (const hook of this.config.postReleaseHooks) {
        try {
          execSync(hook, { stdio: 'inherit' });
        } catch {
          console.warn(chalk.yellow(`Post-release hook failed: ${hook}`));
        }
      }

      return { success: true, message: `Released ${currentVersion} → ${newVersion}` };
    } catch (error) {
      return { 
        success: false, 
        message: `Release failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  async preview(type: ReleaseType): Promise<{ currentVersion: string; newVersion: string; changelog: string }> {
    const status = await this.getStatus();
    const currentVersion = status.currentVersion;
    
    let newVersion: string;
    if (type === 'prerelease') {
      newVersion = semver.inc(currentVersion, type, 'alpha') || currentVersion;
    } else {
      newVersion = semver.inc(currentVersion, type) || currentVersion;
    }
    
    const changelog = await this.generateChangelogPreview(newVersion, status.commitsSinceTag);
    
    return { currentVersion, newVersion, changelog };
  }

  private determineBumpFromCommits(commits: string[]): ReleaseType {
    let hasBreaking = false;
    let hasFeature = false;
    
    for (const commit of commits) {
      if (commit.includes('BREAKING CHANGE') || commit.includes('!:')) {
        hasBreaking = true;
        break;
      }
      if (commit.startsWith('feat')) {
        hasFeature = true;
      }
    }
    
    if (hasBreaking) return 'major';
    if (hasFeature) return 'minor';
    return 'patch';
  }

  private async updateChangelog(version: string, commitCount: number): Promise<void> {
    const logs = await this.git.log({ maxCount: commitCount || 20 });
    const entries = this.parseChangelogEntries(logs.all.map((l: { message: string }) => l.message));
    
    const changelogPath = path.join(process.cwd(), this.config.changelogPath);
    let existingContent = '';
    
    try {
      existingContent = await fs.readFile(changelogPath, 'utf-8');
    } catch {
      // File doesn't exist
    }

    const newSection = this.formatChangelogSection(version, entries);
    const updatedContent = newSection + '\n\n' + existingContent;
    
    await fs.writeFile(changelogPath, updatedContent);
  }

  private async generateChangelogPreview(version: string, commitCount: number): Promise<string> {
    const logs = await this.git.log({ maxCount: commitCount || 20 });
    const entries = this.parseChangelogEntries(logs.all.map((l: { message: string }) => l.message));
    return this.formatChangelogSection(version, entries);
  }

  private parseChangelogEntries(commits: string[]): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
    
    for (const commit of commits) {
      const lines = commit.split('\n');
      const firstLine = lines[0];
      
      // Parse conventional commit
      const match = firstLine.match(/^(\w+)(?:\([^)]+\))?!?:\s*(.+)$/);
      if (match) {
        const [, type, message] = match;
        const isBreaking = firstLine.includes('!:') || commit.includes('BREAKING CHANGE:');
        
        entries.push({
          type: isBreaking ? 'breaking' : type,
          message,
          isBreaking
        });
      }
    }
    
    return entries;
  }

  private formatChangelogSection(version: string, entries: ChangelogEntry[]): string {
    const date = new Date().toISOString().split('T')[0];
    let section = `## [${version}] - ${date}\n\n`;
    
    const groups: Record<string, ChangelogEntry[]> = {
      breaking: [],
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      chore: []
    };
    
    for (const entry of entries) {
      const key = entry.type in groups ? entry.type : 'chore';
      groups[key].push(entry);
    }
    
    if (groups.breaking.length > 0) {
      section += '### ⚠ BREAKING CHANGES\n\n';
      for (const entry of groups.breaking) {
        section += `- ${entry.message}\n`;
      }
      section += '\n';
    }
    
    if (groups.feat.length > 0) {
      section += '### ✨ Features\n\n';
      for (const entry of groups.feat) {
        section += `- ${entry.message}\n`;
      }
      section += '\n';
    }
    
    if (groups.fix.length > 0) {
      section += '### 🐛 Bug Fixes\n\n';
      for (const entry of groups.fix) {
        section += `- ${entry.message}\n`;
      }
      section += '\n';
    }
    
    return section;
  }

  async initConfig(): Promise<void> {
    const configPath = path.join(process.cwd(), '.ship.config.json');
    await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }

  getConfig(): ShipConfig {
    return this.config;
  }
}
