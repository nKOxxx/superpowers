#!/usr/bin/env node
import { ship } from './dist/index.js';
import { program } from 'commander';

program
  .name('ship')
  .description('One-command release pipeline')
  .version('1.0.0')
  .argument('<version>', 'Version bump: patch, minor, major, or explicit version')
  .option('-d, --dry-run', 'Preview without making changes', false)
  .option('--skip-changelog', 'Skip changelog update', false)
  .option('--skip-tag', 'Skip git tag creation', false)
  .option('--skip-release', 'Skip GitHub release', false)
  .option('-m, --message <msg>', 'Tag message')
  .action(async (version, opts) => {
    const result = await ship({ ...opts, version });
    process.exit(result.success ? 0 : 1);
  });

program.parse();