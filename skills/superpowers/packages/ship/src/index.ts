import { execSync } from 'child_process';
import { loadConfig, sendTelegramNotification, type TelegramConfig } from '@openclaw/superpowers-shared';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

export interface ShipConfig {
  requireCleanWorkingDir?: boolean;
  runTestsBeforeRelease?: boolean;
  testCommand?: string;
  changelog?: {
    preset?: 'conventional' | 'angular' | 'simple';
    includeContributors?: boolean;
  };
  github?: {
    defaultOrg?: string;
    token?: string;
  };
  telegram?: TelegramConfig;
}

export interface ReleaseResult {
  success: boolean;
  version: string;
  tag: string;
  changelog?: string;
  error?: string;
}

export type VersionBump = 'patch' | 'minor' | 'major' | string;

export class ReleasePipeline {
  private config: ShipConfig;
  private projectRoot: string;

  constructor(config?: ShipConfig, projectRoot: string = process.cwd()) {
    this.config = config || {};
    this.projectRoot = projectRoot;
  }

  validate(options: { force?: boolean } = {}): { valid: boolean; error?: string } {
    // Check for clean working directory
    if (this.config.requireCleanWorkingDir !== false && !options.force) {
      try {
        const status = execSync('git status --porcelain', {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });
        if (status.trim()) {
          return { 
            valid: false, 
            error: 'Working directory is not clean. Use --force to override.' 
          };
        }
      } catch {
        return { valid: false, error: 'Not a git repository' };
      }
    }

    // Check for GitHub token
    const ghToken = this.config.github?.token || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    if (!ghToken) {
      return { 
        valid: false, 
        error: 'GitHub token not found. Set GH_TOKEN environment variable or configure in superpowers.config.json' 
      };
    }

    // Check for package.json
    if (!existsSync(resolve(this.projectRoot, 'package.json'))) {
      return { valid: false, error: 'No package.json found' };
    }

    return { valid: true };
  }

