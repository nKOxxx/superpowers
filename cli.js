#!/usr/bin/env node

const { Command } = require('commander');

// Simple spinner implementation
function createSpinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  let interval;
  let currentText = text;
  
  const spinner = {
    start: (newText) => {
      currentText = newText || text;
      process.stdout.write(`\r${frames[0]} ${currentText}`);
      interval = setInterval(() => {
        i = (i + 1) % frames.length;
        process.stdout.write(`\r${frames[i]} ${currentText}`);
      }, 80);
      return spinner;
    },
    stop: () => {
      if (interval) clearInterval(interval);
      process.stdout.write('\r');
      return spinner;
    },
    succeed: (msg) => {
      spinner.stop();
      console.log(`✓ ${msg || currentText}`);
      return spinner;
    },
    fail: (msg) => {
      spinner.stop();
      console.log(`✗ ${msg || currentText}`);
      return spinner;
    }
  };
  
  Object.defineProperty(spinner, 'text', {
    set: (val) => {
      currentText = val;
    },
    get: () => currentText
  });
  
  return spinner;
}

const program = new Command();

program
  .name('superpowers')
  .description('OpenClaw superpowers - Browser automation, QA, release pipeline, and product strategy')
  .version('1.0.0');

// Browse command
program
  .command('browse <url>')
  .description('Capture screenshots of web pages')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-w, --width <pixels>', 'Custom viewport width')
  .option('-h, --height <pixels>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .option('--wait-for <selector>', 'Wait for element before screenshot')
  .option('-a, --actions <actions>', 'Comma-separated actions (click:sel,wait:ms,scroll,hover:sel,screenshot)')
  .option('-t, --timeout <ms>', 'Navigation timeout', '30000')
  .action(async (url, options) => {
    const { BrowserSkill } = require('./dist/browse/index.js');
    const spinner = createSpinner('Launching browser...').start();
    const skill = new BrowserSkill();

    try {
      let viewport = options.viewport;
      if (options.width && options.height) {
        viewport = { width: parseInt(options.width), height: parseInt(options.height) };
      }

      spinner.text = 'Capturing screenshot...';
      const screenshots = await skill.screenshot({
        url,
        viewport,
        fullPage: options.fullPage,
        output: options.output,
        waitFor: options.waitFor,
        actions: options.actions,
        timeout: parseInt(options.timeout)
      });

      await skill.close();
      spinner.succeed(`Screenshot saved: ${screenshots[0]}`);
    } catch (error) {
      await skill.close();
      spinner.fail(error.message);
      process.exit(1);
    }
  });

// QA command
program
  .command('qa')
  .description('Run tests as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-d, --diff <range>', 'Git diff range for targeted mode', 'HEAD~1')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-p, --parallel', 'Run tests in parallel')
  .action(async (options) => {
    const { QASkill } = require('./dist/qa/index.js');
    const spinner = createSpinner('Detecting test framework...').start();
    const skill = new QASkill();

    try {
      const framework = await skill.detectFramework();
      spinner.text = `Running ${options.mode} tests with ${framework}...`;

      const { results, summary } = await skill.run({
        mode: options.mode,
        diff: options.diff,
        coverage: options.coverage,
        parallel: options.parallel
      });

      spinner.stop();
      console.log(summary);

      const failed = results.filter(r => r.status === 'failed').length;
      process.exit(failed > 0 ? 1 : 0);
    } catch (error) {
      spinner.fail(error.message);
      process.exit(1);
    }
  });

// Ship command
program
  .command('ship')
  .description('Release a new version')
  .requiredOption('--version <type>', 'Version bump (patch, minor, major, or explicit)')
  .option('-r, --repo <owner/repo>', 'Repository for GitHub release')
  .option('-d, --dry-run', 'Preview changes without executing')
  .option('-s, --skip-tests', 'Skip test run before release')
  .option('-n, --notes <text>', 'Custom release notes')
  .option('--prerelease', 'Mark as prerelease')
  .action(async (options) => {
    const { ShipSkill } = require('./dist/ship/index.js');
    const spinner = createSpinner('Preparing release...').start();
    const skill = new ShipSkill();

    try {
      spinner.text = 'Validating repository...';

      const result = await skill.ship({
        version: options.version,
        repo: options.repo,
        dryRun: options.dryRun,
        skipTests: options.skipTests,
        notes: options.notes,
        prerelease: options.prerelease
      });

      spinner.stop();

      if (options.dryRun) {
        console.log('\nDRY RUN - No changes made\n');
      } else {
        console.log(`\n✓ Released ${result.tag}\n`);
        console.log(`Commits: ${result.commits.length}`);
        console.log(`Pushed: ${result.pushed ? 'Yes' : 'No'}`);
        console.log(`GitHub Release: ${result.released ? 'Yes' : 'No'}`);
      }
    } catch (error) {
      spinner.fail(error.message);
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
  .option('--brand <score>', 'Brand score (0-5)', parseFloat)
  .option('--attention <score>', 'Attention score (0-5)', parseFloat)
  .option('--trust-score <score>', 'Trust score (0-5)', parseFloat)
  .action(async (options) => {
    const { PlanCEOReviewSkill } = require('./dist/plan-ceo-review/index.js');
    const skill = new PlanCEOReviewSkill();

    const result = skill.review({
      feature: options.feature,
      goal: options.goal,
      audience: options.audience,
      competition: options.competition,
      trust: options.trust,
      brand: options.brand,
      attention: options.attention,
      trustScore: options.trustScore
    });

    console.log(skill.formatOutput(result));
  });

program.parse();
