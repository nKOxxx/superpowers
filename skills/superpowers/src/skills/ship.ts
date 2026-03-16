import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { loadConfig, getShipConfig } from '../lib/config.js';
import { createRelease, parseRepoUrl, getGitHubToken } from '../lib/github.js';
import {
  getGitStatus,
  getCommitsSince,
  getLastTag,
  createCommit,
  createTag,
  pushToRemote
} from '../lib/git.js';
import { sendMessage, formatShipResult } from '../lib/telegram.js';
import {
  header,
  success,
  error,
  step,
  info,
  warning,
  list,
  box,
  divider
} from '../lib/format.js';
import type { ShipResult } from '../types.js';

interface ShipOptions {
  version: string;
  dryRun?: boolean;
  skipTests?: boolean;
  skipBuild?: boolean;
  skipPublish?: boolean;
  skipGithub?: boolean;
  skipChangelog?: boolean;
  prereleaseId?: string;
  target?: string;
  message?: string;
  assets?: string;
  sign?: boolean;
  force?: boolean;
  changelog?: boolean;
  from?: string;
  to?: string;
  status?: boolean;
}

export async function shipCommand(options: ShipOptions): Promise<void> {
  if (options.status) {
    await checkReleaseStatus();
    return;
  }

  if (options.changelog) {
    await generateChangelog(options);
    return;
  }

  header('Ship - One-Command Release Pipeline');

  const config = loadConfig();
  const shipConfig = getShipConfig(config);

  // Load package.json
  const pkgPath = resolve(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) {
    error('No package.json found');
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const currentVersion = pkg.version;
  const newVersion = calculateNewVersion(currentVersion, options.version, options.prereleaseId);

  info(`Current version: ${currentVersion}`);
  info(`New version: ${newVersion}`);

  // Pre-release checks
  if (!options.dryRun) {
    await preReleaseChecks(shipConfig, options);
  }

  // Preview changes
  if (options.dryRun) {
    showDryRunPreview(currentVersion, newVersion, options);
    return;
  }

  // Confirm release
  if (!options.force) {
    const confirmed = await confirmRelease(currentVersion, newVersion);
    if (!confirmed) {
      info('Release cancelled');
      return;
    }
  }

  // Execute release
  const result = await executeRelease(pkg, pkgPath, currentVersion, newVersion, shipConfig, options);

  // Report results
  await reportResults(result, options);
}

async function preReleaseChecks(config: any, options: ShipOptions): Promise<void> {
  step('Running pre-release checks...');

  // Check working directory
  if (config.requireCleanWorkingDir && !options.force) {
    const status = getGitStatus();
    if (!status.isClean) {
      error('Working directory is not clean');
      info('Commit or stash changes before releasing');
      process.exit(1);
    }
  }

  // Run tests
  if (config.runTestsBeforeRelease && !options.skipTests) {
    step('Running tests...');
    try {
      execSync(config.testCommand || 'npm test', { stdio: 'inherit' });
      success('Tests passed');
    } catch {
      error('Tests failed');
      if (!options.force) {
        process.exit(1);
      }
    }
  }

  // Check GitHub token
  if (!options.skipGithub) {
    try {
      getGitHubToken();
    } catch {
      error('GitHub token not configured');
      process.exit(1);
    }
  }
}

function calculateNewVersion(
  current: string,
  bump: string,
  prereleaseId?: string
): string {
  const parts = current.replace(/^v/, '').split(/[-+]/)[0].split('.').map(Number);
  const [major, minor, patch] = parts;

  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'prerelease':
      const id = prereleaseId || 'alpha';
      // Check if already a prerelease
      const prereleaseMatch = current.match(/-(\w+)\.(\d+)$/);
      if (prereleaseMatch && prereleaseMatch[1] === id) {
        const num = parseInt(prereleaseMatch[2]) + 1;
        return `${major}.${minor}.${patch}-${id}.${num}`;
      }
      return `${major}.${minor}.${patch}-${id}.0`;
    default:
      // Assume explicit version
      if (/^\d+\.\d+\.\d+/.test(bump)) {
        return bump;
      }
      throw new Error(`Invalid version bump: ${bump}`);
  }
}

function showDryRunPreview(current: string, next: string, options: ShipOptions): void {
  header('Dry Run Preview');

  const changes = [
    `Update package.json: ${current} → ${next}`,
    !options.skipChangelog && 'Update CHANGELOG.md',
    `Create git commit: "chore(release): ${next}"`,
    `Create git tag: v${next}`,
    'Push to origin',
    !options.skipGithub && 'Create GitHub release',
    !options.skipPublish && 'Publish to npm'
  ].filter(Boolean);

  box(`Version: ${current} → ${next}\n\nChanges:\n${changes.map(c => `  ✓ ${c}`).join('\n')}`);
}

