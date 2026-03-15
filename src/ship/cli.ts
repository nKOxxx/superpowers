#!/usr/bin/env node

import { Command } from 'commander';
import { ship, type VersionBump } from './index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package version
let version = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
  version = pkg.version;
} catch { /* ignore */ }

const program = new Command();

program
  .name('ship')
  .description('One-command release pipeline')
  .version(version)
  .requiredOption('-v, --version <version>', 'Version bump: patch, minor, major, or explicit (e.g., 1.2.3)')
  .option('-d, --dry-run', 'Preview changes without applying', false)
  .option('--skip-changelog', 'Skip changelog generation', false)
  .option('--skip-git', 'Skip git operations', false)
  .option('--skip-github', 'Skip GitHub release creation', false)
  .action(async (options) => {
    try {
      const versionOption = options.version;
      
      // Validate version input
      if (!['patch', 'minor', 'major'].includes(versionOption)) {
        // Check if it's a valid semver
        const semverRegex = /^\d+\.\d+\.\d+$/;
        if (!semverRegex.test(versionOption)) {
          console.error('Invalid version. Use: patch, minor, major, or explicit (e.g., 1.2.3)');
          process.exit(1);
        }
      }
      
      await ship({
        version: versionOption,
        dryRun: options.dryRun,
        skipChangelog: options.skipChangelog,
        skipGit: options.skipGit,
        skipGithub: options.skipGithub
      });
      
      process.exit(0);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();