#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runQa, detectFramework, getGitDiff, findRelatedTests, QaOptions } from './index.js';

const program = new Command();

program
  .name('superpowers-qa')
  .description('Systematic testing based on code changes')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('-u, --update-snapshot', 'Update snapshots', false)
  .option('--detect', 'Detect test framework only', false)
  .option('--diff', 'Show git diff analysis', false)
  .action(async (options: any) => {
    // Detect framework first
    const framework = detectFramework();
    
    if (options.detect) {
      console.log(chalk.bold('🔍 Test Framework Detection'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`Framework: ${framework !== null ? chalk.green(framework.name) : chalk.red('unknown')}`);
      process.exit(framework === null ? 1 : 0);
    }
    
    if (options.diff) {
      console.log(chalk.bold('📊 Git Diff Analysis'));
      console.log(chalk.gray('─'.repeat(40)));
      const diff = getGitDiff();
      
      if (diff.files.length === 0) {
        console.log(chalk.yellow('No changed files detected'));
      } else {
        console.log(chalk.cyan('Changed files:'));
        diff.files.forEach((f: string) => {
          const prefix = diff.added.includes(f) ? chalk.green('+') :
                        diff.deleted.includes(f) ? chalk.red('-') : chalk.yellow('~');
          console.log(`  ${prefix} ${f}`);
        });
        
        const related = findRelatedTests(diff.files);
        console.log(chalk.cyan('\nRelated test files:'));
        if (related.length === 0) {
          console.log(chalk.gray('  None found'));
        } else {
          related.forEach((t: { path: string }) => console.log(`  ${chalk.green('●')} ${t.path}`));
        }
      }
      process.exit(0);
    }
    
    if (framework === null) {
      console.error(chalk.red('❌ No test framework detected'));
      console.log(chalk.gray('Install one of: vitest, jest, or mocha'));
      process.exit(1);
    }
    
    const mode = options.mode as 'targeted' | 'smoke' | 'full';
    if (!['targeted', 'smoke', 'full'].includes(mode)) {
      console.error(chalk.red(`❌ Invalid mode: ${mode}`));
      console.log(chalk.gray('Valid modes: targeted, smoke, full'));
      process.exit(1);
    }
    
    console.log(chalk.cyan(`Running ${mode} tests with ${framework.name}...`));
    
    const qaOptions: QaOptions = {
      mode,
      coverage: options.coverage,
      watch: options.watch
    };
    
    try {
      const result = await runQa(qaOptions);
      
      if (result.success) {
        console.log(chalk.green('✔ Tests completed'));
        
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.bold('📋 Test Results'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`Framework: ${chalk.yellow(result.framework)}`);
        console.log(`Mode:      ${chalk.cyan(result.mode)}`);
        console.log(`Duration:  ${chalk.gray(`${(result.duration / 1000).toFixed(2)}s`)}`);
        
        process.exit(0);
      } else {
        console.log(chalk.red('✖ Tests failed'));
        
        if (result.error) {
          console.error(chalk.red(result.error));
        }
        
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();
