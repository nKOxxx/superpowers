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
  .version('1.0.1');

// Browse command
program
  .command('browse <url>')
  .description('Capture screenshots of web pages')
  .option('-v, --viewport <preset>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-w, --width <pixels>', 'Custom viewport width')
  .option('-h, --height <pixels>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-e, --element <selector>', 'Capture specific element')
  .option('-o, --output <path>', 'Output file path')
  .option('--wait-for <selector>', 'Wait for element before screenshot')
  .option('-a, --actions <json>', 'Action sequence as JSON array')
  .option('-t, --timeout <ms>', 'Timeout in milliseconds', '30000')
  .option('--base64', 'Output as base64')
  .action(async (url, options) => {
    const { browseCommand } = await import('./browse/dist/index.js');
    
    try {
      await browseCommand(url, {
        viewport: options.viewport,
        width: options.width,
        height: options.height,
        fullPage: options.fullPage,
        selector: options.element,
        output: options.output,
        waitFor: options.waitFor,
        actions: options.actions,
        timeout: options.timeout,
        base64: options.base64
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// QA command
program
  .command('qa')
  .description('Run tests as QA Lead')
  .option('-m, --mode <mode>', 'Test mode (targeted, smoke, full)', 'targeted')
  .option('-c, --coverage', 'Enable coverage reporting')
  .option('-f, --framework <framework>', 'Test framework (vitest, jest, mocha)')
  .option('--ci', 'CI mode (non-interactive)')
  .option('--watch', 'Watch mode')
  .action(async (options) => {
    const { qaCommand } = await import('./qa/dist/index.js');
    
    try {
      await qaCommand({
        mode: options.mode,
        coverage: options.coverage,
        framework: options.framework,
        ci: options.ci,
        watch: options.watch
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Ship command
program
  .command('ship')
  .description('Release a new version')
  .requiredOption('--version <type>', 'Version bump (patch, minor, major, or explicit)')
  .option('-d, --dry-run', 'Preview changes without executing')
  .option('--no-changelog', 'Skip changelog generation')
  .option('--no-tag', 'Skip git tag creation')
  .option('--no-release', 'Skip GitHub release creation')
  .option('-r, --repo <repo>', 'GitHub repository (owner/repo)')
  .action(async (options) => {
    const { shipCommand } = await import('./ship/dist/index.js');
    
    try {
      await shipCommand({
        version: options.version,
        dryRun: options.dryRun,
        changelog: options.changelog,
        tag: options.tag,
        release: options.release,
        repo: options.repo
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// CEO Review command
program
  .command('plan-ceo-review <feature>')
  .description('Product strategy review using BAT framework')
  .option('-b, --brand <score>', 'Brand score (0-5)', '0')
  .option('-a, --attention <score>', 'Attention score (0-5)', '0')
  .option('-t, --trust <score>', 'Trust score (0-5)', '0')
  .option('--json', 'Output as JSON')
  .option('--auto', 'Auto-calculate scores')
  .action(async (feature, options) => {
    const { reviewCommand } = await import('./plan-ceo-review/dist/index.js');
    
    try {
      await reviewCommand(feature, {
        brand: parseFloat(options.brand) || 0,
        attention: parseFloat(options.attention) || 0,
        trust: parseFloat(options.trust) || 0,
        json: options.json,
        auto: options.auto
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
