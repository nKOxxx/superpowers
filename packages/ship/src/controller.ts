import * as fs from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';
import * as semver from 'semver';
import { ShipOptions, ShipResult } from './cli';

interface Commit {
  type: string;
  scope?: string;
  message: string;
  hash: string;
}

export class ShipController {
  private git = simpleGit();

  async ship(versionType: string, options: ShipOptions): Promise<ShipResult> {
    const result: ShipResult = { success: false };

    // 1. Validate working directory
    await this.validateWorkingDirectory(options.branch);

    // 2. Run tests unless skipped
    if (!options.skipTests && !options.dryRun) {
      await this.runTests();
    }

    // 3. Build unless skipped
    if (!options.skipBuild && !options.dryRun) {
      await this.build();
    }

    // 4. Get current version and calculate new version
    const packageJson = this.readPackageJson();
    result.oldVersion = packageJson.version;
    result.newVersion = semver.inc(result.oldVersion, versionType as semver.ReleaseType)!;
    result.packageName = packageJson.name;

    // 5. Generate changelog
    const commits = await this.getCommitsSinceLastTag();
    result.commits = commits;
    const changelog = this.generateChangelog(result.newVersion, commits, options.message);

    if (options.dryRun) {
      console.log('Changes to be made:');
      console.log(`  - Update version: ${result.oldVersion} → ${result.newVersion}`);
      console.log(`  - Update CHANGELOG.md`);
      console.log(`  - Create git tag: v${result.newVersion}`);
      if (options.githubRelease) console.log(`  - Create GitHub release`);
      if (options.publish) console.log(`  - Publish to npm`);
      result.success = true;
      return result;
    }

    // 6. Update version in package.json
    await this.updateVersion(result.newVersion);

    // 7. Update changelog
    await this.updateChangelog(changelog);
    result.changelogPath = 'CHANGELOG.md';

    // 8. Commit changes
    await this.commitRelease(result.newVersion);

    // 9. Create tag
    const tag = `v${result.newVersion}`;
    await this.createTag(tag);
    result.tag = tag;

    // 10. Push to remote
    await this.pushToRemote(tag);

    // 11. Create GitHub release
    if (options.githubRelease) {
      result.githubReleaseUrl = await this.createGitHubRelease(tag, changelog);
    }

    // 12. Publish to npm
    if (options.publish) {
      await this.publishToNpm();
      result.published = true;
    }

    result.success = true;
    return result;
  }

  private async validateWorkingDirectory(branch: string): Promise<void> {
    // Check for uncommitted changes
    const status = await this.git.status();
    if (status.files.length > 0) {
      throw new Error('Working directory is not clean. Please commit or stash changes.');
    }

    // Check current branch
    const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    if (currentBranch !== branch) {
      throw new Error(`Not on ${branch} branch. Current: ${currentBranch}`);
    }

    // Pull latest changes
    await this.git.pull();
  }

  private async runTests(): Promise<void> {
    console.log('Running tests...');
    try {
      await this.git.raw(['exec', 'npm', 'test']);
    } catch (error) {
      throw new Error('Tests failed. Aborting release.');
    }
  }

  private async build(): Promise<void> {
    console.log('Building...');
    try {
      await this.git.raw(['exec', 'npm', 'run', 'build']);
    } catch (error) {
      throw new Error('Build failed. Aborting release.');
    }
  }

  private readPackageJson(): { name: string; version: string } {
    const content = fs.readFileSync('package.json', 'utf-8');
    return JSON.parse(content);
  }

  private async getCommitsSinceLastTag(): Promise<Commit[]> {
    // Get the last tag
    let lastTag: string | null = null;
    try {
      const tags = await this.git.tags(['--sort=-creatordate']);
      lastTag = tags.latest || null;
    } catch {
      // No tags yet
    }

    // Get commits since last tag
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    const log = await this.git.log({ from: lastTag || undefined });

    return log.all.map(commit => this.parseCommit(commit.message, commit.hash));
  }

