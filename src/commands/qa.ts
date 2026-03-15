import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { 
  isGitRepo, 
  getChangedFiles, 
  mapToTestFiles, 
  detectTestFramework 
} from '../lib/git.js';
import type { QAOptions, QAMode } from '../types/index.js';

export const qaCommand = new Command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-d, --diff <range>', 'Git diff range for targeted mode', 'HEAD~1')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-p, --parallel', 'Run tests in parallel')
  .action(async (options: QAOptions) => {
    console.log(chalk.blue('══════════════════════════════════════════════════'));
    console.log(chalk.blue('QA Mode: ' + (options.mode?.toUpperCase() || 'TARGETED')));
    console.log(chalk.blue('══════════════════════════════════════════════════\n'));
    
    try {
      // Validate git repo
      if (!isGitRepo()) {
        console.error(chalk.red('✗ Not a git repository'));
        process.exit(1);
      }
      
      // Detect test framework
      const framework = detectTestFramework();
      if (!framework) {
        console.error(chalk.red('✗ No test framework detected (vitest, jest, or mocha required)'));
        process.exit(1);
      }
      console.log(chalk.gray(`Framework: ${framework}\n`));
      
      // Determine tests to run
      let testFiles: string[] = [];
      let testCommand = '';
      
      switch (options.mode) {
        case 'targeted':
          const changedFiles = getChangedFiles(options.diff);
          console.log(chalk.blue('Files Changed:'));
          for (const file of changedFiles.slice(0, 10)) {
            console.log(chalk.gray(`  - ${file}`));
          }
          if (changedFiles.length > 10) {
            console.log(chalk.gray(`  ... and ${changedFiles.length - 10} more`));
          }
          
          testFiles = mapToTestFiles(changedFiles);
          console.log(chalk.blue(`\nTests Selected: ${testFiles.length}`));
          for (const file of testFiles) {
            console.log(chalk.gray(`  - ${file}`));
          }
          
          if (testFiles.length === 0) {
            console.log(chalk.yellow('\n⚠ No tests found for changed files'));
            console.log(chalk.gray('Running smoke tests instead...\n'));
            options.mode = 'smoke';
          }
          break;
          
        case 'smoke':
          console.log(chalk.blue('Running smoke tests...\n'));
          break;
          
        case 'full':
          console.log(chalk.blue('Running full test suite...\n'));
          break;
      }
      
      // Build test command
      switch (framework) {
        case 'vitest':
          if (options.mode === 'targeted' && testFiles.length > 0) {
            testCommand = `npx vitest run ${testFiles.join(' ')}`;
          } else if (options.mode === 'smoke') {
            testCommand = 'npx vitest run --reporter=verbose -t "smoke|basic|critical"';
          } else {
            testCommand = 'npx vitest run';
          }
          if (options.coverage) testCommand += ' --coverage';
          break;
          
        case 'jest':
          if (options.mode === 'targeted' && testFiles.length > 0) {
            testCommand = `npx jest ${testFiles.join(' ')}`;
          } else if (options.mode === 'smoke') {
            testCommand = 'npx jest --testNamePattern="smoke|basic|critical"';
          } else {
            testCommand = 'npx jest';
          }
          if (options.coverage) testCommand += ' --coverage';
          break;
          
        case 'mocha':
          if (options.mode === 'targeted' && testFiles.length > 0) {
            testCommand = `npx mocha ${testFiles.join(' ')}`;
          } else {
            testCommand = 'npx mocha';
          }
          break;
      }
      
      // Run tests
      console.log(chalk.blue('Running tests...\n'));
      const startTime = Date.now();
      
      try {
        execSync(testCommand, { stdio: 'inherit' });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(chalk.blue('\n──────────────────────────────────────────────────'));
        console.log(chalk.green('Status: PASSED'));
        console.log(chalk.gray(`Duration: ${duration}s`));
        console.log(chalk.blue('══════════════════════════════════════════════════'));
      } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(chalk.blue('\n──────────────────────────────────────────────────'));
        console.log(chalk.red('Status: FAILED'));
        console.log(chalk.gray(`Duration: ${duration}s`));
        console.log(chalk.blue('══════════════════════════════════════════════════'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
