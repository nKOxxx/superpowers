#!/usr/bin/env node
import { Command } from 'commander';
import { BrowseSkill } from './index.js';
import chalk from 'chalk';

const program = new Command();
const skill = new BrowseSkill();

program
  .name('browse')
  .description('Browser automation with Playwright')
  .version('1.0.0');

program
  .command('screenshot <url>')
  .description('Take a screenshot of a webpage')
  .option('-v, --viewport <preset>', 'Viewport preset: desktop, mobile, tablet', 'desktop')
  .option('-W, --width <number>', 'Custom viewport width')
  .option('-H, --height <number>', 'Custom viewport height')
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .option('-f, --filename <name>', 'Custom filename')
  .option('--full-page', 'Capture full page')
  .option('--wait-for <selector>', 'Wait for element before screenshot')
  .option('--wait-time <ms>', 'Wait time before screenshot', parseInt)
  .option('--hide <selectors...>', 'Hide elements (e.g., cookie banners)')
  .option('--dark-mode', 'Enable dark mode')
  .action(async (url, options) => {
    try {
      console.log(chalk.blue('🌐 Taking screenshot...'));
      await skill.init({ viewport: options.viewport });
      const filepath = await skill.screenshot(url, {
        output: options.output,
        filename: options.filename,
        fullPage: options.fullPage,
        waitFor: options.waitFor,
        waitTime: options.waitTime,
        hide: options.hide,
        darkMode: options.darkMode
      });
      console.log(chalk.green(`✓ Screenshot saved: ${filepath}`));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    } finally {
      await skill.close();
    }
  });

program
  .command('test-url <url>')
  .description('Test a URL for availability and content')
  .option('--expect-status <code>', 'Expected HTTP status', parseInt, 200)
  .option('--expect-text <text>', 'Text that should appear')
  .option('--expect-selector <selector>', 'CSS selector that should exist')
  .option('-t, --timeout <ms>', 'Page load timeout', parseInt, 30000)
  .option('--dark-mode', 'Enable dark mode')
  .action(async (url, options) => {
    try {
      console.log(chalk.blue('🧪 Testing URL...'));
      await skill.init();
      const result = await skill.testUrl(url, {
        expectStatus: options.expectStatus,
        expectText: options.expectText,
        expectSelector: options.expectSelector,
        timeout: options.timeout,
        darkMode: options.darkMode
      });
      
      if (result.success) {
        console.log(chalk.green(`✓ ${result.message}`));
        process.exit(0);
      } else {
        console.error(chalk.red(`✗ ${result.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    } finally {
      await skill.close();
    }
  });

program
  .command('click <url>')
  .description('Click an element on a webpage')
  .requiredOption('-s, --selector <selector>', 'Element selector to click')
  .option('--screenshot', 'Take screenshot after click')
  .option('--wait-for-navigation', 'Wait for navigation after click')
  .action(async (url, options) => {
    try {
      console.log(chalk.blue('👆 Clicking element...'));
      await skill.init();
      const result = await skill.click(url, options.selector, {
        screenshot: options.screenshot,
        waitForNavigation: options.waitForNavigation
      });
      
      if (result.success) {
        console.log(chalk.green(`✓ ${result.message}`));
        if (result.screenshotPath) {
          console.log(chalk.blue(`  Screenshot: ${result.screenshotPath}`));
        }
        process.exit(0);
      } else {
        console.error(chalk.red(`✗ ${result.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    } finally {
      await skill.close();
    }
  });

program
  .command('type <url>')
  .description('Type text into an input field')
  .requiredOption('-s, --selector <selector>', 'Input field selector')
  .requiredOption('-t, --text <text>', 'Text to type')
  .option('--clear', 'Clear field before typing')
  .option('--submit', 'Submit form after typing')
  .option('--delay <ms>', 'Delay between keystrokes', parseInt)
  .option('--screenshot', 'Take screenshot after typing')
  .action(async (url, options) => {
    try {
      console.log(chalk.blue('⌨️  Typing text...'));
      await skill.init();
      const result = await skill.type(url, options.selector, options.text, {
        clear: options.clear,
        submit: options.submit,
        delay: options.delay,
        screenshot: options.screenshot
      });
      
      if (result.success) {
        console.log(chalk.green(`✓ ${result.message}`));
        if (result.screenshotPath) {
          console.log(chalk.blue(`  Screenshot: ${result.screenshotPath}`));
        }
        process.exit(0);
      } else {
        console.error(chalk.red(`✗ ${result.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    } finally {
      await skill.close();
    }
  });

program
  .command('flow <flow-file>')
  .description('Run a multi-step browser flow from a JSON file')
  .action(async (flowFile) => {
    try {
      console.log(chalk.blue('🎬 Running flow...'));
      const result = await skill.runFlow(flowFile);
      
      for (const r of result.results) {
        console.log(chalk.blue(`  ${r}`));
      }
      
      if (result.success) {
        console.log(chalk.green('✓ Flow completed successfully'));
        process.exit(0);
      } else {
        console.error(chalk.red('✗ Flow failed'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    } finally {
      await skill.close();
    }
  });

program.parse();
