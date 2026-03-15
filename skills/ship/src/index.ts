/**
 * Ship skill - One-command release pipeline
 */
import { Logger, exec, readJsonFile, writeJsonFile } from '@nko/superpowers-shared';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger({ prefix: 'ship' });

export type VersionBump = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  version?: VersionBump | string;
  dryRun?: boolean;
  changelog?: boolean;
  tag?: boolean;
  release?: boolean;
  repo?: string;
}

interface ConventionalCommit {
  type: string;
  scope?: string;
  description: string;
  breaking: boolean;
  hash: string;
}

function parseArgs(): ShipOptions {
  const args = process.argv.slice(2);
  const options: ShipOptions = { 
    version: 'patch',
    changelog: true,
    tag: true,
    release: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--version':
      case '-v':
        options.version = args[++i];
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--no-changelog':
        options.changelog = false;
        break;
      case '--no-tag':
        options.tag = false;
        break;
      case '--no-release':
        options.release = false;
        break;
      case '--repo':
        options.repo = args[++i];
        break;
    }
  }

  return options;
}

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.replace(/^v/, '').split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

function bumpVersion(current: string, bump: VersionBump): string {
  const { major, minor, patch } = parseVersion(current);

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

function validateExplicitVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version);
}

async function getCurrentVersion(projectRoot: string): Promise<string | null> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = readJsonFile<{ version?: string }>(packageJsonPath);
  return packageJson?.version || null;
}

async function getGitCommits(sinceTag?: string): Promise<string[]> {
  const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD';
  const { stdout } = await exec(`git log ${range} --format='%H|%s|%b---END---'`);
  
  return stdout
    .split('---END---')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function parseConventionalCommit(commitMessage: string): ConventionalCommit | null {
  const lines = commitMessage.split('\n');
  const firstLine = lines[0];

  const match = firstLine.match(/^(\w+)(?:\(([^)]+)\))?!?: (.+)$/);
  
  if (!match) return null;

  const [, type, scope, description] = match;
  const breaking = firstLine.includes('!:') || lines.some(l => l.trim().startsWith('BREAKING CHANGE:'));

  return {
    type: type.toLowerCase(),
    scope,
    description,
    breaking,
    hash: '',
  };
}

