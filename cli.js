#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');

// Import skills (compiled JS)
const { BrowseSkill } = require('./dist/browse');
const { QASkill } = require('./dist/qa');
const { ShipSkill } = require('./dist/ship');
const { PlanCEOReviewSkill } = require('./dist/plan-ceo-review');

program
  .name('superpowers')
  .description('OpenClaw Superpowers - AI-powered workflows for development, testing, and product decisions')
  .version('1.0.0');

// Browse command
program
  .command('browse <url>')
  .description('Capture screenshots with browser automation')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop) or WxH', 'desktop')
  .option('-f, --full-page', 'Capture full page')
  .option('-s, --selector <selector>', 'Capture specific element')
  .option('-o, --output <path>', 'Output file path')
  .action(async (url, options) => {
    console.log(chalk.blue('🌐 Browse: Capturing screenshot...'));
    
    const skill = new BrowseSkill();
    try {
      await skill.init();
      
      const result = await skill.captureScreenshot({
        url,
        viewport: options.viewport,
        fullPage: options.fullPage,
        selector: options.selector,
        outputPath: options.output,
      });
      
      console.log(chalk.green('✅ Screenshot captured!'));
      console.log(chalk.gray(`   Saved to: ${result.path}`));
      console.log(chalk.gray(`   Base64 length: ${result.base64.length} chars`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    } finally {
      await skill.close();
    }
  });

// QA command
program
  .command('qa')
  .description('Run systematic tests as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-c, --coverage', 'Generate coverage report')
  .option('-p, --path <path>', 'Specific test path')
  .action(async (options) => {
    console.log(chalk.blue('🧪 QA: Running tests...'));
    
    const skill = new QASkill();
    try {
      const result = await skill.runTests({
        mode: options.mode,
        coverage: options.coverage,
        testPath: options.path,
      });
      
      if (result.success) {
        console.log(chalk.green(`✅ Tests passed! (${result.testsPassed} passed)`));
      } else {
        console.log(chalk.red(`❌ Tests failed! (${result.testsFailed} failed, ${result.testsPassed} passed)`));
      }
      console.log(chalk.gray(`   Framework: ${result.framework}`));
      console.log(chalk.gray(`   Duration: ${result.duration}ms`));
      
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Ship command
program
  .command('ship')
  .description('One-command release pipeline')
  .option('-v, --version <bump>', 'Version bump (patch, minor, major) or explicit version', 'patch')
  .option('-d, --dry-run', 'Preview changes without applying')
  .option('--skip-changelog', 'Skip changelog generation')
  .option('--skip-tag', 'Skip git tag creation')
  .option('--skip-release', 'Skip GitHub release creation')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Ship: Preparing release...'));
    
    const skill = new ShipSkill();
    try {
      const result = await skill.release({
        version: options.version,
        dryRun: options.dryRun,
        skipChangelog: options.skipChangelog,
        skipTag: options.skipTag,
        skipRelease: options.skipRelease,
      });
      
      if (result.dryRun) {
        console.log(chalk.yellow('📝 Dry run mode - no changes made'));
        console.log(chalk.gray(`   Version: ${result.version}`));
        console.log(chalk.gray(`   Changelog:\n${result.changelog}`));
      } else {
        console.log(chalk.green(`✅ Released v${result.version}!`));
        if (result.tag) console.log(chalk.gray(`   Tag: ${result.tag}`));
        if (result.releaseUrl) console.log(chalk.gray(`   Release: ${result.releaseUrl}`));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Plan CEO Review command
program
  .command('plan-ceo-review <feature>')
  .description('Product strategy review using BAT framework')
  .option('-b, --brand <score>', 'Brand score (0-5)', parseInt)
  .option('-a, --attention <score>', 'Attention score (0-5)', parseInt)
  .option('-t, --trust <score>', 'Trust score (0-5)', parseInt)
  .option('--auto', 'Auto-calculate scores from keywords')
  .option('-d, --description <text>', 'Feature description')
  .action(async (feature, options) => {
    console.log(chalk.blue('📊 CEO Review: Analyzing feature...'));
    
    const skill = new PlanCEOReviewSkill();
    try {
      const scores = options.brand !== undefined ? {
        brand: options.brand,
        attention: options.attention || 0,
        trust: options.trust || 0,
      } : undefined;

      const result = await skill.review({
        feature,
        description: options.description,
        scores,
        autoScore: options.auto,
      });
      
      console.log('');
      console.log(skill.formatReview(result));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();
