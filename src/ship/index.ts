import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import semver from 'semver';
import { loadConfig } from '../utils/config.js';
import { printHeader, printSuccess, printError, printInfo, printWarning } from '../utils/format.js';

export interface ShipOptions {
  version: string;
  repo?: string;
  dryRun: boolean;
  skipTests: boolean;
  notes?: string;
  prerelease: boolean;
}

interface ConventionalCommit {
  type: string;
  scope?: string;
  message: string;
  sha: string;
}

function getCurrentVersion(): string | null {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    return pkg.version || null;
  } catch {
    return null;
  }
}

function bumpVersion(currentVersion: string, bumpType: string): string | null {
  if (semver.valid(bumpType)) {
    return bumpType;
  }
  
  if (['patch', 'minor', 'major'].includes(bumpType)) {
    return semver.inc(currentVersion, bumpType as semver.ReleaseType);
  }
  
  return null;
}

function isWorkingDirectoryClean(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim().length === 0;
  } catch {
    return false;
  }
}

function getCommitsSinceLastTag(): ConventionalCommit[] {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    
    const log = execSync(`git log ${range} --pretty=format:"%H|%s"`, { encoding: 'utf-8' });
    
    return log.trim().split('\n').filter(line => line.length > 0).map(line => {
      const [sha, ...messageParts] = line.split('|');
      const message = messageParts.join('|');
      
      // Parse conventional commit
      const match = message.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
      
      if (match) {
        return {
          type: match[1],
          scope: match[2],
          message: match[3],
          sha: sha.slice(0, 7)
        };
      }
      
      return {
        type: 'other',
        message,
        sha: sha.slice(0, 7)
      };
    });
  } catch {
    return [];
  }
}

function generateChangelog(commits: ConventionalCommit[], version: string): string {
  const sections: Record<string, string[]> = {
    feat: [],
    fix: [],
    chore: [],
    other: []
  };
  
  for (const commit of commits) {
    const line = commit.scope 
      ? `- ${commit.message} (${commit.scope}) @${commit.sha}`
      : `- ${commit.message} @${commit.sha}`;
    
    if (sections[commit.type]) {
      sections[commit.type].push(line);
    } else {
      sections.other.push(line);
    }
  }
  
  let changelog = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;
  
  if (sections.feat.length > 0) {
    changelog += '### Features\n' + sections.feat.join('\n') + '\n\n';
  }
  
  if (sections.fix.length > 0) {
    changelog += '### Bug Fixes\n' + sections.fix.join('\n') + '\n\n';
  }
  
  if (sections.chore.length > 0) {
    changelog += '### Chores\n' + sections.chore.join('\n') + '\n\n';
  }
  
  if (sections.other.length > 0) {
    changelog += '### Other Changes\n' + sections.other.join('\n') + '\n\n';
  }
  
  return changelog;
}

function getRepoSlug(): string | null {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    return match ? `${match[1]}/${match[2]}` : null;
  } catch {
    return null;
  }
}