  runTests(): { passed: boolean; output?: string; error?: string } {
    if (this.config.runTestsBeforeRelease === false) {
      return { passed: true };
    }

    const testCommand = this.config.testCommand || 'npm test';
    
    try {
      console.log(chalk.blue('🧪 Running tests before release...'));
      const output = execSync(testCommand, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      return { passed: true, output };
    } catch (error) {
      const errorOutput = error instanceof Error && 'stdout' in error
        ? String((error as { stdout: Buffer }).stdout)
        : String(error);
      return { passed: false, output: errorOutput, error: 'Tests failed' };
    }
  }

  getCurrentVersion(): string {
    const pkgPath = resolve(this.projectRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  }

  bumpVersion(bump: VersionBump): string {
    const current = this.getCurrentVersion();
    const [major, minor, patch] = current.split('.').map(Number);

    let newVersion: string;
    
    if (bump === 'major') {
      newVersion = `${major + 1}.0.0`;
    } else if (bump === 'minor') {
      newVersion = `${major}.${minor + 1}.0`;
    } else if (bump === 'patch') {
      newVersion = `${major}.${minor}.${patch + 1}`;
    } else if (/^\d+\.\d+\.\d+/.test(bump)) {
      newVersion = bump;
    } else {
      throw new Error(`Invalid version bump: ${bump}`);
    }

    // Update package.json
    const pkgPath = resolve(this.projectRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    pkg.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

    console.log(chalk.green(`📦 Version bumped: ${current} → ${newVersion}`));
    return newVersion;
  }

  generateChangelog(version: string): string {
    try {
      // Get commits since last tag
      let lastTag: string;
      try {
        lastTag = execSync('git describe --tags --abbrev=0', {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        }).trim();
      } catch {
        lastTag = '';
      }

      const logRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
      const commits = execSync(`git log ${logRange} --pretty=format:"%s (%h)" --no-merges`, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });

      const sections: Record<string, string[]> = {
        feat: [],
        fix: [],
        docs: [],
        style: [],
        refactor: [],
        perf: [],
        test: [],
        chore: [],
        other: []
      };

      for (const line of commits.split('\n').filter(Boolean)) {
        const match = line.match(/^(\w+)(?:\([^)]+\))?:\s*(.+)/);
        if (match) {
          const type = match[1];
          const message = match[2];
          (sections[type] || sections.other).push(`- ${message}`);
        } else {
          sections.other.push(`- ${line}`);
        }
      }

      let changelog = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;

      if (sections.feat.length) changelog += `### ✨ Features\n${sections.feat.join('\n')}\n\n`;
      if (sections.fix.length) changelog += `### 🐛 Bug Fixes\n${sections.fix.join('\n')}\n\n`;
      if (sections.docs.length) changelog += `### 📝 Documentation\n${sections.docs.join('\n')}\n\n`;
      if (sections.perf.length) changelog += `### ⚡ Performance\n${sections.perf.join('\n')}\n\n`;
      if (sections.refactor.length) changelog += `### ♻️ Refactoring\n${sections.refactor.join('\n')}\n\n`;
      if (sections.test.length) changelog += `### ✅ Tests\n${sections.test.join('\n')}\n\n`;
      if (sections.chore.length) changelog += `### 🔧 Chores\n${sections.chore.join('\n')}\n\n`;
      if (sections.other.length) changelog += `### Other\n${sections.other.join('\n')}\n\n`;

      // Prepend to CHANGELOG.md if it exists
      const changelogPath = resolve(this.projectRoot, 'CHANGELOG.md');
      if (existsSync(changelogPath)) {
        const existing = readFileSync(changelogPath, 'utf-8');
        writeFileSync(changelogPath, `# Changelog\n\n${changelog}\n${existing.replace('# Changelog\n\n', '')}`);
      } else {
        writeFileSync(changelogPath, `# Changelog\n\n${changelog}`);
      }

      console.log(chalk.green('📝 Changelog generated'));
      return changelog;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not generate changelog'));
      return '';
    }
  }

  commitAndTag(version: string): void {
    const tag = `v${version}`;
    
    try {
      // Stage changes
      execSync('git add -A', { cwd: this.projectRoot });
      
      // Commit
      execSync(`git commit -m "chore(release): ${tag}"`, {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      // Create tag
      execSync(`git tag -a ${tag} -m "Release ${tag}"`, {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      console.log(chalk.green(`🏷️  Tagged: ${tag}`));
    } catch (error) {
      throw new Error(`Failed to commit and tag: ${error instanceof Error ? error.message : error}`);
    }
  }

  pushToRemote(): void {
    try {
      execSync('git push && git push --tags', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      console.log(chalk.green('📤 Pushed to remote'));
    } catch (error) {
      throw new Error(`Failed to push: ${error instanceof Error ? error.message : error}`);
    }
  }

  async createGitHubRelease(version: string, changelog: string, repo?: string): Promise<void> {
    const token = this.config.github?.token || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GitHub token not found');
    }

    // Auto-detect repo if not provided
    let repoSlug = repo;
    if (!repoSlug) {
      try {
        const remote = execSync('git remote get-url origin', {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        }).trim();
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
        if (match) {
          repoSlug = `${match[1]}/${match[2]}`;
        }
      } catch {
        throw new Error('Could not auto-detect repository. Use --repo flag.');
      }
    }

    const tag = `v${version}`;
    const body = changelog || `Release ${tag}`;

    try {
      const response = await fetch(`https://api.github.com/repos/${repoSlug}/releases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          tag_name: tag,
          name: tag,
          body: body,
          draft: false,
          prerelease: false,
          generate_release_notes: !changelog
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error: ${error}`);
      }

      const data = await response.json() as { html_url: string };
      console.log(chalk.green(`🚀 GitHub release created: ${data.html_url}`));
    } catch (error) {
      throw new Error(`Failed to create GitHub release: ${error instanceof Error ? error.message : error}`);
    }
  }
}

export async function ship(options: {
  version: VersionBump;
  repo?: string;
  dryRun?: boolean;
  skipTests?: boolean;
  notes?: string;
  force?: boolean;
  configPath?: string;
  telegram?: boolean;
}): Promise<ReleaseResult> {
  const rawConfig = loadConfig(options.configPath);
  const config = rawConfig as { ship?: ShipConfig; telegram?: TelegramConfig };
  const shipConfig = config.ship || {};

  const pipeline = new ReleasePipeline(shipConfig);

  console.log(chalk.bold('🚀 Ship - Release Pipeline\n'));

  // Validate
  const validation = pipeline.validate({ force: options.force });
  if (!validation.valid) {
    console.error(chalk.red(`❌ ${validation.error}`));
    process.exit(1);
  }

  // Run tests
  if (!options.skipTests && shipConfig.runTestsBeforeRelease !== false) {
    const testResult = pipeline.runTests();
    if (!testResult.passed) {
      console.error(chalk.red('❌ Tests failed. Use --skip-tests to override.'));
      if (testResult.output) console.log(testResult.output);
      process.exit(1);
    }
    console.log(chalk.green('✅ Tests passed\n'));
  }

  const currentVersion = pipeline.getCurrentVersion();
  console.log(chalk.gray(`Current version: ${currentVersion}`));
  console.log(chalk.gray(`Bump type: ${options.version}`));
  
  if (options.dryRun) {
    console.log(chalk.yellow('\n🧪 Dry run - no changes made'));
    return {
      success: true,
      version: currentVersion,
      tag: `v${currentVersion}`
    };
  }

  // Bump version
  const newVersion = pipeline.bumpVersion(options.version);

  // Generate changelog
  const changelog = options.notes || pipeline.generateChangelog(newVersion);

  // Commit and tag
  pipeline.commitAndTag(newVersion);

  // Push to remote
  pipeline.pushToRemote();

  // Create GitHub release
  await pipeline.createGitHubRelease(newVersion, changelog, options.repo);

  // Send Telegram notification if requested
  if (options.telegram && config.telegram?.enabled) {
    const repo = options.repo || 'repository';
    const message = `🚀 **Ship Complete**\n\n` +
      `Version: v${newVersion}\n` +
      `Repo: ${repo}\n\n` +
      `${changelog.substring(0, 1000)}`;

    await sendTelegramNotification(config.telegram, message);
  }

  console.log(chalk.green(`\n✨ Release v${newVersion} shipped successfully!`));

  return {
    success: true,
    version: newVersion,
    tag: `v${newVersion}`,
    changelog
  };
}

export { loadConfig };
