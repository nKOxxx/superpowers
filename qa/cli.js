#!/usr/bin/env node
import { runTests } from './dist/index.js';
import { program } from 'commander';

program
  .name('qa')
  .description('Systematic testing as QA Lead')
  .version('1.0.0')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-w, --watch', 'Watch mode', false)
  .option('-f, --framework <fw>', 'Test framework: vitest, jest, mocha')
  .action(async (opts) => {
    const result = await runTests(opts);
    process.exit(result.success ? 0 : 1);
  });

program.parse();