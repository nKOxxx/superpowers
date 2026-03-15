#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

// Read root package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8')
);

program
  .name('superpowers')
  .description('OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions')
  .version(packageJson.version);

// Import and register commands
async function main() {
  // Browse command
  const { browseCommand } = await import('./packages/browse/dist/index.js');
  program
    .command('browse <url>')
    .description('Browser automation with Playwright - capture screenshots and test flows')
    .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop) or custom WxH', 'desktop')
    .option('-f, --full-page', 'Capture full page screenshot')
    .option('-s, --selector <selector>', 'Capture specific element by CSS selector')
    .option('-a, --actions <json>', 'JSON array of actions to perform before capture')
    .option('-o, --output <path>', 'Output file path (defaults to stdout as base64)')
    .action(async (url, options) => {
      try {
        await browseCommand(url, options);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // QA command
  const { qaCommand } = await import('./packages/qa/dist/index.js');
  program
    .command('qa')
    .description('Systematic testing as QA Lead - targeted, smoke, or full regression')
    .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
    .option('-c, --coverage', 'Enable coverage reporting')
    .option('-w, --watch', 'Watch mode for development')
    .action(async (options) => {
      try {
        await qaCommand(options);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Ship command
  const { shipCommand } = await import('./packages/ship/dist/index.js');
  program
    .command('ship')
    .description('One-command release pipeline - version bump, changelog, tag, release')
    .requiredOption('-b, --bump <type>', 'Version bump: patch, minor, major, or explicit version')
    .option('-d, --dry-run', 'Preview changes without executing')
    .option('--skip-changelog', 'Skip changelog generation')
    .option('--skip-git', 'Skip git operations')
    .option('--skip-github', 'Skip GitHub release')
    .option('-m, --message <msg>', 'Custom release message')
    .option('-p, --prerelease <tag>', 'Prerelease tag (e.g., beta, alpha)')
    .action(async (options) => {
      try {
        const result = await shipCommand(options);
        if (result.dryRun) {
          console.log(chalk.blue('🔍 DRY RUN - No changes made'));
        }
        console.log(chalk.green(`📦 Version: ${result.version.current} → ${result.version.next}`));
        for (const step of result.steps) {
          const icon = step.success ? chalk.green('✅') : chalk.red('❌');
          console.log(`${icon} ${step.name}: ${step.output || ''}`);
        }
        if (!result.success) {
          console.error(chalk.red('Error:'), result.error);
          process.exit(1);
        }
        console.log(chalk.green('🚀 Release complete!'));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Plan CEO Review command
  const { planCEOReview } = await import('./packages/plan-ceo-review/dist/index.js');
  program
    .command('plan-ceo-review <question>')
    .description('BAT framework product strategy review - Brand, Attention, Trust scoring')
    .option('-a, --auto', 'Auto-generate BAT analysis')
    .option('-f, --format <format>', 'Output format: markdown, json, text', 'markdown')
    .option('-s, --save <file>', 'Save output to file')
    .action(async (question, options) => {
      try {
        const result = await planCEOReview({ ...options, question });
        console.log(result);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  program.parse();
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
});
