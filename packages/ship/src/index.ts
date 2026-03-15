import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

export interface ShipOptions {
  bump?: 'patch' | 'minor' | 'major';
  dryRun?: boolean;
  skipChangelog?: boolean;
  skipGit?: boolean;
  skipGithub?: boolean;
  message?: string;
  prerelease?: string;
}

export interface VersionInfo {
  current: string;
  next: string;
}

export interface ShipResult {
  success: boolean;
  version: VersionInfo;
  steps: StepResult[];
  error?: string;
}

export interface StepResult {
  name: string;
  success: boolean;
  output?: string;
  error?: string;
}

function parseVersion(version: string): { major: number; minor: number; patch: number; prerelease?: string } {
  const clean = version.replace(/^v/, '');
  const [main, prerelease] = clean.split('-');
  const [major, minor, patch] = main.split('.').map(Number);
  return { major, minor, patch, prerelease };
}

function bumpVersion(current: string, bumpType: string, prerelease?: string): string {
  const version = parseVersion(current);
  
  switch (bumpType) {
    case 'major':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor++;
      version.patch = 0;
      break;
    case 'patch':
    default:
      version.patch++;
      break;
  }
  
  let newVersion = `${version.major}.${version.minor}.${version.patch}`;
  if (prerelease) {
    newVersion += `-${prerelease}`;
  }
  return newVersion;
}

function getCurrentVersion(projectPath: string = '.'): string | null {
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  }
  
  try {
    const tags = execSync('git describe --tags --abbrev=0', {
      cwd: projectPath,
      encoding: 'utf-8'
    }).trim();
    return tags;
  } catch {
    return null;
  }
}

function updatePackageJsonVersion(version: string, projectPath: string = '.'): void {
  const packageJsonPath = join(projectPath, 'package.json');
  if (!existsSync(packageJsonPath)) return;
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = version;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function getCommitsSinceLastTag(projectPath: string = '.'): string[] {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', {
      cwd: projectPath,
      encoding: 'utf-8'
    }).trim();
    
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    const output = execSync(`git log ${range} --pretty=format:"%s|%b" --no-merges`, {
      cwd: projectPath,
      encoding: 'utf-8'
    });
    
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function categorizeCommits(commits: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    features: [],
    fixes: [],
    docs: [],
    refactor: [],
    chore: [],
    other: []
  };
  
  for (const commit of commits) {
    const msg = commit.split('|')[0].toLowerCase();
    
    if (msg.startsWith('feat') || msg.startsWith('feature')) {
      categories.features.push(commit);
    } else if (msg.startsWith('fix') || msg.startsWith('bugfix')) {
      categories.fixes.push(commit);
    } else if (msg.startsWith('docs')) {
      categories.docs.push(commit);
    } else if (msg.startsWith('refactor')) {
      categories.refactor.push(commit);
    } else if (msg.startsWith('chore')) {
      categories.chore.push(commit);
    } else {
      categories.other.push(commit);
    }
  }
  
  return categories;
}

function generateChangelogEntry(version: string, commits: string[]): string {
  const categories = categorizeCommits(commits);
  const date = new Date().toISOString().split('T')[0];
  
  let entry = `## [${version}] - ${date}\n\n`;
  
  if (categories.features.length > 0) {
    entry += '### Features\n';
    for (const commit of categories.features) {
      const msg = commit.split('|')[0].replace(/^feat(?:\([^)]+\))?:\s*/i, '');
      entry += `- ${msg}\n`;
    }
    entry += '\n';
  }
  
  if (categories.fixes.length > 0) {
    entry += '### Bug Fixes\n';
    for (const commit of categories.fixes) {
      const msg = commit.split('|')[0].replace(/^fix(?:\([^)]+\))?:\s*/i, '');
      entry += `- ${msg}\n`;
    }
    entry += '\n';
  }
  
  if (categories.docs.length > 0) {
    entry += '### Documentation\n';
    for (const commit of categories.docs) {
      const msg = commit.split('|')[0].replace(/^docs(?:\([^)]+\))?:\s*/i, '');
      entry += `- ${msg}\n`;
    }
    entry += '\n';
  }
  
  if (categories.refactor.length > 0) {
    entry += '### Refactoring\n';
    for (const commit of categories.refactor) {
      const msg = commit.split('|')[0].replace(/^refactor(?:\([^)]+\))?:\s*/i, '');
      entry += `- ${msg}\n`;
    }
    entry += '\n';
  }
  
  if (categories.other.length > 0) {
    entry += '### Other Changes\n';
    for (const commit of categories.other) {
      entry += `- ${commit.split('|')[0]}\n`;
    }
    entry += '\n';
  }
  
  return entry;
}

function updateChangelog(entry: string, projectPath: string = '.'): void {
  const changelogPath = join(projectPath, 'CHANGELOG.md');
  const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  
  if (existsSync(changelogPath)) {
    const existing = readFileSync(changelogPath, 'utf-8');
    const newContent = existing.replace('# Changelog\n\n', header) + entry;
    writeFileSync(changelogPath, newContent);
  } else {
    writeFileSync(changelogPath, header + entry);
  }
}

