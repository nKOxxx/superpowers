#!/usr/bin/env node

const { program } = require('commander');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const packageJson = require('./package.json');

program
  .name('superpowers')
  .description('AI-powered workflows for development, testing, and product decisions')
  .version(packageJson.version);

// Helper to run a skill via node
function runSkill(skillName, extraArgs = []) {
  const skillPath = path.join(__dirname, 'skills', skillName, 'dist', 'index.js');
  
  if (!fs.existsSync(skillPath)) {
    console.error(`Error: Skill '${skillName}' not found at ${skillPath}`);
    console.error('Please run: npm run build');
    process.exit(1);
  }

  // Run the skill as a separate node process
  const proc = spawn('node', [skillPath, ...extraArgs], {
    stdio: 'inherit',
    env: process.env
  });

  proc.on('exit', (code) => {
    process.exit(code || 0);
  });
}

// Browse command
program
  .command('browse <url>')
  .description('Browser automation for visual testing and QA')
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-e, --element <selector>', 'Capture specific element')
  .option('-v, --viewport <preset>', 'Viewport preset: mobile, tablet, desktop', 'desktop')
  .option('-w, --width <pixels>', 'Custom viewport width')
  .option('--height <pixels>', 'Custom viewport height')
  .option('-a, --actions <json>', 'Action sequence as JSON array')
  .option('--wait-for <selector>', 'Wait for element before screenshot')
  .option('--base64', 'Output as base64 for Telegram')
  .option('-o, --output <path>', 'Output file path')
  .option('--timeout <ms>', 'Timeout in milliseconds', '30000')
  .action((url, options) => {
    const args = [url];
    if (options.fullPage) args.push('--full-page');
    if (options.element) args.push('--element', options.element);
    if (options.viewport) args.push('--viewport', options.viewport);
    if (options.width) args.push('--width', options.width);
    if (options.height) args.push('--height', options.height);
    if (options.actions) args.push('--actions', options.actions);
    if (options.waitFor) args.push('--wait-for', options.waitFor);
    if (options.base64) args.push('--base64');
    if (options.output) args.push('--output', options.output);
    if (options.timeout) args.push('--timeout', options.timeout);
    runSkill('browse', args);
  });

// QA command
program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-f, --framework <framework>', 'Test framework: vitest, jest, mocha')
  .option('--ci', 'CI mode (non-interactive)')
  .option('--watch', 'Watch mode')
  .action((options) => {
    const args = [];
    if (options.mode) args.push('--mode', options.mode);
    if (options.coverage) args.push('--coverage');
    if (options.framework) args.push('--framework', options.framework);
    if (options.ci) args.push('--ci');
    if (options.watch) args.push('--watch');
    runSkill('qa', args);
  });

// Ship command
program
  .command('ship')
  .description('One-command release pipeline')
  .option('-v, --version <type>', 'Version bump: patch, minor, major, or explicit x.y.z', 'patch')
  .option('-d, --dry-run', 'Preview changes without executing')
  .option('--no-changelog', 'Skip changelog generation')
  .option('--no-tag', 'Skip git tag creation')
  .option('--no-release', 'Skip GitHub release creation')
  .option('--repo <repo>', 'GitHub repository (owner/repo)')
  .action((options) => {
    const args = [];
    if (options.version) args.push('--version', options.version);
    if (options.dryRun) args.push('--dry-run');
    if (options.changelog === false) args.push('--no-changelog');
    if (options.tag === false) args.push('--no-tag');
    if (options.release === false) args.push('--no-release');
    if (options.repo) args.push('--repo', options.repo);
    runSkill('ship', args);
  });

// Plan CEO Review command
program
  .command('plan-ceo-review <feature>')
  .description('BAT framework for product decisions')
  .option('-b, --brand <score>', 'Brand score (0-5)', '0')
  .option('-a, --attention <score>', 'Attention score (0-5)', '0')
  .option('-t, --trust <score>', 'Trust score (0-5)', '0')
  .option('--json', 'Output as JSON')
  .action((feature, options) => {
    const args = [feature];
    if (options.brand) args.push('--brand', options.brand);
    if (options.attention) args.push('--attention', options.attention);
    if (options.trust) args.push('--trust', options.trust);
    if (options.json) args.push('--json');
    runSkill('plan-ceo-review', args);
  });

program.parse();