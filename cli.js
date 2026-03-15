#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('superpowers')
  .description('OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions')
  .version('1.0.0');

// Helper to run skill CLI
function runSkill(skillName, args) {
  const skillPath = join(__dirname, 'skills', skillName, 'dist', 'cli.js');
  try {
    execSync(`node "${skillPath}" ${args.join(' ')}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    process.exit(1);
  }
}

program
  .command('browse <url>')
  .description('Browser automation for visual testing and QA')
  .option('-v, --viewport <preset>', 'Viewport preset: mobile, tablet, desktop', 'desktop')
  .option('-w, --width <width>', 'Custom viewport width')
  .option('-h, --height <height>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-s, --selector <selector>', 'Capture specific element only')
  .option('-o, --output <path>', 'Save screenshot to file path')
  .option('-t, --timeout <ms>', 'Navigation timeout in ms', '30000')
  .option('-a, --action <action>', 'Action sequence')
  .action((url, options) => {
    const args = [url];
    if (options.viewport) args.push('--viewport', options.viewport);
    if (options.width) args.push('--width', options.width);
    if (options.height) args.push('--height', options.height);
    if (options.fullPage) args.push('--full-page');
    if (options.selector) args.push('--selector', options.selector);
    if (options.output) args.push('--output', options.output);
    if (options.timeout) args.push('--timeout', options.timeout);
    if (options.action) args.push('--action', options.action);
    runSkill('browse', args);
  });

program
  .command('qa')
  .description('Systematic testing based on code changes')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('-u, --update-snapshot', 'Update snapshots', false)
  .option('--detect', 'Detect test framework only', false)
  .option('--diff', 'Show git diff analysis', false)
  .action((options) => {
    const args = [];
    if (options.mode) args.push('--mode', options.mode);
    if (options.coverage) args.push('--coverage');
    if (options.verbose) args.push('--verbose');
    if (options.updateSnapshot) args.push('--update-snapshot');
    if (options.detect) args.push('--detect');
    if (options.diff) args.push('--diff');
    runSkill('qa', args);
  });

program
  .command('ship [bump]')
  .description('One-command release pipeline')
  .option('-r, --repo <repo>', 'GitHub repository (owner/repo)')
  .option('-b, --branch <branch>', 'Target branch')
  .option('--dry-run', 'Preview changes without applying', false)
  .option('--skip-changelog', 'Skip changelog generation', false)
  .option('--skip-github', 'Skip GitHub release', false)
  .option('--skip-tag', 'Skip git tag creation', false)
  .option('--analyze', 'Analyze commits and suggest version bump', false)
  .action((bump, options) => {
    const args = [];
    if (bump) args.push(bump);
    if (options.repo) args.push('--repo', options.repo);
    if (options.branch) args.push('--branch', options.branch);
    if (options.dryRun) args.push('--dry-run');
    if (options.skipChangelog) args.push('--skip-changelog');
    if (options.skipGithub) args.push('--skip-github');
    if (options.skipTag) args.push('--skip-tag');
    if (options.analyze) args.push('--analyze');
    runSkill('ship', args);
  });

program
  .command('plan-ceo-review <feature>')
  .description('Product strategy review with BAT framework')
  .option('-b, --brand <score>', 'Brand score (0-5)', '3')
  .option('-a, --attention <score>', 'Attention score (0-5)', '3')
  .option('-t, --trust <score>', 'Trust score (0-5)', '3')
  .option('--auto', 'Auto-calculate scores', false)
  .option('--context <text>', 'Additional context for auto-scoring')
  .option('--criteria', 'Show BAT scoring criteria', false)
  .option('--json', 'Output as JSON', false)
  .action((feature, options) => {
    const args = [feature];
    if (options.brand) args.push('--brand', options.brand);
    if (options.attention) args.push('--attention', options.attention);
    if (options.trust) args.push('--trust', options.trust);
    if (options.auto) args.push('--auto');
    if (options.context) args.push('--context', options.context);
    if (options.criteria) args.push('--criteria');
    if (options.json) args.push('--json');
    runSkill('plan-ceo-review', args);
  });

// Add alias
program
  .command('review <feature>')
  .description('Alias for plan-ceo-review')
  .action((feature) => {
    runSkill('plan-ceo-review', [feature]);
  });

program.parse();
