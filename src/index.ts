/**
 * Superpowers - OpenClaw AI-driven development workflows
 * Main entry point
 */

export { BrowseSkill, run as runBrowse } from './browse/index.js';
export { QASkill, run as runQA } from './qa/index.js';
export { ShipSkill, run as runShip } from './ship/index.js';
export { CEOReviewSkill, run as runCEOReview } from './plan-ceo-review/index.js';
export * from './types.js';
export * from './utils.js';

// CLI dispatcher
import { run as runBrowse } from './browse/index.js';
import { run as runQA } from './qa/index.js';
import { run as runShip } from './ship/index.js';
import { run as runCEOReview } from './plan-ceo-review/index.js';
import type { SkillResult } from './types.js';

const COMMANDS: Record<string, (args: string[]) => Promise<SkillResult>> = {
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
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if called directly
main();
