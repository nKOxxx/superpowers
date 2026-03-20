/**
 * Ship Skill - Release pipeline for versioning and publishing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execAsync, Logger, ConsoleLogger, formatDuration, SkillResult } from '@openclaw/superpowers-shared';

export type VersionBump = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  bump: VersionBump;
  dryRun?: boolean;
  noPublish?: boolean;
  noGitHubRelease?: boolean;
  branch?: string;
  message?: string;
  skipCleanCheck?: boolean;
}

export interface ChangelogEntry {
  type: string;
  scope?: string;
  description: string;
  breaking?: boolean;
}

export interface ShipResult {
  success: boolean;
  previousVersion: string;
  newVersion: string;
  changelog: string;
  commits: ChangelogEntry[];
  steps: Array<{ step: string; success: boolean; message?: string }>;
  errors: string[];
}

export class ShipSkill {
  private logger: Logger;
  private cwd: string;

  constructor(cwd?: string, logger?: Logger) {
    this.cwd = cwd || process.cwd();
    this.logger = logger || new ConsoleLogger();
  }

  async ship(options: ShipOptions): Promise<ShipResult> {
    const startTime = Date.now();
    const steps: Array<{ step: string; success: boolean; message?: string }> = [];
    const errors: string[] = [];

    this.logger.info(`Starting release: ${options.bump} bump`);
    if (options.dryRun) {
      this.logger.info('DRY RUN - No changes will be applied');
    }

    try {
      // Step 1: Validate
      const validation = await this.validate(options);
      steps.push({ step: 'validate', success: validation.success, message: validation.message });
      if (!validation.success) {
        errors.push(validation.message);
        if (!options.dryRun) {
          return {
            success: false,
            previousVersion: '',
            newVersion: '',
            changelog: '',
            commits: [],
            steps,
            errors
          };
        }
      }

      // Step 2: Get current version and calculate new version
      const currentVersion = await this.getCurrentVersion();
      const newVersion = this.bumpVersion(currentVersion, options.bump);
      
      this.logger.info(`Version: ${currentVersion} → ${newVersion}`);

      // Step 3: Generate changelog
      const { changelog, commits } = await this.generateChangelog(currentVersion);
      steps.push({ step: 'changelog', success: true, message: `${commits.length} commits` });

      if (options.dryRun) {
        console.log('');
        console.log('═══ Preview ═══');
        console.log(`Version: ${currentVersion} → ${newVersion}`);
        console.log('');
        console.log('═══ Changelog ═══');
        console.log(changelog);
        
        return {
          success: true,
          previousVersion: currentVersion,
          newVersion,
          changelog,
          commits,
          steps,
          errors
        };
      }

      // Step 4: Update version
      await this.updateVersion(newVersion);
      steps.push({ step: 'bump', success: true });

      // Step 5: Update changelog file
      await this.updateChangelogFile(newVersion, changelog);
      steps.push({ step: 'update-changelog', success: true });

      // Step 6: Commit
      const commitMessage = options.message || `chore(release): v${newVersion}`;
      const commitResult = await this.commitChanges(newVersion, commitMessage);
      steps.push({ step: 'commit', success: commitResult.success, message: commitResult.message });
      if (!commitResult.success) {
        errors.push(`Commit failed: ${commitResult.message}`);
      }

      // Step 7: Tag
      const tagResult = await this.createTag(newVersion);
      steps.push({ step: 'tag', success: tagResult.success, message: tagResult.message });
      if (!tagResult.success) {
        errors.push(`Tag failed: ${tagResult.message}`);
      }

      // Step 8: Push
      const pushResult = await this.push(options.branch || 'main');
      steps.push({ step: 'push', success: pushResult.success, message: pushResult.message });
      if (!pushResult.success) {
        errors.push(`Push failed: ${pushResult.message}`);
      }

      // Step 9: GitHub Release
      if (!options.noGitHubRelease) {
        const releaseResult = await this.createGitHubRelease(newVersion, changelog);
        steps.push({ step: 'github-release', success: releaseResult.success, message: releaseResult.message });
        if (!releaseResult.success) {
          errors.push(`GitHub release failed: ${releaseResult.message}`);
        }
      }

      // Step 10: npm publish
      if (!options.noPublish) {
        const publishResult = await this.publishToNpm();
        steps.push({ step: 'npm-publish', success: publishResult.success, message: publishResult.message });
        if (!publishResult.success) {
          errors.push(`npm publish failed: ${publishResult.message}`);
        }
      }

      const success = steps.every(s => s.success);
      
      this.logger.info(`Release ${success ? 'completed' : 'completed with errors'} in ${formatDuration(Date.now() - startTime)}`);

      return {
        success,
        previousVersion: currentVersion,
        newVersion,
        changelog,
        commits,
        steps,
        errors
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Release failed: ${message}`);
      errors.push(message);

      return {
        success: false,
        previousVersion: '',
        newVersion: '',
        changelog: '',
        commits: [],
        steps,
        errors
      };
    }
  }

  private async validate(options: ShipOptions): Promise<{ success: boolean; message: string }> {
    // Check if git repo
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.cwd });
    } catch {
      return { success: false, message: 'Not a git repository' };
    }

    // Check if working directory is clean
    if (!options.skipCleanCheck && !options.dryRun) {
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.cwd });
      if (stdout.trim()) {
        return { success: false, message: 'Working directory is not clean. Commit or stash changes first.' };
      }
    }

    // Check for package.json
    try {
      await fs.access(path.join(this.cwd, 'package.json'));
    } catch {
      return { success: false, message: 'No package.json found' };
    }

    return { success: true, message: 'Validation passed' };
  }

  private async getCurrentVersion(): Promise<string> {
    const packagePath = path.join(this.cwd, 'package.json');
    const pkg = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
    return pkg.version || '0.0.0';
  }

  private bumpVersion(current: string, bump: VersionBump): string {
    const parts = current.replace(/^v/, '').split('.').map(Number);
    const [major, minor, patch] = parts;

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

  private async generateChangelog(sinceVersion: string): Promise<{ changelog: string; commits: ChangelogEntry[] }> {
    try {
      // Get commits since last tag
      const { stdout } = await execAsync(
        `git log v${sinceVersion}..HEAD --pretty=format:"%s" --no-merges || git log --pretty=format:"%s" --no-merges -20`,
        { cwd: this.cwd }
      );

      const commits: ChangelogEntry[] = [];
      const lines = stdout.split('\n').filter(Boolean);

      for (const line of lines) {
        const parsed = this.parseCommit(line);
        if (parsed) {
          commits.push(parsed);
        }
      }

      // Group by type
      const groups = this.groupCommits(commits);
      
      // Generate markdown
      let changelog = '';
      for (const [type, entries] of Object.entries(groups)) {
        if (entries.length > 0) {
          changelog += `### ${type}\n\n`;
          for (const entry of entries) {
            const scope = entry.scope ? `**${entry.scope}**: ` : '';
            const breaking = entry.breaking ? ' ⚠️ BREAKING' : '';
            changelog += `- ${scope}${entry.description}${breaking}\n`;
          }
          changelog += '\n';
        }
      }

      return { changelog, commits };
    } catch {
      return { changelog: '', commits: [] };
    }
  }

  private parseCommit(message: string): ChangelogEntry | null {
    // Parse conventional commit format: type(scope): description
    const match = message.match(/^(\w+)(?:\(([^)]+)\))?!?: (.+)$/);
    if (!match) return null;

    const [, type, scope, description] = match;
    const breaking = message.includes('!') || message.includes('BREAKING');

    const typeMap: Record<string, string> = {
      feat: 'Features',
      fix: 'Bug Fixes',
      docs: 'Documentation',
      refactor: 'Code Refactoring',
      perf: 'Performance',
      test: 'Tests',
      chore: 'Chores',
      ci: 'CI/CD',
      build: 'Build',
      style: 'Styles'
    };

    return {
      type: typeMap[type] || type,
      scope,
      description,
      breaking
    };
  }

  private groupCommits(commits: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
    const groups: Record<string, ChangelogEntry[]> = {};
    
    for (const commit of commits) {
      if (!groups[commit.type]) {
        groups[commit.type] = [];
      }
      groups[commit.type].push(commit);
    }

    return groups;
  }

  private async updateVersion(version: string): Promise<void> {
    const packagePath = path.join(this.cwd, 'package.json');
    const pkg = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
    pkg.version = version;
    await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  }

  private async updateChangelogFile(version: string, changelog: string): Promise<void> {
    const changelogPath = path.join(this.cwd, 'CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];
    const entry = `## [${version}] - ${date}\n\n${changelog}`;

    try {
      const existing = await fs.readFile(changelogPath, 'utf-8');
      await fs.writeFile(changelogPath, entry + '\n' + existing);
    } catch {
      await fs.writeFile(changelogPath, '# Changelog\n\n' + entry);
    }
  }

  private async commitChanges(version: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync('git add package.json CHANGELOG.md', { cwd: this.cwd });
      await execAsync(`git commit -m "${message}"`, { cwd: this.cwd });
      return { success: true, message: `Committed: ${message}` };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  private async createTag(version: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`git tag -a v${version} -m "Release v${version}"`, { cwd: this.cwd });
      return { success: true, message: `Created tag: v${version}` };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  private async push(branch: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`git push origin ${branch} --follow-tags`, { cwd: this.cwd });
      return { success: true, message: `Pushed to ${branch}` };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  private async createGitHubRelease(version: string, changelog: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if gh CLI is available
      await execAsync('gh --version', { cwd: this.cwd });
      
      const notes = changelog.replace(/"/g, '\\"');
      await execAsync(
        `gh release create v${version} --title "v${version}" --notes "${notes}"`,
        { cwd: this.cwd }
      );
      return { success: true, message: `Created GitHub release: v${version}` };
    } catch {
      return { success: false, message: 'GitHub CLI not available or release failed' };
    }
  }

  private async publishToNpm(): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync('npm publish', { cwd: this.cwd });
      return { success: true, message: 'Published to npm' };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }
}

// Export convenience function
export async function ship(bump: VersionBump, options?: Omit<ShipOptions, 'bump'>, cwd?: string): Promise<ShipResult> {
  const skill = new ShipSkill(cwd);
  return skill.ship({ bump, ...options });
}