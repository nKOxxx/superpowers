import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as semver from 'semver';
import { 
  ShipOptions, 
  ShipResult, 
  ConventionalCommit, 
  ChangelogEntry,
  VersionBump 
} from './types.js';

export * from './types.js';

function getCurrentVersion(cwd: string = process.cwd()): string {
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '0.0.0';
  }
  return '0.0.0';
}

function calculateNewVersion(current: string, bump: VersionBump | string): string {
  // If explicit version provided
  if (semver.valid(bump)) {
    return bump;
  }
  
  const newVersion = semver.inc(current, bump as VersionBump);
  if (!newVersion) {
    throw new Error(`Invalid version bump: ${bump}`);
  }
  return newVersion;
}

export function parseConventionalCommits(sinceTag?: string, cwd: string = process.cwd()): ConventionalCommit[] {
  try {
    const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD';
    const log = execSync(
      `git log ${range} --pretty=format:"%H|%s|%b" --no-merges`,
      { cwd, encoding: 'utf-8' }
    );
    
    const commits: ConventionalCommit[] = [];
    const entries = log.split('\n').filter(line => line.trim());
    
    for (const entry of entries) {
      const [hash, subject] = entry.split('|');
      if (!subject) continue;
      
      // Parse conventional commit format: type(scope): description
      const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
      if (match) {
        const [, type, scope, description] = match;
        commits.push({
          type: type.toLowerCase(),
          scope,
          description,
          breaking: subject.includes('!:') || entry.includes('BREAKING CHANGE'),
          hash: hash.substring(0, 7)
        });
      }
    }
    
    return commits;
  } catch (error) {
    return [];
  }
}

export function determineBump(commits: ConventionalCommit[]): VersionBump | null {
  let hasBreaking = false;
  let hasFeature = false;
  let hasFix = false;
  
  for (const commit of commits) {
    if (commit.breaking) {
      hasBreaking = true;
    } else if (commit.type === 'feat') {
      hasFeature = true;
    } else if (commit.type === 'fix') {
      hasFix = true;
    }
  }
  
  if (hasBreaking) return 'major';
  if (hasFeature) return 'minor';
  if (hasFix) return 'patch';
  return null;
}

export function generateChangelog(
  version: string, 
  commits: ConventionalCommit[],
  previousChangelog?: string
): string {
  const date = new Date().toISOString().split('T')[0];
  
  const changes = {
    features: commits.filter(c => c.type === 'feat').map(c => c.description),
    fixes: commits.filter(c => c.type === 'fix').map(c => c.description),
    breaking: commits.filter(c => c.breaking).map(c => c.description),
    other: commits.filter(c => !['feat', 'fix'].includes(c.type) && !c.breaking).map(c => c.description)
  };
  
  let changelog = `## [${version}] - ${date}\n\n`;
  
  if (changes.breaking.length > 0) {
    changelog += '### ⚠ BREAKING CHANGES\n\n';
    changes.breaking.forEach(c => changelog += `- ${c}\n`);
    changelog += '\n';
  }
  
  if (changes.features.length > 0) {
    changelog += '### Features\n\n';
    changes.features.forEach(c => changelog += `- ${c}\n`);
    changelog += '\n';
  }
  
  if (changes.fixes.length > 0) {
    changelog += '### Bug Fixes\n\n';
    changes.fixes.forEach(c => changelog += `- ${c}\n`);
    changelog += '\n';
  }
  
  if (changes.other.length > 0) {
    changelog += '### Other Changes\n\n';
    changes.other.forEach(c => changelog += `- ${c}\n`);
    changelog += '\n';
  }
  
  if (previousChangelog) {
    changelog += previousChangelog;
  }
  
  return changelog;
}

export async function ship(options: ShipOptions, cwd: string = process.cwd()): Promise<ShipResult> {
  const startTime = Date.now();
  const result: ShipResult = {
    success: false,
    version: '',
    previousVersion: getCurrentVersion(cwd),
    tagName: '',
    steps: {
      versionBumped: false,
      changelogGenerated: false,
      tagCreated: false,
      pushed: false,
      releaseCreated: false
    }
  };
  
  try {
    // Check git status
    try {
      execSync('git rev-parse --git-dir', { cwd, stdio: 'ignore' });
    } catch {
      throw new Error('Not a git repository');
    }
    
    // Get commits since last tag
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { 
      cwd, 
      encoding: 'utf-8' 
    }).trim();
    
    const commits = parseConventionalCommits(lastTag || undefined, cwd);
    
    // Auto-determine bump if not provided
    let bump = options.bump;
    if (bump === 'auto') {
      const determined = determineBump(commits);
      if (!determined) {
        throw new Error('No conventional commits found to determine version bump');
      }
      bump = determined;
    }
    
    // Calculate new version
    const newVersion = calculateNewVersion(result.previousVersion, bump);
    result.version = newVersion;
    result.tagName = `v${newVersion}`;
    
    if (options.dryRun) {
      return {
        ...result,
        success: true,
        changelog: generateChangelog(newVersion, commits),
        error: 'Dry run - no changes made'
      };
    }
    
    // Update package.json version
    const packageJsonPath = join(cwd, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      packageJson.version = newVersion;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    }
    result.steps.versionBumped = true;
    
    // Generate changelog
    if (!options.skipChangelog) {
      const changelogPath = join(cwd, 'CHANGELOG.md');
      let previousChangelog = '';
      if (existsSync(changelogPath)) {
        previousChangelog = readFileSync(changelogPath, 'utf-8').replace(/^# Changelog\n\n/, '');
      }
      
      const newChangelog = generateChangelog(newVersion, commits, previousChangelog);
      const header = '# Changelog\n\n';
      writeFileSync(changelogPath, header + newChangelog);
      result.changelog = newChangelog;
      result.steps.changelogGenerated = true;
    }
    
    // Git operations
    execSync('git add package.json', { cwd });
    if (!options.skipChangelog) {
      execSync('git add CHANGELOG.md', { cwd });
    }
    execSync(`git commit -m "chore(release): ${newVersion}"`, { cwd });
    
    if (!options.skipTag) {
      execSync(`git tag -a ${result.tagName} -m "Release ${newVersion}"`, { cwd });
      result.steps.tagCreated = true;
    }
    
    // Push
    const branch = options.branch || execSync('git rev-parse --abbrev-ref HEAD', { 
      cwd, 
      encoding: 'utf-8' 
    }).trim();
    
    if (!options.dryRun) {
      execSync(`git push origin ${branch}`, { cwd });
      if (!options.skipTag) {
        execSync(`git push origin ${result.tagName}`, { cwd });
      }
      result.steps.pushed = true;
    }
    
    // GitHub release
    if (!options.skipGitHub && process.env.GH_TOKEN && options.repo) {
      const releaseNotes = result.changelog || generateChangelog(newVersion, commits);
      const title = `Release ${newVersion}`;
      
      execSync(
        `GH_TOKEN=${process.env.GH_TOKEN} gh release create ${result.tagName} ` +
        `--title "${title}" --notes "${releaseNotes.replace(/"/g, '\\"')}"`,
        { cwd }
      );
      result.steps.releaseCreated = true;
    }
    
    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}
