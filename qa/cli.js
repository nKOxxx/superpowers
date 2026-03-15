#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runTests, detectFramework, getChangedFiles, mapToTestFiles } from './dist/index.js';

const program = new Command();

program
  .name('qa')
  .description('Systematic testing as QA Lead')
  .option('--mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('--coverage', 'Enable coverage reporting')
  .option('--files <files>', 'Comma-separated test files')
  .option('--watch', 'Watch mode (if supported)')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🧪 QA Testing Mode:'), options.mode);
      
      const framework = detectFramework();
      console.log(chalk.gray('Framework detected:'), framework);
      
      if (options.mode === 'targeted' && !options.files) {
        const changedFiles = getChangedFiles();
        console.log(chalk.gray('Changed files:'), changedFiles.length);
        
        const testFiles = mapToTestFiles(changedFiles);
        console.log(chalk.gray('Mapped test files:'), testFiles.length);
        
        if (testFiles.length > 0) {
          console.log(chalk.gray('Tests to run:'), testFiles.join(', '));
        }
      }
      
      const qaOptions = {
        mode: options.mode,
        coverage: options.coverage,
        files: options.files,
        watch: options.watch
      };
      
      console.log(chalk.blue('\n▶️ Running tests...\n'));
      
      const result = runTests(qaOptions);
      
      console.log(result.output);
      console.log(chalk.blue('\n📊 Summary:'));
      console.log(result.summary);
      
      if (result.exitCode !== 0) {
        process.exit(result.exitCode);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();