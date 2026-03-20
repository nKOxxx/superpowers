import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as semver from 'semver';
import { ShipOptions, ShipResult, VersionType, Commit, ChangelogEntry } from './types';
import { GitHelper } from './git-helper';
import { ChangelogGenerator } from './changelog';
import { PackageManager } from './package-manager';

export class ShipController {
  private options: ShipOptions;
  private git: GitHelper;
  private changelog: ChangelogGenerator;
  private packageManager: PackageManager;

  constructor(options: ShipOptions) {
    this.options = options;
    this.git = new GitHelper();
    this.changelog = new ChangelogGenerator();
    this.packageManager = new PackageManager();
  }

  async execute(): Promise<ShipResult> {
    const result: ShipResult = {
      success: false,
      warnings: [],
      errors: []
    };

    try {
      // Validation phase
      await this.validate();

      // Get current version
      result.previousVersion = this.packageManager.getCurrentVersion();

      // Calculate new version
      result.version = this.calculateVersion(result.previousVersion);

      if (this.options.dryRun) {
        result.warnings.push('Dry run - no changes applied');
        result.success = true;
        return result;
      }

      // Run tests
      if (!this.options.skipTests) {
        await this.runTests();
      }

      // Build
      if (!this.options.skipBuild) {
        await this.runBuild();
      }

      // Generate changelog
      if (!this.options.skipChangelog) {
        const commits = this.git.getCommitsSinceLastTag();
        const entries = this.changelog.parseCommits(commits);
        result.changelog = {
          generated: true,
          entries
        };
        this.changelog.updateChangelogFile(result.version, entries);
      }

      // Update version
      this.packageManager.updateVersion(result.version);

      // Commit changes
      const commitMessage = this.options.message || `chore(release): v${result.version}`;
      this.git.commitChanges(commitMessage);
      result.git = { commit: this.git.getLastCommitHash() };

      // Create tag
      const tagName = `v${result.version}`;
      this.git.createTag(tagName);
      result.git.tag = tagName;

      // Push
      this.git.push(this.options.branch);
      this.git.pushTags();
      result.git.pushed = true;

      // GitHub release
      if (this.options.githubRelease) {
        try {
          const release = this.createGitHubRelease(result.version);
          result.github = { released: true, url: release.url, id: release.id };
        } catch (err) {
          result.warnings.push(`GitHub release failed: ${err}`);
          result.github = { released: false };
        }
      }

      // npm publish
      if (this.options.publish) {
        try {
          this.publishNpm(result.version);
          result.npm = { published: true, package: this.packageManager.getPackageName() };
        } catch (err) {
          result.warnings.push(`npm publish failed: ${err}`);
          result.npm = { published: false };
        }
      }

      result.success = true;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.success = false;
    }

    return result;
  }

  private async validate(): Promise<void> {
    // Check git repository
    if (!this.git.isGitRepository()) {
      throw new Error('Not a git repository');
    }

    // Check clean working directory
    if (!this.options.force && !this.git.isWorkingDirectoryClean()) {
      throw new Error('Working directory is not clean. Commit or stash changes first, or use --force');
    }

    // Check on correct branch
    const currentBranch = this.git.getCurrentBranch();
    if (currentBranch !== this.options.branch) {
      throw new Error(`Not on ${this.options.branch} branch. Current: ${currentBranch}`);
    }

    // Check for package.json
    if (!this.packageManager.hasPackageJson()) {
      throw new Error('No package.json found');
    }

    // Validate version type
    if (!this.isValidVersionType(this.options.version)) {
      throw new Error(`Invalid version type: ${this.options.version}`);
    }
  }

  private isValidVersionType(version: VersionType): boolean {
    if (['patch', 'minor', 'major'].includes(version)) return true;
    return semver.valid(version) !== null;
  }

  private calculateVersion(currentVersion: string): string {
    const version = this.options.version;

    if (['patch', 'minor', 'major'].includes(version)) {
      const prereleaseId = this.options.prerelease;
      if (prereleaseId) {
        return semver.inc(currentVersion, `pre${version}` as semver.ReleaseType, prereleaseId)!;
      }
      return semver.inc(currentVersion, version as semver.ReleaseType)!;
    }

    // Specific version
    if (semver.valid(version)) {
      return version;
    }

    throw new Error(`Invalid version: ${version}`);
  }

  private async runTests(): Promise<void> {
    try {
      execSync('npm test', { stdio: 'inherit' });
    } catch {
      throw new Error('Tests failed');
    }
  }

  private async runBuild(): Promise<void> {
    const pkg = this.packageManager.getPackageJson();
    if (pkg.scripts?.build) {
      try {
        execSync('npm run build', { stdio: 'inherit' });
      } catch {
        throw new Error('Build failed');
      }
    }
  }

  private createGitHubRelease(version: string): { url: string; id: number } {
    try {
      // Check if gh CLI is available
      execSync('gh --version', { stdio: 'ignore' });
    } catch {
      throw new Error('GitHub CLI (gh) not installed');
    }

    const tagName = `v${version}`;
    const title = this.options.message || `Release ${tagName}`;
    
    // Generate release notes from changelog
    let notes = '';
    try {
      notes = this.changelog.getReleaseNotes(version);
    } catch {
      notes = `Release ${tagName}`;
    }

    const prereleaseFlag = this.options.prerelease ? '--prerelease' : '';
    
    const output = execSync(
      `gh release create ${tagName} --title "${title}" --notes "${notes}" ${prereleaseFlag} --json url,id`,
      { encoding: 'utf-8' }
    );

    const release = JSON.parse(output);
    return { url: release.url, id: release.id };
  }

  private publishNpm(version: string): void {
    // Check if logged in
    try {
      execSync('npm whoami', { stdio: 'ignore' });
    } catch {
      throw new Error('Not logged in to npm. Run npm login first.');
    }

    const tag = this.options.prerelease ? `--tag ${this.options.prerelease}` : '';
    const access = this.packageManager.isPublicPackage() ? 'public' : 'restricted';
    
    execSync(`npm publish ${tag} --access ${access}`, { stdio: 'inherit' });
  }
}
