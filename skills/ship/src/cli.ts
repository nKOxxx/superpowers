#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { 
  ship, 
  parseConventionalCommits, 
  determineBump,
  generateChangelog,
  ShipOptions 
} from './index.js';

const program = new Command();

program
  .name('superpowers-ship')
  .description('One-command release pipeline')
  .version('1.0.0');

program
  .argument('[bump]', 'Version bump: patch, minor, major, auto, or explicit version (e.g., 1.2.3)', 'auto')
  .option('-r, --repo <repo>', 'GitHub repository (owner/repo)')
  .option('-b, --branch <branch>', 'Target branch')
  .option('--dry-run', 'Preview changes without applying', false)
  .option('--skip-changelog', 'Skip changelog generation', false)
  .option('--skip-github', 'Skip GitHub release', false)
  .option('--skip-tag', 'Skip git tag creation', false)
  .option('--analyze', 'Analyze commits and suggest version bump', false)
  .option('--preid <id>', 'Prerelease identifier (e.g., alpha, beta)')
  .action(async (bump, options) => {
    if (options.analyze) {
      console.log(chalk.bold('📊 Commit Analysis'));
      console.log(chalk.gray('─'.repeat(50)));
      
      const commits = parseConventionalCommits();
      const suggestedBump = determineBump(commits);
      
      console.log(`Found ${chalk.cyan(commits.length)} conventional commits`);
      
      if (suggestedBump) {
        console.log(`Suggested bump: ${chalk.green(suggestedBump)}`);
      } else {
        console.log(chalk.yellow('No version-worthy commits found'));
      }
      
      if (commits.length > 0) {
        console.log(chalk.gray('\nCommits:'));
        commits.forEach(c => {
          const typeColor = c.breaking ? chalk.red :
                           c.type === 'feat' ? chalk.green :
                           c.type === 'fix' ? chalk.yellow : chalk.gray;
          console.log(`  ${typeColor(c.type)}${c.scope ? chalk.gray(`(${c.scope})`) : ''}: ${c.description}`);
        });
      }
      
      process.exit(0);
    }
    
    const spinner = ora('Preparing release...').start();
    
    try {
      const shipOptions: ShipOptions = {
        bump: bump as 'patch' | 'minor' | 'major' | string,
        dryRun: options.dryRun,
        skipChangelog: options.skipChangelog,
        skipGitHub: options.skipGithub,
        skipTag: options.skipTag,
        repo: options.repo,
        branch: options.branch,
        preId: options.preid
      };
      
      if (options.dryRun) {
        spinner.text = chalk.yellow('Dry run mode - analyzing...');
      }
      
      const result = await ship(shipOptions);
      
      if (result.success) {
        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run complete - no changes made'));
        } else {
          spinner.succeed(chalk.green(`Released ${chalk.bold(result.version)}!`));
        }
        
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.bold('📦 Release Summary'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`Previous: ${chalk.gray(result.previousVersion)}`);
        console.log(`New:      ${chalk.green.bold(result.version)}`);
        console.log(`Tag:      ${chalk.cyan(result.tagName)}`);
        
        if (!options.dryRun) {
          console.log(chalk.gray('─'.repeat(50)));
          console.log(chalk.bold('✅ Completed Steps'));
          console.log(`  ${result.steps.versionBumped ? '✓' : '○'} Version bumped`);
          console.log(`  ${result.steps.changelogGenerated ? '✓' : '○'} Changelog generated`);
          console.log(`  ${result.steps.tagCreated ? '✓' : '○'} Git tag created`);
          console.log(`  ${result.steps.pushed ? '✓' : '○'} Pushed to remote`);
          console.log(`  ${result.steps.releaseCreated ? '✓' : '○'} GitHub release`);
        }
        
        if (result.changelog && options.dryRun) {
          console.log(chalk.gray('─'.repeat(50)));
          console.log(chalk.bold('📝 Changelog Preview'));
          console.log(chalk.gray(result.changelog.substring(0, 500) + '...'));
        }
        
        process.exit(0);
      } else {
        spinner.fail(chalk.red(`Release failed: ${result.error}`));
        
        if (result.steps.versionBumped || result.steps.changelogGenerated) {
          console.log(chalk.yellow('\n⚠️  Partial completion - check git status'));
        }
        
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();
