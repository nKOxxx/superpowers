import { Command } from 'commander';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

interface ShipOptions {
  dryRun?: boolean;
  skipTests?: boolean;
  skipChangelog?: boolean;
  skipGit?: boolean;
  skipGithub?: boolean;
  prerelease?: boolean;
  notes?: string;
  json?: boolean;
}

interface ReleaseInfo {
  version: string;
  previousVersion: string;
  changelog: string;
  commits: CommitInfo[];
}

interface CommitInfo {
  type: string;
  message: string;
  scope?: string;
  breaking: boolean;
}

const program = new Command();

program
  .name('ship')
  .description('One-command release pipeline')
  .argument('<version>', 'Version type (patch, minor, major) or explicit version (x.y.z)')
  .option('--dry-run', 'Preview changes without executing', false)
  .option('--skip-tests', 'Skip test run before release', false)
  .option('--skip-changelog', 'Skip changelog update', false)
  .option('--skip-git', 'Skip git operations', false)
  .option('--skip-github', 'Skip GitHub release', false)
  .option('--prerelease', 'Mark as prerelease', false)
  .option('--notes <text>', 'Custom release notes')
  .option('-j, --json', 'Output results as JSON', false)
  .action(async (versionArg: string, options: ShipOptions) => {
    const results: Record<string, boolean | string> = {};
    
    try {
      // Step 1: Validate
      const validateSpinner = ora('Validating repository...').start();
      
      if (!existsSync('package.json')) {
        validateSpinner.fail('No package.json found');
        throw new Error('package.json not found');
      }
      
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      const currentVersion = pkg.version;
      
      // Check git status
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (gitStatus.trim() && !options.dryRun) {
        validateSpinner.fail('Working directory not clean');
        throw new Error('Working directory has uncommitted changes');
      }
      
      validateSpinner.succeed('Repository validated');
      
      // Calculate new version
      const newVersion = calculateVersion(currentVersion, versionArg);
      results.previousVersion = currentVersion;
      results.version = newVersion;
      
      console.log(chalk.cyan(`\n📦 ${pkg.name} ${chalk.bold(currentVersion)} → ${chalk.bold.green(newVersion)}\n`));
      
      if (options.dryRun) {
        console.log(chalk.yellow('🔍 DRY RUN - No changes will be made\n'));
      }
      
      // Step 2: Run tests
      if (!options.skipTests) {
        const testSpinner = ora('Running tests...').start();
        
        try {
          if (!options.dryRun) {
            execSync('npm test', { stdio: 'pipe' });
          }
          testSpinner.succeed('Tests passed');
          results.tests = true;
        } catch {
          testSpinner.fail('Tests failed');
          throw new Error('Tests failed - release aborted');
        }
      }
      
      // Step 3: Update version
      const versionSpinner = ora(`Updating version to ${newVersion}...`).start();
      
      if (!options.dryRun) {
        pkg.version = newVersion;
        writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      }
      
      versionSpinner.succeed(`Version updated to ${newVersion}`);
      results.versionBump = true;
      
      // Step 4: Generate changelog
      let changelog = '';
      if (!options.skipChangelog) {
        const changelogSpinner = ora('Generating changelog...').start();
        
        const commits = getCommitsSinceLastTag();
        changelog = generateChangelog(commits, newVersion);
        
        if (!options.dryRun && existsSync('CHANGELOG.md')) {
          const existingChangelog = readFileSync('CHANGELOG.md', 'utf-8');
          writeFileSync('CHANGELOG.md', changelog + '\n\n' + existingChangelog);
        } else if (!options.dryRun) {
          writeFileSync('CHANGELOG.md', changelog);
        }
        
        changelogSpinner.succeed('Changelog generated');
        results.changelog = true;
      }
      
      // Step 5: Git commit and tag
      if (!options.skipGit) {
        const gitSpinner = ora('Creating git commit and tag...').start();
        
        if (!options.dryRun) {
          execSync('git add package.json CHANGELOG.md', { stdio: 'pipe' });
          execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'pipe' });
          execSync(`git tag v${newVersion}`, { stdio: 'pipe' });
          execSync('git push origin HEAD', { stdio: 'pipe' });
          execSync('git push origin --tags', { stdio: 'pipe' });
        }
        
        gitSpinner.succeed('Git commit and tag created');
        results.git = true;
      }
      
      // Step 6: GitHub release
      if (!options.skipGithub && process.env.GH_TOKEN) {
        const githubSpinner = ora('Creating GitHub release...').start();
        
        if (!options.dryRun) {
          const releaseNotes = options.notes || changelog || `Release v${newVersion}`;
          const prereleaseFlag = options.prerelease ? '--prerelease' : '';
          
          execSync(
            `gh release create v${newVersion} ${prereleaseFlag} --title "v${newVersion}" --notes "${releaseNotes}"`,
            { stdio: 'pipe', env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN } }
          );
        }
        
        githubSpinner.succeed('GitHub release created');
        results.github = true;
      }
      
      // Step 7: Telegram notification
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        const telegramSpinner = ora('Sending Telegram notification...').start();
        
        if (!options.dryRun) {
          const message = encodeURIComponent(
            `🚀 *Release Shipped*\n\n` +
            `📦 ${pkg.name} *v${newVersion}*\n` +
            `✅ Successfully released to production`
          );
          
          execSync(
            `curl -s -X POST "https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage" ` +
            `-d "chat_id=${process.env.TELEGRAM_CHAT_ID}" ` +
            `-d "text=${message}" ` +
            `-d "parse_mode=Markdown"`,
            { stdio: 'pipe' }
          );
        }
        
        telegramSpinner.succeed('Telegram notification sent');
        results.telegram = true;
      }
      
      // Success output
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          packageName: pkg.name,
          version: newVersion,
          previousVersion: currentVersion,
          dryRun: options.dryRun,
          results
        }, null, 2));
      } else {
        console.log(chalk.green('\n✅ Release completed successfully!\n'));
        console.log(chalk.cyan('📦 Package: ') + chalk.white(pkg.name));
        console.log(chalk.cyan('🏷️  Version: ') + chalk.white(newVersion));
        
        if (options.dryRun) {
          console.log(chalk.yellow('\nThis was a dry run. No changes were made.'));
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: errorMessage,
          results
        }, null, 2));
      } else {
        console.error(chalk.red(`\n❌ Release failed: ${errorMessage}\n`));
      }
      
      process.exit(1);
    }
  });