async function createGitHubRelease(repo: string, version: string, notes: string, prerelease: boolean): Promise<boolean> {
  const ghToken = process.env.GH_TOKEN;
  
  if (!ghToken) {
    printWarning('GH_TOKEN not set. Skipping GitHub release.');
    return false;
  }
  
  try {
    const escapedNotes = notes.replace(/"/g, '\\"');
    const prereleaseFlag = prerelease ? '--prerelease' : '';
    
    execSync(
      `curl -s -X POST \
        -H "Authorization: token ${ghToken}" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/${repo}/releases \
        -d "{\\"tag_name\\":\\"v${version}\\",\\"name\\":\\"Release v${version}\\",\\"body\\":\\"${escapedNotes}\\",\\"prerelease\\":${prerelease}}"`,
      { stdio: 'pipe' }
    );
    
    return true;
  } catch {
    return false;
  }
}

export async function shipCommand(options: ShipOptions): Promise<void> {
  printHeader('Release Pipeline');
  
  const config = loadConfig();
  
  // Check working directory
  if (!options.dryRun && config.ship?.requireCleanWorkingDir !== false) {
    if (!isWorkingDirectoryClean()) {
      printError('Working directory is not clean. Commit or stash changes first.');
      process.exit(1);
    }
  }
  
  // Get current version
  const currentVersion = getCurrentVersion();
  
  if (!currentVersion) {
    printError('Could not determine current version from package.json');
    process.exit(1);
  }
  
  // Calculate new version
  const newVersion = bumpVersion(currentVersion, options.version);
  
  if (!newVersion) {
    printError(`Invalid version bump: ${options.version}`);
    printInfo('Use: patch, minor, major, or explicit version (e.g., 1.2.3)');
    process.exit(1);
  }
  
  printInfo(`Current version: ${currentVersion}`);
  printInfo(`New version: ${newVersion}`);
  console.log();
  
  if (options.dryRun) {
    printWarning('DRY RUN - No changes will be made');
    console.log();
  }
  
  const spinner = ora('Starting release process...').start();
  
  try {
    // Run tests
    if (!options.skipTests) {
      spinner.text = 'Running tests...';
      
      if (!options.dryRun) {
        try {
          execSync('npm test', { stdio: 'pipe' });
        } catch {
          spinner.stop();
          printError('Tests failed. Release aborted.');
          printInfo('Use --skip-tests to bypass (not recommended)');
          process.exit(1);
        }
      }
    }
    
    // Update version in package.json
    spinner.text = 'Updating version...';
    
    if (!options.dryRun) {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      pkg.version = newVersion;
      writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    }
    
    // Update version in additional files
    if (config.ship?.versionFiles) {
      for (const file of config.ship.versionFiles) {
        if (existsSync(file)) {
          spinner.text = `Updating version in ${file}...`;
          
          if (!options.dryRun) {
            let content = readFileSync(file, 'utf-8');
            content = content.replace(/version\s*=\s*["'][^"']+["']/g, `version = "${newVersion}"`);
            content = content.replace(/VERSION\s*=\s*["'][^"']+["']/g, `VERSION = "${newVersion}"`);
            writeFileSync(file, content);
          }
        }
      }
    }
    
    // Generate changelog
    spinner.text = 'Generating changelog...';
    
    const commits = getCommitsSinceLastTag();
    const changelogEntry = generateChangelog(commits, newVersion);
    
    if (!options.dryRun && config.ship?.changelogPath !== 'false') {
      const changelogPath = config.ship?.changelogPath || 'CHANGELOG.md';
      
      if (existsSync(changelogPath)) {
        const existing = readFileSync(changelogPath, 'utf-8');
        writeFileSync(changelogPath, `# Changelog\n\n${changelogEntry}${existing.replace('# Changelog\n\n', '')}`);
      } else {
        writeFileSync(changelogPath, `# Changelog\n\n${changelogEntry}`);
      }
    }
    
    // Create release commit
    spinner.text = 'Creating release commit...';
    
    if (!options.dryRun) {
      execSync('git add -A', { stdio: 'pipe' });
      execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'pipe' });
    }
    
    // Create git tag
    spinner.text = 'Creating git tag...';
    
    if (!options.dryRun) {
      execSync(`git tag -a "v${newVersion}" -m "Release v${newVersion}"`, { stdio: 'pipe' });
    }
    
    // Push to remote
    spinner.text = 'Pushing to remote...';
    
    if (!options.dryRun) {
      execSync('git push origin HEAD', { stdio: 'pipe' });
      execSync(`git push origin "v${newVersion}"`, { stdio: 'pipe' });
    }
    
    // Create GitHub release
    const repo = options.repo || getRepoSlug();
    
    if (repo) {
      spinner.text = 'Creating GitHub release...';
      
      if (!options.dryRun) {
        const releaseNotes = options.notes || changelogEntry;
        await createGitHubRelease(repo, newVersion, releaseNotes, options.prerelease);
      }
    }
    
    spinner.stop();
    
    console.log();
    printSuccess(`Released v${newVersion}`);
    
    if (options.dryRun) {
      console.log();
      printInfo('This was a dry run. No actual changes were made.');
      printInfo('Remove --dry-run to execute the release.');
    }
    
  } catch (error) {
    spinner.stop();
    printError(`Release failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}