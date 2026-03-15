#!/usr/bin/env node
/**
 * Superpowers CLI - OpenClaw AI-driven development workflows
 */

import { run as runBrowse } from './dist/browse/index.js';
import { run as runQA } from './dist/qa/index.js';
import { run as runShip } from './dist/ship/index.js';
import { run as runCEOReview } from './dist/plan-ceo-review/index.js';

const COMMANDS = {
  browse: runBrowse,
  qa: (args) => runQA(args, process.cwd()),
  ship: (args) => runShip(args, process.cwd()),
  'plan-ceo-review': runCEOReview,
  'ceo-review': runCEOReview
};

async function main() {
  const [, , command, ...args] = process.argv;
  
  if (!command || command === '--help' || command === '-h') {
    console.log(`
Superpowers - OpenClaw AI-driven development workflows

Usage: npx @nko/superpowers <command> [options]

Commands:
  browse <url>           Browser automation with Playwright
    --viewport=mobile|tablet|desktop
    --full-page
    --wait-for=<selector|ms>

  qa [--mode=targeted]   Systematic testing
    --mode=targeted|smoke|full
    --coverage
    --pattern=<glob>

  ship [--version=patch] Release pipeline
    --version=patch|minor|major|<semver>
    --dry-run
    --skip-tests
    --skip-changelog

  plan-ceo-review "desc" Product strategy (BAT framework)
    --brand=0-5
    --attention=0-5
    --trust=0-5

Options:
  -h, --help             Show this help message
  -v, --version          Show version
`);
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    console.log('1.0.0');
    process.exit(0);
  }

  const handler = COMMANDS[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  try {
    const result = await handler(args);
    console.log(result.message);
    if (result.data) {
      console.log('\n📊 Data:', JSON.stringify(result.data, null, 2));
    }
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
