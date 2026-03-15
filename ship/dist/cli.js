#!/usr/bin/env node

import { program } from 'commander';
import { shipCommand } from './index.js';

program
  .name('ship')
  .description('One-command release pipeline')
  .version('1.0.0');

program
  .option('-b, --bump <type>', 'Version bump type (patch, minor, major) or explicit version', 'patch')
  .option('-d, --dry-run', 'Preview changes without applying', false)
  .option('--skip-tag', 'Skip git tag creation', false)
  .option('--skip-push', 'Skip git push', false)
  .option('--skip-release', 'Skip GitHub release', false)
  .option('--no-changelog', 'Skip changelog generation', false)
  .action((options) => {
    // Map bump to version for the shipCommand
    const shipOptions = {
      ...options,
      version: options.bump
    };
    shipCommand(shipOptions);
  });

program.parse();