async function generateChangelog(
  projectRoot: string,
  newVersion: string
): Promise<string> {
  const { stdout: tagStdout } = await exec('git describe --tags --abbrev=0 2>/dev/null || echo ""');
  const lastTag = tagStdout.trim();

  const commits = await getGitCommits(lastTag || undefined);
  const parsedCommits: ConventionalCommit[] = [];

  for (const commit of commits) {
    const parts = commit.split('|');
    if (parts.length >= 2) {
      const hash = parts[0];
      const message = parts.slice(1).join('|');
      const parsed = parseConventionalCommit(message);
      if (parsed) {
        parsed.hash = hash;
        parsedCommits.push(parsed);
      }
    }
  }

  const changes = {
    breaking: [] as string[],
    features: [] as string[],
    fixes: [] as string[],
    other: [] as string[],
  };

  for (const commit of parsedCommits) {
    const line = commit.scope 
      ? `- **${commit.scope}:** ${commit.description}` 
      : `- ${commit.description}`;

    if (commit.breaking) {
      changes.breaking.push(`${line} [${commit.hash.slice(0, 7)}]`);
    } else if (commit.type === 'feat' || commit.type === 'feature') {
      changes.features.push(`${line} [${commit.hash.slice(0, 7)}]`);
    } else if (commit.type === 'fix') {
      changes.fixes.push(`${line} [${commit.hash.slice(0, 7)}]`);
    } else {
      changes.other.push(`${line} [${commit.hash.slice(0, 7)}]`);
    }
  }

  let markdown = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n`;

  if (changes.breaking.length > 0) {
    markdown += '### ⚠ Breaking Changes\n\n';
    markdown += changes.breaking.join('\n') + '\n\n';
  }

  if (changes.features.length > 0) {
    markdown += '### ✨ Features\n\n';
    markdown += changes.features.join('\n') + '\n\n';
  }

  if (changes.fixes.length > 0) {
    markdown += '### 🐛 Bug Fixes\n\n';
    markdown += changes.fixes.join('\n') + '\n\n';
  }

  if (changes.other.length > 0) {
    markdown += '### 📝 Other Changes\n\n';
    markdown += changes.other.join('\n') + '\n\n';
  }

  return markdown;
}

async function updateChangelog(projectRoot: string, newEntry: string): Promise<void> {
  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
  
  let existingContent = '';
  if (fs.existsSync(changelogPath)) {
    existingContent = fs.readFileSync(changelogPath, 'utf-8');
    existingContent = existingContent.replace(/^# Changelog\n\n/i, '');
  }

  const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  const newContent = header + newEntry + existingContent;

  fs.writeFileSync(changelogPath, newContent);
}

async function updateVersionFiles(projectRoot: string, newVersion: string, dryRun: boolean): Promise<void> {
  const spinner = logger.spinner('Updating version files...');

  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = readJsonFile<{ version: string }>(packageJsonPath);
    if (packageJson) {
      packageJson.version = newVersion;
      if (!dryRun) {
        writeJsonFile(packageJsonPath, packageJson);
      }
      spinner.succeed(`Updated package.json to v${newVersion}`);
    }
  }

  const lockPath = path.join(projectRoot, 'package-lock.json');
  if (fs.existsSync(lockPath) && !dryRun) {
    const lockFile = readJsonFile<{ version?: string; packages?: Record<string, { version?: string }> }>(lockPath);
    if (lockFile) {
      lockFile.version = newVersion;
      if (lockFile.packages && lockFile.packages['']) {
        lockFile.packages[''].version = newVersion;
      }
      writeJsonFile(lockPath, lockFile);
    }
  }
}

async function createGitTag(version: string, message: string, dryRun: boolean): Promise<void> {
  const tagName = `v${version}`;
  
  if (dryRun) {
    logger.info(`[DRY RUN] Would create tag: ${tagName}`);
    return;
  }

  const spinner = logger.spinner(`Creating git tag: ${tagName}`);
  const { exitCode, stderr } = await exec(`git tag -a ${tagName} -m "${message}"`);

  if (exitCode !== 0) {
    spinner.fail(`Failed to create tag: ${stderr}`);
    throw new Error(`Failed to create tag: ${stderr}`);
  }

  spinner.succeed(`Created tag: ${tagName}`);
}

async function pushToRemote(version: string, dryRun: boolean): Promise<void> {
  const tagName = `v${version}`;
  
  if (dryRun) {
    logger.info(`[DRY RUN] Would push commits and tag: ${tagName}`);
    return;
  }

  const spinner = logger.spinner('Pushing to remote...');
  
  const { exitCode: pushExit, stderr: pushErr } = await exec('git push');
  if (pushExit !== 0) {
    spinner.fail(`Failed to push: ${pushErr}`);
    throw new Error(`Failed to push: ${pushErr}`);
  }

  const { exitCode: tagExit, stderr: tagErr } = await exec(`git push origin ${tagName}`);
  if (tagExit !== 0) {
    spinner.fail(`Failed to push tag: ${tagErr}`);
    throw new Error(`Failed to push tag: ${tagErr}`);
  }

  spinner.succeed('Pushed to remote');
}

async function createGitHubRelease(
  repo: string,
  version: string,
  changelog: string,
  dryRun: boolean
): Promise<void> {
  const tagName = `v${version}`;
  
  if (dryRun) {
    logger.info(`[DRY RUN] Would create GitHub release: ${tagName}`);
    return;
  }

  const ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!ghToken) {
    logger.warn('GH_TOKEN or GITHUB_TOKEN not set. Skipping GitHub release.');
    return;
  }

  const spinner = logger.spinner('Creating GitHub release...');

  const notes = changelog.split('## [').slice(0, 2).join('## [').replace(/^# Changelog\n\n/, '');

  const releaseData = {
    tag_name: tagName,
    name: tagName,
    body: notes,
    draft: false,
    prerelease: false,
  };

  const { exitCode, stdout, stderr } = await exec(
    `curl -s -X POST ` +
    `-H "Authorization: token ${ghToken}" ` +
    `-H "Accept: application/vnd.github.v3+json" ` +
    `-d '${JSON.stringify(releaseData)}' ` +
    `https://api.github.com/repos/${repo}/releases`,
    { cwd: process.cwd() }
  );

  if (exitCode !== 0) {
    spinner.fail(`Failed to create release: ${stderr}`);
    throw new Error(`Failed to create release: ${stderr}`);
  }

  try {
    const response = JSON.parse(stdout);
    if (response.html_url) {
      spinner.succeed(`Created release: ${response.html_url}`);
    } else {
      spinner.fail(`Failed to create release: ${response.message || 'Unknown error'}`);
    }
  } catch {
    spinner.succeed('Created release');
  }
}

