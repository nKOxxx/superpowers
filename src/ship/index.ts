/**
 * Ship Skill - One-command release pipeline
 * 
 * Usage: /ship [--version=patch|minor|major|<semver>] [--dry-run] [--skip-tests]
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ShipOptions, ReleaseInfo, SkillResult } from '../types.js';
import { success, failure, execCommand, execCommandSilent, streamCommand } from '../utils.js';

export class ShipSkill {
  private cwd: string;
  private pkg: any;
  private pkgPath: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    this.pkgPath = join(cwd, 'package.json');
    this.pkg = existsSync(this.pkgPath) ? JSON.parse(readFileSync(this.pkgPath, 'utf-8')) : {};
  }

  async execute(options: ShipOptions): Promise<SkillResult> {
    try {
      // Validate we're in a git repo
      if (!this.isGitRepo()) {
        return failure('Not a git repository');
      }

      // Check for uncommitted changes
      if (this.hasUncommittedChanges()) {
        return failure('Uncommitted changes detected. Commit or stash before shipping.');
      }

      // Determine new version
      const currentVersion = this.pkg.version || '0.0.0';
      const newVersion = this.calculateVersion(currentVersion, options.version || 'patch');

      // Get commits since last tag
      const commits = this.getCommitsSinceLastTag();

      // Generate changelog entry
      const changelog = this.generateChangelog(newVersion, commits);

      const releaseInfo: ReleaseInfo = {
        version: newVersion,
        changelog,
        commits,
        tagName: `v${newVersion}`
      };

      if (options.dryRun) {
        return success(
          `🔍 DRY RUN - No changes made\n` +
          `📦 Version: ${currentVersion} → ${newVersion}\n` +
          `📝 Changelog:\n${changelog}`,
          releaseInfo
        );
      }

      // Run tests if not skipped
      if (!options.skipTests) {
        const testResult = await this.runTests();
        if (!testResult.success) {
          return failure('Tests failed. Fix before shipping or use --skip-tests');
        }
      }

      // Update version in package.json
      this.updateVersion(newVersion);

      // Update changelog
      if (!options.skipChangelog) {
        this.updateChangelogFile(changelog);
      }

      // Commit version bump
      execCommand('git add package.json', this.cwd);
      if (!options.skipChangelog && existsSync(join(this.cwd, 'CHANGELOG.md'))) {
        execCommand('git add CHANGELOG.md', this.cwd);
      }
      execCommand(`git commit -m "chore(release): ${newVersion}"`, this.cwd);

      // Create git tag
      if (!options.skipGitTag) {
        execCommand(`git tag -a v${newVersion} -m "Release ${newVersion}"`, this.cwd);
      }

      // Push to remote
      execCommand('git push origin HEAD', this.cwd);
      if (!options.skipGitTag) {
        execCommand(`git push origin v${newVersion}`, this.cwd);
      }

      // Create GitHub release if token available
      if (!options.skipGitHubRelease && process.env.GH_TOKEN) {
        await this.createGitHubRelease(releaseInfo);
      }

      return success(
        `🚀 Shipped ${newVersion}!\n` +
        `📦 Package: ${this.pkg.name}@${newVersion}\n` +
        `🏷️  Tag: v${newVersion}\n` +
        `📝 Commits: ${commits.length}`,
        releaseInfo
      );
    } catch (error) {
      return failure(`Ship failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private isGitRepo(): boolean {
    return existsSync(join(this.cwd, '.git'));
  }

  private hasUncommittedChanges(): boolean {
    const { stdout } = execCommandSilent('git status --porcelain', this.cwd);
    return stdout.trim().length > 0;
  }

  private calculateVersion(current: string, bump: string): string {
    if (bump.match(/^\d+\.\d+\.\d+/)) {
      return bump;
    }

    const [major, minor, patch] = current.replace(/^v/, '').split('.').map(Number);

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

  private getCommitsSinceLastTag(): string[] {
    try {
      const lastTag = execCommandSilent('git describe --tags --abbrev=0 2>/dev/null || echo ""', this.cwd).stdout;
      const range = lastTag ? `${lastTag}..HEAD` : 'HEAD~20';
      const output = execCommand(`git log ${range} --pretty=format:"%s" --no-merges`, this.cwd);
      return output.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  private generateChangelog(version: string, commits: string[]): string {
    const sections: Record<string, string[]> = {
      features: [],
      fixes: [],
      other: []
    };

    for (const commit of commits) {
      if (commit.match(/^feat/i)) {
        sections.features.push(commit);
      } else if (commit.match(/^fix/i)) {
        sections.fixes.push(commit);
      } else {
        sections.other.push(commit);
      }
    }

    let changelog = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;

    if (sections.features.length > 0) {
      changelog += '### Features\n';
      for (const feat of sections.features) {
        changelog += `- ${feat}\n`;
      }
      changelog += '\n';
    }

    if (sections.fixes.length > 0) {
      changelog += '### Bug Fixes\n';
      for (const fix of sections.fixes) {
        changelog += `- ${fix}\n`;
      }
      changelog += '\n';
    }

    if (sections.other.length > 0) {
      changelog += '### Other\n';
      for (const other of sections.other.slice(0, 10)) {
        changelog += `- ${other}\n`;
      }
    }

    return changelog;
  }

  private updateVersion(version: string): void {
    this.pkg.version = version;
    writeFileSync(this.pkgPath, JSON.stringify(this.pkg, null, 2) + '\n');
  }

  private updateChangelogFile(entry: string): void {
    const changelogPath = join(this.cwd, 'CHANGELOG.md');
    const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    
    let existing = '';
    if (existsSync(changelogPath)) {
      existing = readFileSync(changelogPath, 'utf-8').replace(header, '');
    }

    writeFileSync(changelogPath, header + entry + '\n' + existing);
  }

  private async runTests(): Promise<{ success: boolean }> {
    const { code } = await streamCommand('npm', ['test'], this.cwd);
    return { success: code === 0 };
  }

  private async createGitHubRelease(info: ReleaseInfo): Promise<void> {
    const { tagName, changelog } = info;
    const repo = execCommand('git remote get-url origin', this.cwd)
      .replace(/.*github.com[\/:]/, '')
      .replace(/\.git$/, '');

    const body = changelog.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    execCommandSilent(
      `curl -X POST -H "Authorization: token ${process.env.GH_TOKEN}" ` +
      `-H "Accept: application/vnd.github.v3+json" ` +
      `https://api.github.com/repos/${repo}/releases ` +
      `-d '{"tag_name":"${tagName}","name":"${tagName}","body":"${body}"}'`,
      this.cwd
    );
  }
}

// CLI entry point
export async function run(args: string[], cwd?: string): Promise<SkillResult> {
  const options = parseShipArgs(args);
  const skill = new ShipSkill(cwd);
  return skill.execute(options);
}

function parseShipArgs(args: string[]): ShipOptions {
  const options: ShipOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--version' || arg.startsWith('--version=')) {
      options.version = arg.includes('=') ? arg.split('=')[1] : args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--skip-tests') {
      options.skipTests = true;
    } else if (arg === '--skip-changelog') {
      options.skipChangelog = true;
    } else if (arg === '--skip-git-tag') {
      options.skipGitTag = true;
    } else if (arg === '--skip-github-release') {
      options.skipGitHubRelease = true;
    }
  }

  return options;
}