  private parseCommit(message: string, hash: string): Commit {
    // Parse conventional commit format
    const match = message.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
    
    if (match) {
      return {
        type: match[1],
        scope: match[2],
        message: match[3],
        hash: hash.substring(0, 7)
      };
    }

    return {
      type: 'chore',
      message: message.split('\n')[0],
      hash: hash.substring(0, 7)
    };
  }

  private generateChangelog(version: string, commits: Commit[], customMessage?: string): string {
    const date = new Date().toISOString().split('T')[0];
    let changelog = `## [${version}] - ${date}\n\n`;

    if (customMessage) {
      changelog += `${customMessage}\n\n`;
    }

    // Group commits by type
    const groups: Record<string, Commit[]> = {
      Features: [],
      'Bug Fixes': [],
      Documentation: [],
      'Code Refactoring': [],
      Performance: [],
      Tests: [],
      Chores: []
    };

    commits.forEach(commit => {
      switch (commit.type) {
        case 'feat':
          groups.Features.push(commit);
          break;
        case 'fix':
          groups['Bug Fixes'].push(commit);
          break;
        case 'docs':
          groups.Documentation.push(commit);
          break;
        case 'refactor':
          groups['Code Refactoring'].push(commit);
          break;
        case 'perf':
          groups.Performance.push(commit);
          break;
        case 'test':
          groups.Tests.push(commit);
          break;
        default:
          groups.Chores.push(commit);
      }
    });

    // Build changelog sections
    Object.entries(groups).forEach(([section, sectionCommits]) => {
      if (sectionCommits.length > 0) {
        changelog += `### ${section}\n\n`;
        sectionCommits.forEach(commit => {
          const scope = commit.scope ? `**${commit.scope}:** ` : '';
          changelog += `- ${scope}${commit.message}\n`;
        });
        changelog += '\n';
      }
    });

    return changelog;
  }

  private async updateVersion(version: string): Promise<void> {
    const packageJson = this.readPackageJson();
    packageJson.version = version;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  }

  private async updateChangelog(changelog: string): Promise<void> {
    const changelogPath = 'CHANGELOG.md';
    const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';

    if (fs.existsSync(changelogPath)) {
      const existing = fs.readFileSync(changelogPath, 'utf-8');
      // Insert after header
      const insertIndex = existing.indexOf('\n## [');
      if (insertIndex >= 0) {
        const newContent = existing.slice(0, insertIndex + 1) + changelog + existing.slice(insertIndex + 1);
        fs.writeFileSync(changelogPath, newContent);
      } else {
        fs.writeFileSync(changelogPath, existing + '\n' + changelog);
      }
    } else {
      fs.writeFileSync(changelogPath, header + changelog);
    }
  }

  private async commitRelease(version: string): Promise<void> {
    await this.git.add(['package.json', 'CHANGELOG.md']);
    await this.git.commit(`chore(release): v${version}`);
  }

  private async createTag(tag: string): Promise<void> {
    await this.git.addTag(tag);
  }

  private async pushToRemote(tag: string): Promise<void> {
    await this.git.push();
    await this.git.pushTags();
  }

  private async createGitHubRelease(tag: string, changelog: string): Promise<string> {
    try {
      // Use GitHub CLI if available
      const { execSync } = require('child_process');
      const title = tag;
      const notes = changelog.replace(/"/g, '\\"');
      
      execSync(`gh release create ${tag} --title "${title}" --notes "${notes}"`, {
        stdio: 'inherit'
      });
      
      return `https://github.com/${await this.getRepoSlug()}/releases/tag/${tag}`;
    } catch (error) {
      console.warn('Could not create GitHub release. Make sure gh CLI is installed and authenticated.');
      return '';
    }
  }

  private async getRepoSlug(): Promise<string> {
    const remotes = await this.git.getRemotes(true);
    const origin = remotes.find(r => r.name === 'origin');
    if (origin) {
      const match = origin.refs.fetch.match(/github\.com[:/]([^/]+)\/([^/]+)\.git/);
      if (match) {
        return `${match[1]}/${match[2]}`;
      }
    }
    return '';
  }

  private async publishToNpm(): Promise<void> {
    const { execSync } = require('child_process');
    execSync('npm publish', { stdio: 'inherit' });
  }
}
