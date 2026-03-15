#!/usr/bin/env node
import { Command } from 'commander';
import { shipCommand } from './index.js';

const program = new Command();

program
  .name('superpowers-ship')
  .description('One-command release pipeline')
  .option('-v, --version <type>', 'Version bump (patch|minor|major|<semver>)', 'patch')
  .option('-d, --dry-run', 'Preview changes without applying')
  .option('--skip-push', 'Skip git push')
  .option('--skip-release', 'Skip GitHub release')
  .action(shipCommand);

program.parse();
