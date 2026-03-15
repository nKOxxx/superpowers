import { ShipOptions, ReleaseResult, ChangelogEntry } from '../types/index.js';
import { Logger, execSync, loadConfig } from '../utils/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import { execSync as childExecSync } from 'child_process';

export class ShipSkill {
  private logger: Logger;
  private config: any;

  constructor(verbose = false) {
    this.logger = new Logger(verbose);
    this.config = loadConfig();
  }

  async run(options: ShipOptions): Promise<ReleaseResult> {
    this.logger.header('Release Pipeline');

    try {
      // Step 1: Validate
      if (!options.skipTests) {
        await this.validate(options);
      }

      // Step 2: Get current version
      const currentVersion = this.getCurrentVersion();
      const newVersion = this.calculateNewVersion(currentVersion, options.version);
      
      this.logger.info(`Current version: ${currentVersion}`);
      this.logger.info(`New version: ${newVersion}`);

      if (options.dryRun) {
        this.logger.warn('DRY RUN - No changes will be made');
        return {
          success: true,
          version: newVersion,
          tag: `v${newVersion}`
        };
      }

      // Step 3: Run tests
      if (!options.skipTests) {
        await this.runTests();
      }

      // Step 4: Update version
      this.updateVersion(newVersion);
      this.logger.success(`Version updated to ${newVersion}`);

      // Step 5: Generate changelog
      const changelog = this.generateChangelog(newVersion);
      this.logger.success('Changelog updated');

      // Step 6: Commit changes
      this.commitChanges(newVersion);
      this.logger.success('Release commit created');

      // Step 7: Create tag
      this.createTag(newVersion);
      this.logger.success(`Tag v${newVersion} created`);

      // Step 8: Push
      this.pushToRemote();
      this.logger.success('Pushed to remote');

      // Step 9: Create GitHub release
      if (process.env.GH_TOKEN) {
        await this.createGitHubRelease(newVersion, changelog, options);
        this.logger.success('GitHub release created');
      }

      this.logger.success(`\n✓ Released ${newVersion}`);

      return {
        success: true,
        version: newVersion,
        tag: `v${newVersion}`,
        changelog
      };

    } catch (error: any) {
      this.logger.error(`Release failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async validate(options: ShipOptions): Promise<void> {
    // Check for clean working directory
    const status = execSync('git status --porcelain');
    const requireClean = this.config?.ship?.requireCleanWorkingDir !== false;
    
    if (status && requireClean) {
      throw new Error('Working directory is not clean. Commit or stash changes first.');
    }

    // Check for GH_TOKEN if creating GitHub release
    if (!options.dryRun && !process.env.GH_TOKEN) {
      this.logger.warn('GH_TOKEN not set. GitHub release will be skipped.');
    }
  }

  private getCurrentVersion(): string {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('No package.json found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '0.0.0';
  }

  private calculateNewVersion(current: string, bump: string): string {
    // If explicit version provided
    if (bump.match(/^\d+\.\d+\.\d+/)) {
      return bump;
    }

    // Otherwise use semver bump
    const newVersion = semver.inc(current, bump as semver.ReleaseType);
    if (!newVersion) {
      throw new Error(`Invalid version bump: ${bump}`);
    }
    return newVersion;
  }

  private async runTests(): Promise<void> {
    const runTests = this.config?.ship?.runTestsBeforeRelease !== false;
    if (!runTests) {
      this.logger.info('Skipping tests (configured)');
      return;
    }

    this.logger.info('Running tests...');
    try {
      childExecSync('npm test', { stdio: 'inherit' });
      this.logger.success('Tests passed');
    } catch (error: any) {
      throw new Error('Tests failed. Fix before releasing.');
    }
  }

  private updateVersion(version: string): void {
    // Update package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    // Update additional version files if configured
    const versionFiles = this.config?.ship?.versionFiles || [];
    for (const file of versionFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        // Simple version replacement - assumes file exports or defines version
        content = content.replace(/version['"]?:\s*['"][^'"]+['"]/, `version: '${version}'`);
        content = content.replace(/VERSION\s*=\s*['"][^'"]+['"]/, `VERSION = '${version}'`);
        fs.writeFileSync(filePath, content);
      }
    }
  }

  private generateChangelog(version: string): string {
    const changelogPath = this.config?.ship?.changelogPath || 'CHANGELOG.md';
    const fullPath = path.join(process.cwd(), changelogPath);
    
    // Get commits since last tag
    const lastTag = this.getLastTag();
    const commits = this.getCommitsSince(lastTag);
    
    // Parse conventional commits
    const entries = this.parseCommits(commits);
    
    // Build changelog entry
    const date = new Date().toISOString().split('T')[0];
    let changelogEntry = `\n## [${version}] - ${date}\n\n`;
    
    const sections: Record<string, ChangelogEntry[]> = {
      feat: [],
      fix: [],
      chore: [],
      docs: [],
      refactor: [],
      test: [],
      other: []
    };
    
    for (const entry of entries) {
      sections[entry.type].push(entry);
    }

    if (sections.feat.length > 0) {
      changelogEntry += '### Features\n';
      for (const entry of sections.feat) {
        changelogEntry += `- ${entry.message}\n`;
      }
      changelogEntry += '\n';
    }

    if (sections.fix.length > 0) {
      changelogEntry += '### Bug Fixes\n';
      for (const entry of sections.fix) {
        changelogEntry += `- ${entry.message}\n`;
      }
      changelogEntry += '\n';
    }

    if (sections.chore.length > 0) {
      changelogEntry += '### Chores\n';
      for (const entry of sections.chore) {
        changelogEntry += `- ${entry.message}\n`;
      }
      changelogEntry += '\n';
    }

    if (sections.other.length > 0) {
      changelogEntry += '### Other Changes\n';
      for (const entry of sections.other) {
        changelogEntry += `- ${entry.message}\n`;
      }
      changelogEntry += '\n';
    }

    // Update changelog file
    if (fs.existsSync(fullPath)) {
      const existing = fs.readFileSync(fullPath, 'utf-8');
      // Insert after the header
      const lines = existing.split('\n');
      const insertIndex = lines.findIndex(l => l.startsWith('## ')) + 1;
      lines.splice(insertIndex, 0, changelogEntry);
      fs.writeFileSync(fullPath, lines.join('\n'));
    } else {
      fs.writeFileSync(fullPath, `# Changelog\n\n${changelogEntry}`);
    }

    return changelogEntry;
  }

  private getLastTag(): string {
    try {
      return execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""');
    } catch {
      return '';
    }
  }

  private getCommitsSince(tag: string): string[] {
    try {
      const range = tag ? `${tag}..HEAD` : 'HEAD';
      const output = execSync(`git log ${range} --pretty=format:"%s" --no-merges`);
      return output.split('\n').filter(c => c.trim());
    } catch {
      return [];
    }
  }

  private parseCommits(commits: string[]): ChangelogEntry[] {
    return commits.map(message => {
      const match = message.match(/^(feat|fix|chore|docs|refactor|test)(?:\(([^)]+)\))?:\s*(.+)$/);
      
      if (match) {
        return {
          type: match[1] as ChangelogEntry['type'],
          scope: match[2],
          message: match[3]
        };
      }
      
      return {
        type: 'other',
        message
      };
    });
  }

  private commitChanges(version: string): void {
    execSync('git add -A');
    execSync(`git commit -m "chore(release): ${version}"`);
  }

  private createTag(version: string): void {
    execSync(`git tag -a v${version} -m "Release v${version}"`);
  }

  private pushToRemote(): void {
    execSync('git push origin HEAD --follow-tags');
  }

  private async createGitHubRelease(version: string, changelog: string, options: ShipOptions): Promise<void> {
    const token = process.env.GH_TOKEN;
    if (!token) return;

    const repo = options.repo || this.detectRepo();
    if (!repo) {
      this.logger.warn('Could not detect repository, skipping GitHub release');
      return;
    }

    const tag = `v${version}`;
    const name = options.notes || `Release ${version}`;
    const body = changelog.replace(/#{1,3}\s/g, '').trim();
    const prerelease = options.prerelease || version.includes('-');

    // Use gh CLI if available
    if (this.commandExists('gh')) {
      try {
        const cmd = `GH_TOKEN=${token} gh release create ${tag} --repo ${repo} --title "${name}" --notes "${body}"${prerelease ? ' --prerelease' : ''}`;
        execSync(cmd);
        return;
      } catch (error: any) {
        this.logger.warn(`GitHub CLI release failed: ${error.message}`);
      }
    }

    // Fallback to API
    try {
      const data = JSON.stringify({
        tag_name: tag,
        name: name,
        body: body,
        prerelease: prerelease
      });

      const cmd = `curl -s -X POST -H "Authorization: token ${token}" -H "Content-Type: application/json" -d '${data}' https://api.github.com/repos/${repo}/releases`;
      execSync(cmd);
    } catch (error: any) {
      this.logger.warn(`GitHub API release failed: ${error.message}`);
    }
  }

  private detectRepo(): string | null {
    try {
      const remote = execSync('git remote get-url origin');
      const match = remote.match(/github\.com[:\/]([^\/]+)\/([^\/]+)(\.git)?$/);
      if (match) {
        return `${match[1]}/${match[2].replace(/\.git$/, '')}`;
      }
    } catch {
      // ignore
    }
    return null;
  }

  private commandExists(command: string): boolean {
    try {
      childExecSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}
