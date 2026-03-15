import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { inc, valid, ReleaseType } from 'semver';

export type VersionBump = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  version?: VersionBump | string;
  dryRun?: boolean;
  skipChangelog?: boolean;
  skipTag?: boolean;
  skipRelease?: boolean;
}

export interface ShipResult {
  success: boolean;
  version?: string;
  changelog?: string;
  tag?: string;
  releaseUrl?: string;
  dryRun?: boolean;
}

interface Commit {
  hash: string;
  type: string;
  scope?: string;
  subject: string;
}

export class ShipSkill {
  private getCurrentVersion(): string {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return pkg.version || '0.0.0';
    }
    return '0.0.0';
  }

  private getCommitsSinceLastTag(): Commit[] {
    try {
      // Get the latest tag
      let lastTag = '';
      try {
        lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
      } catch {
        // No tags yet
        lastTag = '';
      }

      // Get commits since last tag
      const format = '%H|%s';
      const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
      const output = execSync(`git log ${range} --pretty=format:"${format}"`, { encoding: 'utf-8' });

      return output.trim().split('\n').filter(Boolean).map(line => {
        const [hash, ...subjectParts] = line.split('|');
        const subject = subjectParts.join('|');
        
        // Parse conventional commit
        const match = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
        if (match) {
          return {
            hash: hash.slice(0, 7),
            type: match[1],
            scope: match[2],
            subject: match[3],
          };
        }
        
        return {
          hash: hash.slice(0, 7),
          type: 'other',
          subject,
        };
      });
    } catch {
      return [];
    }
  }

  private generateChangelog(commits: Commit[], version: string): string {
    const sections: Record<string, Commit[]> = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      chore: [],
      other: [],
    };

    for (const commit of commits) {
      if (sections[commit.type]) {
        sections[commit.type].push(commit);
      } else {
        sections.other.push(commit);
      }
    }

    const date = new Date().toISOString().split('T')[0];
    let changelog = `## [${version}] - ${date}\n\n`;

    const typeLabels: Record<string, string> = {
      feat: '### ✨ Features',
      fix: '### 🐛 Bug Fixes',
      docs: '### 📚 Documentation',
      style: '### 💎 Styles',
      refactor: '### ♻️ Code Refactoring',
      perf: '### ⚡ Performance',
      test: '### ✅ Tests',
      chore: '### 🔧 Chores',
      other: '### 📝 Other',
    };

    for (const [type, typeCommits] of Object.entries(sections)) {
      if (typeCommits.length > 0) {
        changelog += `${typeLabels[type]}\n`;
        for (const commit of typeCommits) {
          const scope = commit.scope ? `**${commit.scope}:** ` : '';
          changelog += `- ${scope}${commit.subject} (${commit.hash})\n`;
        }
        changelog += '\n';
      }
    }

    return changelog;
  }

  private updateChangelogFile(newEntry: string): void {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    
    let existing = '';
    if (fs.existsSync(changelogPath)) {
      existing = fs.readFileSync(changelogPath, 'utf-8');
      // Remove the header if it exists
      existing = existing.replace(/^# Changelog\n\n/i, '');
    }

    const content = `# Changelog\n\n${newEntry}${existing}`;
    fs.writeFileSync(changelogPath, content);
  }

  private updatePackageVersion(version: string): void {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    pkg.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  async release(options: ShipOptions): Promise<ShipResult> {
    const currentVersion = this.getCurrentVersion();
    
    // Determine new version
    let newVersion: string;
    if (options.version) {
      if (['patch', 'minor', 'major'].includes(options.version)) {
        const bumped = inc(currentVersion, options.version as ReleaseType);
        if (!bumped) {
          throw new Error(`Failed to bump version: ${currentVersion} with ${options.version}`);
        }
        newVersion = bumped;
      } else if (valid(options.version)) {
        newVersion = options.version;
      } else {
        throw new Error(`Invalid version: ${options.version}`);
      }
    } else {
      newVersion = inc(currentVersion, 'patch')!;
    }

    if (options.dryRun) {
      console.log(`📝 Dry run mode - no changes will be made`);
      console.log(`   Current version: ${currentVersion}`);
      console.log(`   New version: ${newVersion}`);
    }

    // Get commits and generate changelog
    const commits = this.getCommitsSinceLastTag();
    const changelogEntry = this.generateChangelog(commits, newVersion);

    if (options.dryRun) {
      console.log(`\n📋 Changelog preview:\n${changelogEntry}`);
    }

    if (options.dryRun) {
      return {
        success: true,
        version: newVersion,
        changelog: changelogEntry,
        dryRun: true,
      };
    }

    // Update files
    this.updatePackageVersion(newVersion);
    
    if (!options.skipChangelog) {
      this.updateChangelogFile(changelogEntry);
    }

    // Git operations
    if (!options.skipTag) {
      // Stage changes
      execSync('git add package.json');
      if (!options.skipChangelog) {
        execSync('git add CHANGELOG.md');
      }
      
      // Commit
      execSync(`git commit -m "chore(release): v${newVersion}"`);
      
      // Create tag
      execSync(`git tag v${newVersion}`);
      
      // Push
      execSync('git push origin HEAD --follow-tags');
    }

    // GitHub release
    let releaseUrl: string | undefined;
    if (!options.skipRelease) {
      try {
        const ghToken = process.env.GH_TOKEN;
        if (ghToken) {
          // Check if gh CLI is available
          execSync('which gh');
          
          // Create release
          execSync(`GH_TOKEN=${ghToken} gh release create v${newVersion} --title "v${newVersion}" --notes "${changelogEntry}"`);
          releaseUrl = `https://github.com/${this.getRepoSlug()}/releases/tag/v${newVersion}`;
        }
      } catch {
        console.log('⚠️ GitHub release creation skipped (gh CLI not available or GH_TOKEN not set)');
      }
    }

    return {
      success: true,
      version: newVersion,
      changelog: changelogEntry,
      tag: `v${newVersion}`,
      releaseUrl,
    };
  }

  private getRepoSlug(): string {
    try {
      const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (match) {
        return `${match[1]}/${match[2]}`;
      }
    } catch {
      // Ignore
    }
    return 'owner/repo';
  }
}

// CLI entry point
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    
    const options: ShipOptions = {};

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--version=') || arg.startsWith('-v=')) {
        options.version = arg.split('=')[1];
      } else if (arg === '--dry-run' || arg === '-d') {
        options.dryRun = true;
      } else if (arg === '--skip-changelog') {
        options.skipChangelog = true;
      } else if (arg === '--skip-tag') {
        options.skipTag = true;
      } else if (arg === '--skip-release') {
        options.skipRelease = true;
      }
    }

    const skill = new ShipSkill();
    try {
      const result = await skill.release(options);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }, null, 2));
      process.exit(1);
    }
  }

  main();
}
