#!/usr/bin/env node
/**
 * Ship CLI - Command line interface for ship skill
 */

import { ShipSkill, type VersionBump } from '../src/index.js';
import { TelegramFormatter } from '@openclaw/superpowers-shared';

function parseArgs(args: string[]): Record<string, string | boolean | undefined> {
  const result: Record<string, string | boolean | undefined> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result[key] = nextArg;
        i++;
      } else {
        result[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      result[key] = true;
    } else if (!result.bump) {
      result.bump = arg;
    }
  }
  
  return result;
}

function showHelp(): void {
  console.log(`
Ship - One-command release pipeline

Usage: ship <version> [options]

Version:
  patch   Bug fixes, docs, chores (1.0.0 → 1.0.1)
  minor   New features (1.0.0 → 1.1.0)
  major   Breaking changes (1.0.0 → 2.0.0)

Options:
  --dry-run              Preview changes without applying
  --no-publish           Skip npm publish
  --no-github-release    Skip GitHub release
  --branch <name>        Target branch (default: main)
  --message <msg>        Custom release message
  --telegram             Output formatted for Telegram
  --help                 Show this help

Examples:
  ship patch
  ship minor --dry-run
  ship major --no-publish
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  if (!args.bump || !['patch', 'minor', 'major'].includes(args.bump as string)) {
    console.error('Error: Version bump (patch, minor, major) is required');
    showHelp();
    process.exit(1);
  }
  
  const skill = new ShipSkill();
  
  const options = {
    bump: args.bump as VersionBump,
    dryRun: args.dryRun === true,
    noPublish: args.noPublish === true,
    noGitHubRelease: args.noGithubRelease === true,
    branch: args.branch as string,
    message: args.message as string,
  };
  
  try {
    const result = await skill.ship(options);
    
    if (args.telegram) {
      const telegramResult = TelegramFormatter.formatShipResult(result);
      console.log(JSON.stringify(telegramResult, null, 2));
    } else {
      if (args.dryRun) {
        console.log('\n═══ DRY RUN ═══');
      } else {
        console.log('\n═══ Release Results ═══');
      }
      
      console.log(`Version: ${result.previousVersion} → ${result.newVersion}`);
      console.log(`Success: ${result.success ? 'Yes' : 'No'}`);
      
      if (result.changelog) {
        console.log(`\nChangelog:\n${result.changelog}`);
      }
      
      console.log('\nSteps:');
      for (const step of result.steps) {
        const status = step.success ? '✓' : '✗';
        console.log(`  ${status} ${step.step}${step.message ? `: ${step.message}` : ''}`);
      }
      
      if (result.errors.length > 0) {
        console.log(`\nErrors: ${result.errors.join(', ')}`);
      }
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Ship failed:', error);
    process.exit(1);
  }
}

main();