async function checkWorkingDirectoryClean(): Promise<boolean> {
  const { stdout } = await exec('git status --porcelain');
  return stdout.trim().length === 0;
}

export async function main(): Promise<void> {
  const options = parseArgs();
  const projectRoot = process.cwd();

  const dryRun = options.dryRun || false;
  const doChangelog = options.changelog !== false;
  const doTag = options.tag !== false;
  const doRelease = options.release !== false;

  logger.info(`Starting release pipeline${dryRun ? ' (DRY RUN)' : ''}`);

  const isClean = await checkWorkingDirectoryClean();
  if (!isClean && !dryRun) {
    console.error('Error: Working directory is not clean. Please commit or stash changes first.');
    process.exit(1);
  }

  const currentVersion = await getCurrentVersion(projectRoot);
  if (!currentVersion) {
    console.error('Error: Could not find current version in package.json');
    process.exit(1);
  }

  logger.info(`Current version: v${currentVersion}`);

  const bump = options.version || 'patch';
  let newVersion: string;

  if (['patch', 'minor', 'major'].includes(bump)) {
    newVersion = bumpVersion(currentVersion, bump as VersionBump);
  } else if (validateExplicitVersion(bump)) {
    newVersion = bump;
  } else {
    console.error(`Error: Invalid version "${bump}". Use patch, minor, major, or explicit version (x.y.z)`);
    process.exit(1);
  }

  logger.info(`New version: v${newVersion}`);

  if (dryRun) {
    logger.info('[DRY RUN] Preview of changes:');
    logger.info(`  - Update package.json: ${currentVersion} -> ${newVersion}`);
    if (doChangelog) logger.info('  - Generate/Update CHANGELOG.md');
    if (doTag) logger.info(`  - Create git tag: v${newVersion}`);
    if (doRelease && options.repo) logger.info(`  - Create GitHub release for ${options.repo}`);
    console.log('Dry run complete');
    process.exit(0);
  }

  try {
    let changelog = '';
    if (doChangelog) {
      const changelogSpinner = logger.spinner('Generating changelog...');
      changelog = await generateChangelog(projectRoot, newVersion);
      await updateChangelog(projectRoot, changelog);
      changelogSpinner.succeed('Updated CHANGELOG.md');
    }

    await updateVersionFiles(projectRoot, newVersion, dryRun);

    if (!dryRun) {
      const commitSpinner = logger.spinner('Committing version changes...');
      await exec('git add -A');
      await exec(`git commit -m "chore(release): v${newVersion}"`);
      commitSpinner.succeed('Committed version changes');
    }

    if (doTag) {
      await createGitTag(newVersion, `Release v${newVersion}`, dryRun);
    }

    if (doTag) {
      await pushToRemote(newVersion, dryRun);
    }

    if (doRelease && options.repo) {
      await createGitHubRelease(options.repo, newVersion, changelog, dryRun);
    }

    console.log(`\n✓ Successfully shipped v${newVersion}`);
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Ship failed: ${message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}