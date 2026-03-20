#!/usr/bin/env node
/**
 * Ship CLI script - /ship command handler
 */

import { ShipSkill, type ShipOptions, type ShipResult, type VersionBump } from '../src/index.js';
import { parseArgs, ConsoleLogger } from '@openclaw/superpowers-shared';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const logger = new ConsoleLogger(args.verbose ? 'debug' : 'info');

  if (args.help || !args._) {
    console.log('Usage: ship <version>');
    console.log('');
    console.log('Version:');
    console.log('  patch    Bug fixes, docs, chores (1.0.0 → 1.0.1)');
    console.log('  minor    New features (1.0.0 → 1.1.0)');
    console.log('  major    Breaking changes (1.0.0 → 2.0.0)');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run              Preview changes without applying');
    console.log('  --no-publish           Skip npm publish');
    console.log('  --no-github-release    Skip GitHub release');
    console.log('  --branch <name>        Target branch (default: main)');
    console.log('  --message <msg>        Custom release message');
    console.log('  --verbose              Enable verbose logging');
    process.exit(args.help ? 0 : 1);
  }

  const bump = args._ as string;
  if (!['patch', 'minor', 'major'].includes(bump)) {
    console.error(`Error: Invalid version type "${bump}". Use: patch, minor, or major`);
    process.exit(1);
  }

  const options: ShipOptions = {
    bump: bump as VersionBump,
    dryRun: !!args['dry-run'],
    noPublish: !!args['no-publish'],
    noGitHubRelease: !!args['no-github-release'],
    branch: args.branch as string,
    message: args.message as string
  };

  logger.info(`Starting ship: ${bump} release`);

  const skill = new ShipSkill(process.cwd(), logger);
  const result = await skill.ship(options);

  // Output results
  console.log('');
  console.log('═══ Release Results ═══');
  console.log(`Status:      ${result.success ? '\x1b[32m✓ SUCCESS\x1b[0m' : '\x1b[31m✗ FAILED\x1b[0m'}`);
  console.log(`Previous:    v${result.previousVersion}`);
  console.log(`New:         v${result.newVersion}`);
  console.log('');

  if (result.steps.length > 0) {
    console.log('═══ Steps ═══');
    for (const step of result.steps) {
      const icon = step.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      const message = step.message ? ` (${step.message})` : '';
      console.log(`  ${icon} ${step.step}${message}`);
    }
  }

  if (result.commits.length > 0) {
    console.log('');
    console.log('═══ Commits ═══');
    for (const commit of result.commits.slice(0, 10)) {
      const scope = commit.scope ? `\x1b[36m(${commit.scope})\x1b[0m ` : '';
      const breaking = commit.breaking ? ' \x1b[31m[breaking]\x1b[0m' : '';
      console.log(`  ${commit.type}: ${scope}${commit.description}${breaking}`);
    }
    if (result.commits.length > 10) {
      console.log(`  ... and ${result.commits.length - 10} more`);
    }
  }

  if (result.changelog && options.dryRun) {
    console.log('');
    console.log('═══ Changelog ═══');
    console.log(result.changelog);
  }

  if (result.errors.length > 0) {
    console.log('');
    console.log('═══ Errors ═══');
    for (const error of result.errors) {
      console.log(`  \x1b[31m✗ ${error}\x1b[0m`);
    }
  }

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});