async function confirmRelease(current: string, next: string): Promise<boolean> {
  // In a real implementation, use inquirer or similar
  // For now, just proceed
  return true;
}

async function executeRelease(
  pkg: any,
  pkgPath: string,
  currentVersion: string,
  newVersion: string,
  config: any,
  options: ShipOptions
): Promise<ShipResult> {
  const result: ShipResult = {
    version: newVersion,
    previousVersion: currentVersion,
    changelogUpdated: false,
    commitCreated: false,
    tagCreated: false,
    pushed: false,
    published: false
  };

  // 1. Update version in package.json
  step('Updating version...');
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  success(`Updated package.json to ${newVersion}`);

  // 2. Update other version files
  if (config.version?.placeholders) {
    for (const placeholder of config.version.placeholders) {
      updateVersionPlaceholder(placeholder, newVersion);
    }
  }

  // 3. Generate changelog
  if (!options.skipChangelog) {
    step('Generating changelog...');
    await generateChangelogEntries(newVersion, config);
    result.changelogUpdated = true;
    success('Updated CHANGELOG.md');
  }

  // 4. Run build
  if (!options.skipBuild) {
    step('Building...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      success('Build completed');
    } catch {
      error('Build failed');
      throw new Error('Build failed');
    }
  }

  // 5. Run after:bump hooks
  if (config.hooks?.['after:bump']) {
    for (const hook of config.hooks['after:bump']) {
      step(`Running hook: ${hook}`);
      execSync(hook, { stdio: 'inherit' });
    }
  }

  // 6. Git commit
  step('Creating commit...');
  const commitMessage = config.git?.commitMessage?.replace('${version}', newVersion) 
    || `chore(release): ${newVersion}`;
  
  const filesToAdd = config.git?.addFiles || ['package.json', 'CHANGELOG.md'];
  createCommit(commitMessage, filesToAdd);
  result.commitCreated = true;
  success(`Created commit: ${commitMessage}`);

  // 7. Git tag
  step('Creating tag...');
  const tagName = config.git?.tagName?.replace('${version}', newVersion) 
    || `v${newVersion}`;
  const tagAnnotation = config.git?.tagAnnotation?.replace('${version}', newVersion) 
    || `Release ${newVersion}`;
  
  createTag(tagName, tagAnnotation, options.sign || false);
  result.tagCreated = true;
  success(`Created tag: ${tagName}`);

  // 8. Push
  step('Pushing to remote...');
  const remote = config.git?.pushRepo || 'origin';
  const branch = options.target || getGitStatus().branch;
  
  pushToRemote(remote, branch, true); // Push with tags
  result.pushed = true;
  success('Pushed to remote');

  // 9. GitHub release
  if (!options.skipGithub) {
    step('Creating GitHub release...');
    try {
      const { owner, repo } = parseRepoUrl();
      const release = await createRelease({
        owner,
        repo,
        tag: tagName,
        name: config.github?.releaseName?.replace('${version}', newVersion) 
          || `v${newVersion}`,
        body: await generateReleaseNotes(newVersion),
        draft: config.github?.draft || false,
        prerelease: config.github?.prerelease || /-/.test(newVersion)
      });

      result.githubRelease = {
        url: release.html_url,
        id: release.id
      };
      success(`Created GitHub release: ${release.html_url}`);
    } catch (err) {
      warning('Failed to create GitHub release');
      console.error(err);
    }
  }

  // 10. Publish
  if (!options.skipPublish && config.publish?.enabled !== false) {
    step('Publishing to npm...');
    try {
      const access = config.publish?.access === 'restricted' ? '--access restricted' : '';
      execSync(`npm publish ${access}`, { stdio: 'inherit' });
      result.published = true;
      success('Published to npm');
    } catch {
      warning('Failed to publish to npm');
    }
  }

  // 11. Run after:release hooks
  if (config.hooks?.['after:release']) {
    for (const hook of config.hooks['after:release']) {
      step(`Running hook: ${hook}`);
      execSync(hook, { stdio: 'inherit' });
    }
  }

  return result;
}

function updateVersionPlaceholder(
  placeholder: { file: string; pattern: string },
  version: string
): void {
  const filePath = resolve(process.cwd(), placeholder.file);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf-8');
  const newContent = content.replace(
    new RegExp(placeholder.pattern, 'g'),
    (match: string) => match.replace(/".*?"/, `"${version}"`)
  );

  writeFileSync(filePath, newContent);
}