function runCommand(command: string, projectPath: string, dryRun: boolean): StepResult {
  if (dryRun) {
    return { name: command, success: true, output: `[DRY-RUN] Would run: ${command}` };
  }
  
  try {
    const output = execSync(command, {
      cwd: projectPath,
      encoding: 'utf-8'
    });
    return { name: command, success: true, output };
  } catch (error: any) {
    return { name: command, success: false, error: error.message };
  }
}

function checkGitStatus(projectPath: string): { clean: boolean; branch: string } {
  try {
    const status = execSync('git status --porcelain', {
      cwd: projectPath,
      encoding: 'utf-8'
    }).trim();
    
    const branch = execSync('git branch --show-current', {
      cwd: projectPath,
      encoding: 'utf-8'
    }).trim();
    
    return { clean: status === '', branch };
  } catch {
    return { clean: false, branch: 'unknown' };
  }
}

export async function shipCommand(options: ShipOptions = {}): Promise<ShipResult> {
  const {
    bump = 'patch',
    dryRun = false,
    skipChangelog = false,
    skipGit = false,
    skipGithub = false,
    message,
    prerelease
  } = options;
  
  const projectPath = resolve('.');
  const steps: StepResult[] = [];
  
  // Check git status
  const gitStatus = checkGitStatus(projectPath);
  if (!gitStatus.clean && !dryRun) {
    return {
      success: false,
      version: { current: '', next: '' },
      steps,
      error: 'Working directory is not clean. Please commit or stash changes first.'
    };
  }
  
  steps.push({ name: 'Check git status', success: true, output: `Branch: ${gitStatus.branch}, Clean: ${gitStatus.clean}` });
  
  // Get current version
  const currentVersion = getCurrentVersion(projectPath);
  if (!currentVersion) {
    return {
      success: false,
      version: { current: '', next: '' },
      steps,
      error: 'Could not determine current version. Ensure package.json exists or git tags are present.'
    };
  }
  
  // Calculate new version
  const nextVersion = bumpVersion(currentVersion, bump, prerelease);
  const versionInfo: VersionInfo = { current: currentVersion, next: nextVersion };
  
  steps.push({ name: 'Calculate version', success: true, output: `${currentVersion} -> ${nextVersion}` });
  
  // Update package.json
  if (!dryRun) {
    updatePackageJsonVersion(nextVersion, projectPath);
  }
  steps.push({ name: 'Update package.json', success: true, output: dryRun ? `[DRY-RUN] Would update to ${nextVersion}` : `Updated to ${nextVersion}` });
  
  // Generate changelog
  if (!skipChangelog) {
    const commits = getCommitsSinceLastTag(projectPath);
    const changelogEntry = generateChangelogEntry(nextVersion, commits);
    
    if (!dryRun) {
      updateChangelog(changelogEntry, projectPath);
    }
    steps.push({ name: 'Generate changelog', success: true, output: dryRun ? `[DRY-RUN] Would generate changelog with ${commits.length} commits` : `Generated changelog with ${commits.length} commits` });
  }
  
  // Git operations
  if (!skipGit) {
    // Stage changes
    const addResult = runCommand('git add package.json CHANGELOG.md', projectPath, dryRun);
    steps.push(addResult);
    
    if (!addResult.success) {
      return { success: false, version: versionInfo, steps, error: 'Failed to stage changes' };
    }
    
    // Commit
    const commitMessage = message || `chore(release): ${nextVersion}`;
    const commitResult = runCommand(`git commit -m "${commitMessage}"`, projectPath, dryRun);
    steps.push(commitResult);
    
    if (!commitResult.success) {
      return { success: false, version: versionInfo, steps, error: 'Failed to commit changes' };
    }
    
    // Tag
    const tagResult = runCommand(`git tag -a v${nextVersion} -m "Release ${nextVersion}"`, projectPath, dryRun);
    steps.push(tagResult);
    
    if (!tagResult.success) {
      return { success: false, version: versionInfo, steps, error: 'Failed to create tag' };
    }
    
    // Push
    const pushResult = runCommand('git push && git push --tags', projectPath, dryRun);
    steps.push(pushResult);
    
    if (!pushResult.success) {
      return { success: false, version: versionInfo, steps, error: 'Failed to push to remote' };
    }
  }
  
  // GitHub release
  if (!skipGithub && !skipGit) {
    const releaseBody = message || `Release ${nextVersion}`;
    const prereleaseFlag = prerelease ? '--prerelease' : '';
    const ghCommand = `gh release create v${nextVersion} --title "v${nextVersion}" --notes "${releaseBody}" ${prereleaseFlag}`;
    
    const ghResult = runCommand(ghCommand, projectPath, dryRun);
    steps.push(ghResult);
  }
  
  return { success: true, version: versionInfo, steps };
}
