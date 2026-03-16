#!/usr/bin/env node
import { Command } from 'commander';
import { program as browseProgram } from './browse/index.js';
import { program as qaProgram } from './qa/index.js';
import { program as shipProgram } from './ship/index.js';
import { program as ceoProgram } from './plan-ceo-review/index.js';

const program = new Command();

program
  .name('superpowers')
  .description('OpenClaw superpowers - Browser automation, QA testing, releases, and product strategy')
  .version('1.0.0');

// Add subcommands
program.addCommand(browseProgram);
program.addCommand(qaProgram);
program.addCommand(shipProgram);
program.addCommand(ceoProgram);

// Aliases
program
  .command('browse <url>')
  .description('Quick screenshot (alias for browse screenshot)')
  .option('--viewport <preset>', 'Viewport: desktop, mobile, tablet', 'desktop')
  .option('--full-page', 'Capture full page')
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .action(async (url, options) => {
    const { takeScreenshot, closeBrowser } = await import('./browse/browser.js');
    await takeScreenshot({
      url,
      viewport: options.viewport,
      fullPage: options.fullPage,
      outputDir: options.output
    });
    await closeBrowser();
  });

program
  .command('qa')
  .description('Run tests (alias for qa run)')
  .option('-m, --mode <mode>', 'Test mode', 'targeted')
  .option('-c, --coverage', 'Generate coverage')
  .action(async (options) => {
    const { runTests } = await import('./qa/runner.js');
    const success = await runTests({
      mode: options.mode,
      coverage: options.coverage
    });
    process.exit(success ? 0 : 1);
  });

program
  .command('ship <bump>')
  .description('Release a new version (alias for ship release)')
  .option('-n, --dry-run', 'Preview only')
  .option('--skip-tests', 'Skip tests')
  .action(async (bump, options) => {
    const { release } = await import('./ship/releaser.js');
    const success = await release({
      bump,
      dryRun: options.dryRun,
      skipTests: options.skipTests
    });
    process.exit(success ? 0 : 1);
  });

program
  .command('ceo-review <feature>')
  .description('Evaluate a feature (alias for plan-ceo-review review)')
  .option('-a, --audience <audience>', 'Target audience')
  .action(async (feature, options) => {
    const { analyzeFeature, formatReview } = await import('./plan-ceo-review/framework.js');
    const result = analyzeFeature(feature, options.audience);
    console.log(formatReview(result));
  });

program.parse();