function calculateVersion(current: string, bump: string): string {
  const [major, minor, patch] = current.split('.').map(Number);
  
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      // Assume explicit version
      if (/^\d+\.\d+\.\d+/.test(bump)) {
        return bump;
      }
      throw new Error(`Invalid version type: ${bump}`);
  }
}

function getCommitsSinceLastTag(): CommitInfo[] {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    const logOutput = execSync(`git log ${lastTag}..HEAD --pretty=format:"%s"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    return logOutput.split('\n').filter(Boolean).map(parseCommit);
  } catch {
    // No previous tag, get all commits
    const logOutput = execSync('git log --pretty=format:"%s"', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    return logOutput.split('\n').filter(Boolean).map(parseCommit);
  }
}

function parseCommit(message: string): CommitInfo {
  const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/;
  const match = message.match(conventionalRegex);
  
  if (match) {
    return {
      type: match[1],
      scope: match[2],
      message: match[3],
      breaking: message.includes('BREAKING CHANGE')
    };
  }
  
  return {
    type: 'other',
    message: message,
    breaking: message.includes('BREAKING CHANGE')
  };
}

function generateChangelog(commits: CommitInfo[], version: string): string {
  const sections: Record<string, CommitInfo[]> = {
    feat: [],
    fix: [],
    chore: [],
    other: [],
    breaking: []
  };
  
  for (const commit of commits) {
    if (commit.breaking) {
      sections.breaking.push(commit);
    }
    
    if (sections[commit.type]) {
      sections[commit.type].push(commit);
    } else {
      sections.other.push(commit);
    }
  }
  
  let changelog = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;
  
  if (sections.breaking.length > 0) {
    changelog += '### ⚠️ Breaking Changes\n\n';
    for (const commit of sections.breaking) {
      changelog += `- ${commit.message}\n`;
    }
    changelog += '\n';
  }
  
  if (sections.feat.length > 0) {
    changelog += '### ✨ Features\n\n';
    for (const commit of sections.feat) {
      changelog += `- ${commit.message}\n`;
    }
    changelog += '\n';
  }
  
  if (sections.fix.length > 0) {
    changelog += '### 🐛 Bug Fixes\n\n';
    for (const commit of sections.fix) {
      changelog += `- ${commit.message}\n`;
    }
    changelog += '\n';
  }
  
  if (sections.chore.length > 0) {
    changelog += '### 🧹 Chores\n\n';
    for (const commit of sections.chore) {
      changelog += `- ${commit.message}\n`;
    }
    changelog += '\n';
  }
  
  return changelog.trim();
}

program.parse();
