#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { BrowseSkill, QASkill, ShipSkill, CEOReviewSkill } from './index.js';
import { QAMode, BrowseOptions, ShipOptions, CEORReviewOptions } from './types/index.js';

const program = new Command();

program
  .name('superpowers')
  .description('OpenClaw Superpowers - Browser, QA, Ship, and CEO Review')
  .version('1.0.0');

// Browse command
program
  .command('browse <url>')
  .description('Browser automation and screenshot capture')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-w, --width <pixels>', 'Custom viewport width')
  .option('-h, --height <pixels>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .option('--wait-for <selector>', 'Wait for element before screenshot')
  .option('--actions <actions>', 'Comma-separated actions')
  .option('--timeout <ms>', 'Navigation timeout', '30000')
  .option('--verbose', 'Verbose output')
  .action(async (url: string, options) => {
    try {
      const skill = new BrowseSkill(options.verbose);
      
      const browseOptions: BrowseOptions = {
        url,
        viewport: options.width && options.height 
          ? { width: parseInt(options.width), height: parseInt(options.height) }
          : options.viewport,
        fullPage: options.fullPage,
        outputDir: options.output,
        waitFor: options.waitFor,
        actions: options.actions ? BrowseSkill.parseActions(options.actions) : undefined,
        timeout: parseInt(options.timeout)
      };

      const screenshots = await skill.run(browseOptions);
      
      console.log(chalk.green('\n✓ Browse completed'));
      screenshots.forEach(s => console.log(chalk.gray(`  ${s}`)));
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// QA command
program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-d, --diff <range>', 'Git diff range for targeted mode', 'HEAD~1')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-p, --parallel', 'Run tests in parallel')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    try {
      const skill = new QASkill(options.verbose);
      
      const qaOptions = {
        mode: options.mode as QAMode,
        diffRange: options.diff,
        coverage: options.coverage,
        parallel: options.parallel
      };

      const results = await skill.run(qaOptions);
      
      const exitCode = results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Ship command
program
  .command('ship')
  .description('One-command release pipeline')
  .requiredOption('--version <type>', 'Version bump (patch, minor, major, or explicit)')
  .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
  .option('--dry-run', 'Preview changes without executing')
  .option('--skip-tests', 'Skip test run before release')
  .option('-n, --notes <text>', 'Custom release notes')
  .option('--prerelease', 'Mark as prerelease')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    try {
      const skill = new ShipSkill(options.verbose);
      
      const shipOptions: ShipOptions = {
        version: options.version,
        repo: options.repo,
        dryRun: options.dryRun,
        skipTests: options.skipTests,
        notes: options.notes,
        prerelease: options.prerelease
      };

      const result = await skill.run(shipOptions);
      
      if (!result.success) {
        console.error(chalk.red(`\n✗ Release failed: ${result.error}`));
        process.exit(1);
      }
      
      console.log(chalk.green(`\n✓ Released ${result.version}`));
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// CEO Review command
program
  .command('ceo-review')
  .description('Product strategy review using BAT framework')
  .requiredOption('-f, --feature <name>', 'Feature name')
  .option('-g, --goal <text>', 'Business goal')
  .option('-a, --audience <text>', 'Target audience')
  .option('-c, --competition <text>', 'Competitors')
  .option('-t, --trust <text>', 'Trust assets')
  .option('--brand <score>', 'Brand score (0-5)')
  .option('--attention <score>', 'Attention score (0-5)')
  .option('--trust-score <score>', 'Trust score (0-5)')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    try {
      const skill = new CEOReviewSkill(options.verbose);
      
      const reviewOptions: CEORReviewOptions = {
        feature: options.feature,
        goal: options.goal,
        audience: options.audience,
        competition: options.competition,
        trust: options.trust,
        brandScore: options.brand ? parseInt(options.brand) : undefined,
        attentionScore: options.attention ? parseInt(options.attention) : undefined,
        trustScore: options.trustScore ? parseInt(options.trustScore) : undefined
      };

      await skill.run(reviewOptions);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
