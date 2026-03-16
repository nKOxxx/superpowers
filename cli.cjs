#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');
const { resolve } = require('path');

program
  .name('superpowers')
  .description('OpenClaw Superpowers - AI-powered development workflows')
  .version('1.0.0');

program
  .command('browse')
  .description('Browser automation for visual testing')
  .argument('<url>', 'Target URL to test')
  .option('-v, --viewport <type>', 'Viewport: desktop, mobile, or both', 'both')
  .option('-f, --flows <names>', 'Comma-separated flow names to test')
  .option('-o, --output-dir <dir>', 'Output directory', './screenshots')
  .option('-t, --timeout <ms>', 'Timeout in ms', '30000')
  .action(async (url, options) => {
    const scriptPath = resolve(__dirname, 'dist/browse/browse.js');
    const args = [scriptPath, url, '--viewport', options.viewport];
    if (options.flows) args.push('--flows', options.flows);
    if (options.outputDir) args.push('--output-dir', options.outputDir);
    if (options.timeout) args.push('--timeout', options.timeout);
    execSync(`node ${args.join(' ')}`, { stdio: 'inherit' });
  });

program
  .command('qa')
  .description('Systematic testing based on code changes')
  .option('-m, --mode <mode>', 'Mode: targeted, smoke, full, deep', 'targeted')
  .option('-d, --diff <range>', 'Git diff range', 'HEAD~1')
  .option('-p, --repo-path <path>', 'Repository path', '.')
  .action(async (options) => {
    const scriptPath = resolve(__dirname, 'dist/qa/qa.js');
    const args = [scriptPath, '--mode', options.mode, '--diff', options.diff, '--repo-path', options.repoPath];
    execSync(`node ${args.join(' ')}`, { stdio: 'inherit' });
  });

program
  .command('ship')
  .description('One-command release pipeline')
  .requiredOption('-r, --repo <repo>', 'Repository (owner/repo)')
  .requiredOption('-v, --version <bump>', 'Version: patch, minor, major, or x.y.z')
  .option('-f, --force', 'Skip safety checks', false)
  .option('-s, --skip-tests', 'Skip tests', false)
  .option('--dry-run', 'Dry run', false)
  .option('-n, --notes <notes>', 'Release notes')
  .action(async (options) => {
    const scriptPath = resolve(__dirname, 'dist/ship/ship.js');
    const args = [scriptPath, '--repo', options.repo, '--version', options.version];
    if (options.force) args.push('--force');
    if (options.skipTests) args.push('--skip-tests');
    if (options.dryRun) args.push('--dry-run');
    if (options.notes) args.push('--notes', options.notes);
    execSync(`node ${args.join(' ')}`, { stdio: 'inherit' });
  });

program
  .command('plan-ceo-review')
  .description('Product strategy review with BAT framework')
  .argument('[question]', 'Question to evaluate')
  .option('-f, --feature <name>', 'Feature name')
  .option('-g, --goal <goal>', 'Business goal')
  .option('-p, --problem <problem>', 'Problem being solved')
  .option('--no-save', 'Skip saving to memory', false)
  .action(async (question, options) => {
    const scriptPath = resolve(__dirname, 'dist/plan-ceo-review/plan-ceo-review.js');
    const args = [scriptPath];
    if (question) args.push(question);
    if (options.feature) args.push('--feature', options.feature);
    if (options.goal) args.push('--goal', options.goal);
    if (options.problem) args.push('--problem', options.problem);
    if (!options.save) args.push('--no-save');
    execSync(`node ${args.join(' ')}`, { stdio: 'inherit' });
  });

program.parse();