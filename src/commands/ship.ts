import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface ShipOptions {
  version: string;
  repo?: string;
  dryRun: boolean;
  skipTests: boolean;
  notes?: string;
  prerelease: boolean;
}

interface ChangelogEntry {
  type: string;
  scope?: string;
  message: string;
}

export async function shipCommand(options: ShipOptions): Promise<void> {
  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log('Release Pipeline');
  console.log('══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Validate
    console.log('Step 1: Validating...');
    validateRepo();
    console.log('✓ Repository validated');
    console.log('');

    // Get current version
    const packageJsonPath = resolve('package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const currentVersion = packageJson.version;

    // Calculate new version
    const newVersion = calculateVersion(currentVersion, options.version);
    console.log(`Current version: ${currentVersion}`);
    console.log(`New version: ${newVersion}`);
    console.log('');

    if (options.dryRun) {
      console.log('DRY RUN - No changes will be made');
      console.log('');
      return;
    }

    // Step 2: Run tests
    if (!options.skipTests) {
      console.log('Step 2: Running tests...');
      try {
        execSync('npm test', { stdio: 'inherit' });
        console.log('✓ Tests passed');
      } catch {
        console.error('✗ Tests failed');
        process.exit(1);
      }
      console.log('');
    } else {
      console.log('Step 2: Skipping tests (--skip-tests)');
      console.log('');
    }

    // Step 3: Update version
    console.log('Step 3: Updating version...');
    packageJson.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✓ Version updated to ${newVersion}`);
    console.log('');

    // Step 4: Generate changelog
    console.log('Step 4: Generating changelog...');
    const changelog = generateChangelog(newVersion);
    updateChangelogFile(changelog, newVersion);
    console.log('✓ Changelog updated');
    console.log('');

    // Step 5: Create release commit
    console.log('Step 5: Creating release commit...');
    execSync('git add -A');
    execSync(`git commit -m "chore(release): ${newVersion}"`);
    console.log('✓ Commit created');
    console.log('');

    // Step 6: Create git tag
    console.log('Step 6: Creating git tag...');
    const tagName = `v${newVersion}`;
    execSync(`git tag -a ${tagName} -m "Release ${newVersion}"`);
    console.log(`✓ Tag ${tagName} created`);
    console.log('');

    // Step 7: Push to remote
    console.log('Step 7: Pushing to remote...');
    execSync('git push origin HEAD');
    execSync(`git push origin ${tagName}`);
    console.log('✓ Pushed to remote');
    console.log('');

    // Step 8: Create GitHub release
    if (process.env.GH_TOKEN) {
      console.log('Step 8: Creating GitHub release...');
      const repo = options.repo || detectRepo();
      if (repo) {
        createGitHubRelease(repo, tagName, newVersion, changelog, options);
        console.log('✓ GitHub release created');
      } else {
        console.log('⚠ Could not detect repository, skipping GitHub release');
      }
      console.log('');
    } else {
      console.log('Step 8: Skipping GitHub release (GH_TOKEN not set)');
      console.log('');
    }

    console.log('══════════════════════════════════════════════════');
    console.log(`✓ Released ${newVersion}`);
    console.log('══════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('✗ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function validateRepo(): void {
  // Check git status
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      throw new Error('Working directory not clean. Commit or stash changes first.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not clean')) {
      throw error;
    }
    throw new Error('Not a git repository');
  }

  // Check package.json exists
  if (!existsSync(resolve('package.json'))) {
    throw new Error('package.json not found');
  }
}

function calculateVersion(current: string, bump: string): string {
  if (bump.match(/^\d+\.\d+\.\d+$/)) {
    return bump;
  }

  const parts = current.split('.').map(Number);
  const [major, minor, patch] = parts;

  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${bump}. Use major, minor, patch, or explicit version.`);
  }
}

function generateChangelog(version: string): string {
  const entries: ChangelogEntry[] = [];

  try {
    // Get commits since last tag
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD~20';
    
    const commits = execSync(`git log ${range} --pretty=format:"%s" --no-merges`, { encoding: 'utf-8' });

    for (const line of commits.split('\n')) {
      const match = line.match(/^(feat|fix|chore|docs|style|refactor|test|build)(?:\(([^)]+)\))?:\s*(.+)$/);
      if (match) {
        entries.push({
          type: match[1],
          scope: match[2],
          message: match[3]
        });
      }
    }
  } catch {
    // Ignore errors, return empty changelog
  }

  if (entries.length === 0) {
    return 'No notable changes.';
  }

  // Group by type
  const groups: Record<string, ChangelogEntry[]> = {};
  for (const entry of entries) {
    if (!groups[entry.type]) groups[entry.type] = [];
    groups[entry.type].push(entry);
  }

  const typeLabels: Record<string, string> = {
    feat: 'Features',
    fix: 'Bug Fixes',
    chore: 'Chores',
    docs: 'Documentation',
    style: 'Styling',
    refactor: 'Refactoring',
    test: 'Tests',
    build: 'Build'
  };

  let markdown = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;

  for (const [type, items] of Object.entries(groups)) {
    markdown += `### ${typeLabels[type] || type}\n\n`;
    for (const item of items) {
      const scope = item.scope ? `**${item.scope}:** ` : '';
      markdown += `- ${scope}${item.message}\n`;
    }
    markdown += '\n';
  }

  return markdown.trim();
}

function updateChangelogFile(changelog: string, version: string): void {
  const changelogPath = resolve('CHANGELOG.md');
  const header = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n`;

  let existing = '';
  if (existsSync(changelogPath)) {
    existing = readFileSync(changelogPath, 'utf-8');
    // Remove header if exists
    existing = existing.replace(header, '');
    // Remove old version header pattern
    existing = existing.replace(/^# Changelog.*\n\n/, '');
  }

  const newContent = header + changelog + '\n\n' + existing;
  writeFileSync(changelogPath, newContent);
}

function detectRepo(): string | null {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  } catch {
    // Ignore
  }
  return null;
}

function createGitHubRelease(
  repo: string,
  tag: string,
  version: string,
  changelog: string,
  options: ShipOptions
): void {
  const token = process.env.GH_TOKEN;
  if (!token) return;

  const name = options.notes ? `${version} - ${options.notes}` : `Release ${version}`;
  const body = changelog.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const prerelease = options.prerelease ? 'true' : 'false';

  const curlCmd = `curl -s -X POST \\
    -H "Authorization: token ${token}" \\
    -H "Accept: application/vnd.github.v3+json" \\
    https://api.github.com/repos/${repo}/releases \\
    -d '{
      "tag_name": "${tag}",
      "name": "${name}",
      "body": "${body}",
      "draft": false,
      "prerelease": ${prerelease}
    }'`;

  try {
    execSync(curlCmd, { encoding: 'utf-8' });
  } catch (error) {
    console.error('Warning: Failed to create GitHub release');
  }
}
