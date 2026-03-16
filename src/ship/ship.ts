#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { simpleGit } from 'simple-git';
import { ShipOptions, ReleaseInfo } from '../shared/types.js';
import { loadConfig, Logger, sendTelegram, parseArgs } from '../shared/utils.js';

const logger = new Logger();

interface ShipReport {
  steps: Array<{
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message?: string;
  }>;
  releaseInfo?: ReleaseInfo;
  overall: 'COMPLETE' | 'FAILED';
}

async function runShip(options: ShipOptions): Promise<ShipReport> {
  const config = await loadConfig();
  const shipConfig = config.ship || {};
  const githubConfig = config.github || {};
  
  const [owner, repo] = options.repo.split('/');
  if (!owner || !repo) {
    throw new Error('Invalid repo format. Use owner/repo');
  }
  
  const report: ShipReport = {
    steps: [],
    overall: 'COMPLETE',
  };

  const token = process.env.GH_TOKEN || githubConfig.token;
  if (!token) {
    throw new Error('GH_TOKEN environment variable or github.token config required');
  }

  const git = simpleGit();
  const tempDir = `/tmp/superpowers-ship-${Date.now()}`;

  try {
    // Clone the repo
    logger.section('Pre-flight');
    logger.log(`Repository: ${chalk.cyan(options.repo)}`);
    logger.log(`Version bump: ${chalk.cyan(options.version)}\n`);
    
    execSync(`git clone https://${token}@github.com/${options.repo}.git "${tempDir}"`, {
      stdio: 'pipe',
    });
    
    const repoGit = simpleGit(tempDir);
    
    // Check working directory
    const status = await repoGit.status();
    const isClean = status.files.length === 0;
    
    if (!isClean && shipConfig.requireCleanWorkingDir !== false && !options.force) {
      report.steps.push({ name: 'Pre-flight', status: 'FAIL', message: 'Working directory has uncommitted changes' });
      report.overall = 'FAILED';
      logger.error('Working directory has uncommitted changes');
      logger.info('Use --force to override');
      return report;
    }
    
    // Check branch
    const branch = status.current;
    if (branch !== 'main' && branch !== 'master' && !options.force) {
      report.steps.push({ name: 'Branch check', status: 'FAIL', message: `Not on main/master branch (on ${branch})` });
      report.overall = 'FAILED';
      logger.error(`Not on main/master branch (currently on ${branch})`);
      logger.info('Use --force to override');
      return report;
    }
    
    report.steps.push({ name: 'Pre-flight', status: 'PASS' });
    logger.success('Pre-flight checks passed');
    
    // Get current version
    let currentVersion = '0.0.0';
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'));
      currentVersion = packageJson.version;
    } catch {
      // Try other version files
      try {
        const cargoToml = await fs.readFile(path.join(tempDir, 'Cargo.toml'), 'utf-8');
        const match = cargoToml.match(/version\s*=\s*"([^"]+)"/);
        if (match) currentVersion = match[1];
      } catch {
        // Ignore
      }
    }
    
    // Calculate new version
    const newVersion = calculateNewVersion(currentVersion, options.version);
    
    // Check if tag exists
    try {
      await repoGit.raw(['rev-parse', `v${newVersion}`]);
      report.steps.push({ name: 'Tag check', status: 'FAIL', message: `Tag v${newVersion} already exists` });
      report.overall = 'FAILED';
      logger.error(`Tag v${newVersion} already exists`);
      return report;
    } catch {
      // Tag doesn't exist, good
    }
    
    // Run tests if enabled
    if (shipConfig.runTestsBeforeRelease !== false && !options.skipTests && !options.dryRun) {
      logger.section('Tests');
      try {
        const repoSpecific = shipConfig.repos?.[options.repo];
        const testCommand = repoSpecific?.testCommand || 'npm test';
        execSync(testCommand, { cwd: tempDir, stdio: 'pipe' });
        report.steps.push({ name: 'Tests', status: 'PASS' });
        logger.success('All tests passed');
      } catch (error) {
        report.steps.push({ name: 'Tests', status: 'FAIL', message: 'Tests failed' });
        report.overall = 'FAILED';
        logger.error('Tests failed');
        logger.info('Use --skip-tests to bypass (not recommended)');
        return report;
      }
    } else {
      report.steps.push({ name: 'Tests', status: 'SKIP' });
      logger.info('Tests skipped');
    }
    
    if (options.dryRun) {
      logger.section('Dry Run');
      logger.log(chalk.yellow('Would perform:'));
      logger.log(`  • Update version: ${currentVersion} → ${newVersion}`);
      logger.log(`  • Generate changelog`);
      logger.log(`  • Commit and tag v${newVersion}`);
      logger.log(`  • Push to origin`);
      logger.log(`  • Create GitHub release`);
      report.steps.push({ name: 'Release', status: 'SKIP', message: 'Dry run mode' });
      return report;
    }
    
    // Update version
    logger.section('Version Bump');
    try {
      const packageJsonPath = path.join(tempDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      packageJson.version = newVersion;
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      report.steps.push({ name: 'Version bump', status: 'PASS' });
      logger.success(`Updated to v${newVersion}`);
    } catch (error) {
      report.steps.push({ name: 'Version bump', status: 'FAIL' });
      report.overall = 'FAILED';
      logger.error('Failed to update version');
      return report;
    }
    
    // Generate changelog
    logger.section('Changelog');
    const changelog = await generateChangelog(repoGit, currentVersion);
    
    // Update CHANGELOG.md
    try {
      const changelogPath = path.join(tempDir, 'CHANGELOG.md');
      let existingChangelog = '';
      try {
        existingChangelog = await fs.readFile(changelogPath, 'utf-8');
      } catch {
        // No existing changelog
      }
      
      const newEntry = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n${changelog}\n`;
      await fs.writeFile(changelogPath, newEntry + '\n' + existingChangelog);
      report.steps.push({ name: 'Changelog', status: 'PASS' });
      logger.success('Updated CHANGELOG.md');
    } catch (error) {
      logger.warn('Failed to update CHANGELOG.md');
    }
    
    // Git operations
    logger.section('Git Operations');
    try {
      await repoGit.add(['package.json', 'CHANGELOG.md']);
      await repoGit.commit(`chore(release): v${newVersion}`);
      await repoGit.addTag(`v${newVersion}`);
      if (branch) {
        await repoGit.push('origin', branch);
      }
      await repoGit.pushTags('origin');
      report.steps.push({ name: 'Git operations', status: 'PASS' });
      logger.success('Committed, tagged, and pushed');
    } catch (error) {
      report.steps.push({ name: 'Git operations', status: 'FAIL' });
      report.overall = 'FAILED';
      logger.error('Git operations failed');
      return report;
    }
    
    // Create GitHub release
    logger.section('GitHub Release');
    try {
      const releaseBody = options.notes 
        ? `${options.notes}\n\n${changelog}`
        : changelog;
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag_name: `v${newVersion}`,
          name: `v${newVersion}`,
          body: releaseBody,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const release = await response.json() as { html_url: string; tag_name: string };
      report.releaseInfo = {
        owner,
        repo,
        currentVersion,
        newVersion,
        changelog: release.html_url,
      };
      
      report.steps.push({ name: 'GitHub release', status: 'PASS' });
      logger.success(`Created release: ${release.html_url}`);
    } catch (error) {
      report.steps.push({ name: 'GitHub release', status: 'FAIL' });
      logger.error('Failed to create GitHub release');
    }
    
    // Notification
    if (shipConfig.telegramNotify !== false) {
      const message = generateTelegramMessage(report, options);
      await sendTelegram(message, config.telegram?.botToken, config.telegram?.target);
      report.steps.push({ name: 'Notification', status: 'PASS' });
    }
    
  } finally {
    // Cleanup
    try {
      execSync(`rm -rf "${tempDir}"`, { stdio: 'ignore' });
    } catch {
      // Ignore cleanup errors
    }
  }

  return report;
}

function calculateNewVersion(current: string, bump: string): string {
  if (bump.match(/^\d+\.\d+\.\d+$/)) {
    return bump;
  }
  
  const [major, minor, patch] = current.split('.').map(Number);
  
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

async function generateChangelog(git: ReturnType<typeof simpleGit>, sinceVersion: string): Promise<string> {
  try {
    const log = await git.log({ from: `v${sinceVersion}`, to: 'HEAD' });
    
    const categories: Record<string, string[]> = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      chore: [],
    };
    
    for (const commit of log.all) {
      const message = commit.message.split('\n')[0];
      const match = message.match(/^(\w+)(\(.+\))?:\s*(.+)/);
      
      if (match) {
        const [, type, , subject] = match;
        if (categories[type]) {
          categories[type].push(`- ${subject} (${commit.hash.substring(0, 7)})`);
        }
      }
    }
    
    const lines: string[] = [];
    
    if (categories.feat.length > 0) {
      lines.push('### Added');
      lines.push(...categories.feat);
      lines.push('');
    }
    
    if (categories.fix.length > 0) {
      lines.push('### Fixed');
      lines.push(...categories.fix);
      lines.push('');
    }
    
    if (categories.docs.length > 0) {
      lines.push('### Documentation');
      lines.push(...categories.docs);
      lines.push('');
    }
    
    const otherTypes = ['style', 'refactor', 'perf', 'test', 'chore'];
    const hasOther = otherTypes.some(t => categories[t].length > 0);
    
    if (hasOther) {
      lines.push('### Changed');
      for (const type of otherTypes) {
        lines.push(...categories[type]);
      }
      lines.push('');
    }
    
    return lines.join('\n') || '- No notable changes';
  } catch {
    return '- See commit history for changes';
  }
}

function generateTelegramMessage(report: ShipReport, options: ShipOptions): string {
  if (!report.releaseInfo) return '🚢 Release failed';
  
  const { owner, repo, currentVersion, newVersion } = report.releaseInfo;
  
  return `
🚢 *Release Complete*: ${owner}/${repo}

Version: ${currentVersion} → ${newVersion}

[View Release](${report.releaseInfo.changelog})
  `.trim();
}

function generateReport(report: ShipReport, options: ShipOptions): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('\n🚢 Ship Report\n'));
  
  if (report.overall === 'COMPLETE') {
    lines.push(chalk.green('✅ RELEASE COMPLETE\n'));
  } else {
    lines.push(chalk.red('❌ RELEASE FAILED\n'));
  }
  
  if (report.releaseInfo) {
    lines.push(`📦 ${options.repo}`);
    lines.push(`🏷️  v${report.releaseInfo.currentVersion} → v${report.releaseInfo.newVersion}\n`);
  }
  
  lines.push(chalk.bold('Steps:'));
  for (const step of report.steps) {
    const icon = step.status === 'PASS' ? '✅' : step.status === 'FAIL' ? '❌' : '⏭️';
    lines.push(`   ${icon} ${step.name}${step.message ? `: ${step.message}` : ''}`);
  }
  
  if (report.releaseInfo) {
    lines.push(`\n🔗 ${report.releaseInfo.changelog}`);
  }
  
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  const repo = args.repo as string;
  const version = args.version as string;
  
  if (!repo || !version) {
    console.error(chalk.red('Error: --repo and --version are required'));
    console.log('Usage: ship --repo=owner/repo --version=patch|minor|major|x.y.z [--force] [--skip-tests] [--dry-run] [--notes="..."]');
    process.exit(1);
  }
  
  const options: ShipOptions = {
    repo,
    version,
    force: args.force === true,
    skipTests: args['skip-tests'] === true,
    dryRun: args['dry-run'] === true,
    notes: args.notes as string,
    silent: args.silent === true,
  };
  
  try {
    const report = await runShip(options);
    console.log(generateReport(report, options));
    process.exit(report.overall === 'FAILED' ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  }
}

main();
