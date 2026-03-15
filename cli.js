#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('superpowers')
  .description('OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions')
  .version('1.0.0');

// Browse command
program
  .command('browse')
  .description('Browser automation with Playwright')
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <viewport>', 'Viewport preset (mobile, tablet, desktop) or custom WxH', 'desktop')
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-s, --selector <selector>', 'CSS selector to screenshot specific element')
  .option('-o, --output <path>', 'Output file path (saves as PNG)')
  .option('--base64', 'Output base64 encoded screenshot (default)')
  .action(async (url, options) => {
    try {
      const { browse } = require('./dist/browse/index.js');
      console.log(chalk.blue(`Browsing ${url}...`));
      
      const result = await browse({
        url,
        viewport: options.viewport,
        fullPage: options.fullPage,
        selector: options.selector,
        outputFormat: options.output ? 'file' : 'base64',
        outputPath: options.output,
      });

      if (result.success) {
        console.log(chalk.green(`✓ Screenshot captured in ${result.duration}ms`));
        if (result.filePath) {
          console.log(chalk.gray(`  Saved to: ${result.filePath}`));
        } else if (result.screenshot) {
          console.log(chalk.gray(`  Screenshot (base64): ${result.screenshot.substring(0, 50)}...`));
        }
      } else {
        console.error(chalk.red(`✗ Failed: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// QA command
program
  .command('qa')
  .description('Systematic testing as QA Lead')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, or full', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-w, --watch', 'Watch mode (if supported)')
  .action(async (options) => {
    try {
      const { runQA } = require('./dist/qa/index.js');
      console.log(chalk.blue(`Running ${options.mode} tests...`));
      
      const result = await runQA({
        mode: options.mode,
        coverage: options.coverage,
        watch: options.watch,
      });

      console.log(chalk[result.success ? 'green' : 'red'](`\n${result.framework} ${result.mode} tests: ${result.success ? 'PASSED' : 'FAILED'}`));
      console.log(chalk.gray(`  Duration: ${result.duration}ms`));
      if (result.testCount) console.log(chalk.gray(`  Tests: ${result.testCount}`));
      if (result.passedCount) console.log(chalk.gray(`  Passed: ${result.passedCount}`));
      if (result.failedCount) console.log(chalk.gray(`  Failed: ${result.failedCount}`));
      
      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Ship command
program
  .command('ship')
  .description('One-command release pipeline')
  .option('-v, --version <version>', 'Version bump: patch, minor, major, or explicit semver')
  .option('-d, --dry-run', 'Preview changes without applying')
  .option('--skip-changelog', 'Skip changelog generation')
  .option('--skip-git', 'Skip git operations')
  .option('--skip-github-release', 'Skip GitHub release creation')
  .action(async (options) => {
    try {
      const { ship } = require('./dist/ship/index.js');
      console.log(chalk.blue('Preparing release...'));
      
      const result = await ship({
        version: options.version,
        dryRun: options.dryRun,
        skipChangelog: options.skipChangelog,
        skipGit: options.skipGit,
        skipGithubRelease: options.skipGithubRelease,
      });

      if (result.success) {
        console.log(chalk.green(`\n✓ Release prepared: v${result.previousVersion} → v${result.newVersion}`));
        console.log(chalk.gray(`  Duration: ${result.duration}ms`));
        console.log(chalk.gray(`  Changes: ${result.changes.length} commits`));
        if (result.tagName) console.log(chalk.gray(`  Tag: ${result.tagName}`));
        if (result.githubReleaseUrl) console.log(chalk.gray(`  Release: ${result.githubReleaseUrl}`));
        
        if (options.dryRun) {
          console.log(chalk.yellow('\n(Dry run - no changes applied)'));
        }
      } else {
        console.error(chalk.red(`\n✗ Failed: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Plan CEO Review command
program
  .command('plan-ceo-review')
  .description('Product strategy review with BAT framework')
  .argument('<feature>', 'Feature name and description (e.g., "Feature Name: Description")')
  .option('-b, --brand <score>', 'Brand score (0-5)', parseFloat)
  .option('-a, --attention <score>', 'Attention score (0-5)', parseFloat)
  .option('-t, --trust <score>', 'Trust score (0-5)', parseFloat)
  .option('--auto-score', 'Auto-calculate scores based on feature description')
  .option('--json', 'Output as JSON')
  .action(async (feature, options) => {
    try {
      const { planCEOReview, formatReviewOutput } = require('./dist/plan-ceo-review/index.js');
      
      // Parse feature name and description
      const [featureName, ...descParts] = feature.split(':');
      const description = descParts.join(':').trim();
      
      const result = await planCEOReview({
        featureName: featureName.trim(),
        description,
        brand: options.brand,
        attention: options.attention,
        trust: options.trust,
        autoScore: options.autoScore,
      });

      if (result.success) {
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatReviewOutput(result));
        }
      } else {
        console.error(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();