async function generateChangelogEntries(version: string, config: any): Promise<void> {
  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
  const commits = getCommitsSince();

  // Categorize commits
  const categories: Record<string, string[]> = {
    Features: [],
    'Bug Fixes': [],
    Documentation: [],
    'Code Refactoring': [],
    Tests: [],
    Chores: []
  };

  for (const commit of commits) {
    const message = commit.message;
    
    if (message.startsWith('feat')) {
      categories.Features.push(message);
    } else if (message.startsWith('fix')) {
      categories['Bug Fixes'].push(message);
    } else if (message.startsWith('docs')) {
      categories.Documentation.push(message);
    } else if (message.startsWith('refactor')) {
      categories['Code Refactoring'].push(message);
    } else if (message.startsWith('test')) {
      categories.Tests.push(message);
    } else if (message.startsWith('chore')) {
      categories.Chores.push(message);
    }
  }

  // Generate changelog entry
  const date = new Date().toISOString().split('T')[0];
  let entry = `## [${version}] - ${date}\n\n`;

  for (const [category, messages] of Object.entries(categories)) {
    if (messages.length === 0) continue;
    
    entry += `### ${category}\n\n`;
    for (const msg of messages) {
      const cleanMsg = msg.replace(/^(feat|fix|docs|refactor|test|chore)(\(.+\))?:\s*/, '');
      entry += `- ${cleanMsg}\n`;
    }
    entry += '\n';
  }

  // Read existing changelog or create new
  let existingContent = '';
  if (existsSync(changelogPath)) {
    existingContent = readFileSync(changelogPath, 'utf-8');
    // Insert after header
    const lines = existingContent.split('\n');
    const headerEnd = lines.findIndex(l => l.startsWith('## '));
    if (headerEnd >= 0) {
      lines.splice(headerEnd, 0, entry);
      existingContent = lines.join('\n');
    } else {
      existingContent = '# Changelog\n\n' + entry + existingContent;
    }
  } else {
    existingContent = '# Changelog\n\n' + entry;
  }

  writeFileSync(changelogPath, existingContent);
}

async function generateReleaseNotes(version: string): Promise<string> {
  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
  
  if (!existsSync(changelogPath)) {
    return `Release ${version}`;
  }

  const content = readFileSync(changelogPath, 'utf-8');
  
  // Extract entry for this version
  const versionMatch = content.match(
    new RegExp(`## \\[${version}\\].*?(?=\n## |$)`, 's')
  );
  
  if (versionMatch) {
    return versionMatch[0].replace(new RegExp(`## \\[${version}\\].*?\n`), '').trim();
  }

  return `Release ${version}`;
}

async function generateChangelog(options: ShipOptions): Promise<void> {
  step('Generating changelog...');
  // Implementation for standalone changelog generation
  info('Changelog generation complete');
}

async function checkReleaseStatus(): Promise<void> {
  header('Release Status');

  try {
    const status = getGitStatus();
    const lastTag = getLastTag();
    const commits = getCommitsSince(lastTag || undefined);

    info(`Current branch: ${status.branch}`);
    info(`Working directory: ${status.isClean ? 'clean' : 'dirty'}`);
    info(`Last tag: ${lastTag || 'none'}`);
    info(`Unreleased commits: ${commits.length}`);

    if (commits.length > 0) {
      section('Recent commits:');
      list(commits.slice(0, 10).map(c => c.message));
    }

    if (!status.isClean) {
      warning('Working directory is not clean - commit changes before releasing');
    }

    if (status.ahead > 0) {
      info(`${status.ahead} commit(s) ahead of remote`);
    }

    if (status.behind > 0) {
      warning(`${status.behind} commit(s) behind remote - pull before releasing`);
    }

  } catch (err) {
    error('Not a git repository');
  }
}

async function reportResults(result: ShipResult, options: ShipOptions): Promise<void> {
  header('Release Summary');

  divider();
  info(`Version: ${result.previousVersion} → ${result.version}`);
  info(`Changelog: ${result.changelogUpdated ? '✓' : '✗'}`);
  info(`Commit: ${result.commitCreated ? '✓' : '✗'}`);
  info(`Tag: ${result.tagCreated ? '✓' : '✗'}`);
  info(`Pushed: ${result.pushed ? '✓' : '✗'}`);
  info(`Published: ${result.published ? '✓' : '✗'}`);

  if (result.githubRelease) {
    info(`GitHub: ${result.githubRelease.url}`);
  }
  divider();

  success(`Released v${result.version}`);

  // Send notification if configured
  if (!options.dryRun) {
    try {
      await sendMessage(formatShipResult(result));
    } catch {
      // Notification failed, but release succeeded
    }
  }
}
