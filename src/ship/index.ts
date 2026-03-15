import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as semver from 'semver';

export interface ShipOptions {
  version: string;
  repo?: string;
  dryRun?: boolean;
  skipTests?: boolean;
  notes?: string;
  prerelease?: boolean;
}

export interface ReleaseResult {
  version: string;
  tag: string;
  commits: string[];
  changelog: string;
  pushed: boolean;
  released: boolean;
}

export class ShipSkill {
  async ship(options: ShipOptions): Promise<ReleaseResult> {
    // Validate working directory
    this.validateGitRepo();

    if (!options.dryRun) {
      this.validateCleanWorkingDirectory();
    }

    // Get current version
    const currentVersion = await this.getCurrentVersion();
    
    // Calculate new version
    const newVersion = this.calculateVersion(currentVersion, options.version);
    const tag = `v${newVersion}`;

    // Run tests if not skipped
    if (!options.skipTests && !options.dryRun) {
      this.runTests();
    }

    // Generate changelog
    const commits = this.getCommitsSinceLastTag();
    const changelog = this.generateChangelog(commits, newVersion);

    if (options.dryRun) {
      console.log('DRY RUN - Would execute:');
      console.log(`  - Update version: ${currentVersion} → ${newVersion}`);
      console.log(`  - Update CHANGELOG.md`);
      console.log(`  - Commit: "chore: release ${newVersion}"`);
      console.log(`  - Tag: ${tag}`);
      console.log(`  - Push to origin`);
      if (process.env.GH_TOKEN) {
        console.log(`  - Create GitHub release`);
      }
      
      return {
        version: newVersion,
        tag,
        commits,
        changelog,
        pushed: false,
        released: false
      };
    }

    // Update package.json
    await this.updateVersion(newVersion);

    // Update changelog
    await this.updateChangelog(changelog);

    // Create commit and tag
    this.createCommit(newVersion);
    this.createTag(tag);

    // Push
    this.pushToOrigin(tag);

    // Create GitHub release
    let released = false;
    if (process.env.GH_TOKEN) {
      released = await this.createGitHubRelease(options, tag, changelog);
    }

    return {
      version: newVersion,
      tag,
      commits,
      changelog,
      pushed: true,
      released
    };
  }

  private validateGitRepo(): void {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    } catch {
      throw new Error('Not a git repository');
    }
  }

  private validateCleanWorkingDirectory(): void {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (status.trim()) {
        throw new Error('Working directory is not clean. Please commit or stash changes first.');
      }
    } catch (error: any) {
      if (error.message.includes('not clean')) throw error;
      throw new Error('Failed to check git status');
    }
  }

  private async getCurrentVersion(): Promise<string> {
    try {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      return pkg.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  private calculateVersion(current: string, bump: string): string {
    if (semver.valid(bump)) {
      return bump;
    }

    if (['patch', 'minor', 'major'].includes(bump)) {
      const newVersion = semver.inc(current, bump as semver.ReleaseType);
      if (newVersion) return newVersion;
    }

    throw new Error(`Invalid version bump: ${bump}. Use patch, minor, major, or explicit version.`);
  }

  private runTests(): void {
    console.log('Running tests...');
    try {
      execSync('npm test', { stdio: 'inherit' });
    } catch {
      throw new Error('Tests failed. Release aborted.');
    }
  }

  private getCommitsSinceLastTag(): string[] {
    try {
      const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { 
        encoding: 'utf-8' 
      }).trim();

      const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
      const output = execSync(`git log ${range} --pretty=format:"%s"`, { encoding: 'utf-8' });
      
      return output.trim().split('\n').filter(c => c);
    } catch {
      return [];
    }
  }

  private generateChangelog(commits: string[], version: string): string {
    const categories: Record<string, string[]> = {
      Features: [],
      'Bug Fixes': [],
      Chores: [],
      Other: []
    };

    for (const commit of commits) {
      if (commit.startsWith('feat:') || commit.startsWith('feat(')) {
        categories.Features.push(commit);
      } else if (commit.startsWith('fix:') || commit.startsWith('fix(')) {
        categories['Bug Fixes'].push(commit);
      } else if (commit.startsWith('chore:') || commit.startsWith('chore(')) {
        categories.Chores.push(commit);
      } else {
        categories.Other.push(commit);
      }
    }

    let changelog = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;

    for (const [category, items] of Object.entries(categories)) {
      if (items.length > 0) {
        changelog += `### ${category}\n`;
        for (const item of items) {
          changelog += `- ${item}\n`;
        }
        changelog += '\n';
      }
    }

    return changelog;
  }

  private async updateVersion(version: string): Promise<void> {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    pkg.version = version;
    await fs.writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n');
  }

  private async updateChangelog(changelog: string): Promise<void> {
    const changelogPath = 'CHANGELOG.md';
    let existing = '';
    
    try {
      existing = await fs.readFile(changelogPath, 'utf-8');
    } catch {}

    const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    const newContent = header + changelog + existing.replace(header, '');
    
    await fs.writeFile(changelogPath, newContent);
  }

  private createCommit(version: string): void {
    execSync('git add package.json CHANGELOG.md', { stdio: 'ignore' });
    execSync(`git commit -m "chore: release ${version}"`, { stdio: 'ignore' });
  }

  private createTag(tag: string): void {
    execSync(`git tag ${tag}`, { stdio: 'ignore' });
  }

  private pushToOrigin(tag: string): void {
    execSync('git push origin HEAD', { stdio: 'ignore' });
    execSync(`git push origin ${tag}`, { stdio: 'ignore' });
  }

  private async createGitHubRelease(
    options: ShipOptions, 
    tag: string, 
    changelog: string
  ): Promise<boolean> {
    if (!process.env.GH_TOKEN) return false;

    try {
      const repo = options.repo || this.detectRepo();
      if (!repo) {
        console.warn('Could not detect repository for GitHub release');
        return false;
      }

      const releaseNotes = options.notes ? `${options.notes}\n\n${changelog}` : changelog;
      
      execSync(
        `gh release create ${tag} \
          --repo ${repo} \
          --title "${tag}" \
          --notes "${releaseNotes.replace(/"/g, '\\"')}" \
          ${options.prerelease ? '--prerelease' : ''}`,
        { stdio: 'ignore' }
      );

      return true;
    } catch (error) {
      console.warn('Failed to create GitHub release:', error);
      return false;
    }
  }

  private detectRepo(): string | null {
    try {
      const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      
      // Parse GitHub URL
      const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+)(\.git)?$/);
      if (match) {
        return `${match[1]}/${match[2].replace(/\.git$/, '')}`;
      }
    } catch {}

    return null;
  }
}

export default ShipSkill;
