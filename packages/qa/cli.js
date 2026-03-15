#!/usr/bin/env node
import { program } from 'commander';
import { qa } from './dist/index.js';

program
  .name('qa')
  .description('Systematic testing with auto-detection')
  .version('1.0.0')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-f, --framework <framework>', 'Test framework: vitest, jest, mocha, auto')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('--changed', 'Run tests related to changed files', false)
  .option('--fail-fast', 'Stop on first failure', false)
  .argument('[files...]', 'Specific test files to run')
  .action(async (files, options) => {
    try {
      options.files = files.length > 0 ? files : undefined;
      const result = await qa(options);
      console.log(result.output);
      if (result.summary) {
        console.log('\n📊 Summary:');
        console.log(`  Framework: ${result.framework}`);
        console.log(`  Mode: ${result.mode}`);
        console.log(`  Passed: ${result.summary.passed}`);
        console.log(`  Failed: ${result.summary.failed}`);
        console.log(`  Skipped: ${result.summary.skipped}`);
        console.log(`  Duration: ${result.summary.duration}ms`);
      }
      process.exit(result.exitCode);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
