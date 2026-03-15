#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { browseToFile, VIEWPORT_PRESETS, BrowseAction, BrowseOptions, ScreenshotResult, Viewport } from './index.js';

// Simple spinner implementation
function createSpinner(text: string) {
  let interval: NodeJS.Timeout;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  return {
    start() {
      process.stdout.write(`${frames[0]} ${text}`);
      interval = setInterval(() => {
        i = (i + 1) % frames.length;
        process.stdout.write(`\r${frames[i]} ${text}`);
      }, 80);
      return this;
    },
    stop() {
      clearInterval(interval);
      process.stdout.write('\r');
      return this;
    },
    succeed(msg?: string) {
      this.stop();
      console.log(`${chalk.green('✔')} ${msg || text}`);
      return this;
    },
    fail(msg?: string) {
      this.stop();
      console.log(`${chalk.red('✖')} ${msg || text}`);
      return this;
    },
    set text(newText: string) {
      text = newText;
    }
  };
}

const program = new Command();

program
  .name('superpowers-browse')
  .description('Browser automation for visual testing and QA')
  .version('1.0.0');

program
  .argument('<url>', 'URL to browse')
  .option('-v, --viewport <preset>', 'Viewport preset: mobile, tablet, desktop', 'desktop')
  .option('--width <width>', 'Custom viewport width')
  .option('--height <height>', 'Custom viewport height')
  .option('-f, --full-page', 'Capture full page screenshot', false)
  .option('-s, --selector <selector>', 'Capture specific element only')
  .option('-o, --output <path>', 'Save screenshot to file path')
  .option('-t, --timeout <ms>', 'Navigation timeout in ms', '30000')
  .option('-a, --action <action>', 'Action sequence (comma-separated: click:selector,type:selector:text,wait:ms,scroll:x:y,hover:selector)', '')
  .action(async (url: string, options: any) => {
    const spinner = createSpinner('Launching browser...').start();
    
    try {
      // Parse viewport
      let viewport: 'mobile' | 'tablet' | 'desktop' | Viewport = options.viewport;
      if (options.width && options.height) {
        viewport = {
          width: parseInt(options.width, 10),
          height: parseInt(options.height, 10)
        };
      } else if (!VIEWPORT_PRESETS[options.viewport]) {
        spinner.fail(`Invalid viewport preset: ${options.viewport}`);
        console.log(chalk.gray('Valid presets: mobile, tablet, desktop'));
        process.exit(1);
      }
      
      // Parse actions
      const actions: BrowseAction[] = [];
      if (options.action) {
        const actionParts = options.action.split(',');
        for (const part of actionParts) {
          const [type, ...args] = part.split(':');
          switch (type) {
            case 'click':
              actions.push({ type: 'click', selector: args[0] });
              break;
            case 'type':
              actions.push({ type: 'type', selector: args[0], text: args[1] || '' });
              break;
            case 'wait':
              actions.push({ type: 'wait', duration: parseInt(args[0], 10) || 1000 });
              break;
            case 'scroll':
              actions.push({ 
                type: 'scroll', 
                x: args[0] ? parseInt(args[0], 10) : undefined,
                y: args[1] ? parseInt(args[1], 10) : undefined
              });
              break;
            case 'hover':
              actions.push({ type: 'hover', selector: args[0] });
              break;
          }
        }
      }
      
      spinner.text = `Navigating to ${chalk.cyan(url)}...`;
      
      const browseOptions: BrowseOptions = {
        url,
        viewport,
        fullPage: options.fullPage,
        selector: options.selector,
        actions: actions.length > 0 ? actions : undefined,
        timeout: parseInt(options.timeout, 10)
      };
      
      const result: ScreenshotResult = await browseToFile(browseOptions);
      
      if (result.success) {
        spinner.succeed(chalk.green('Screenshot captured successfully!'));
        
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.bold('📸 Screenshot Result'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`URL:      ${chalk.cyan(result.url)}`);
        console.log(`Viewport: ${chalk.yellow(`${result.viewport.width}x${result.viewport.height}`)}`);
        console.log(`Time:     ${chalk.gray(result.timestamp)}`);
        
        if (result.path) {
          console.log(`Saved to: ${chalk.green(result.path)}`);
        }
        
        if (result.base64) {
          console.log(chalk.gray('\nBase64 output (first 100 chars):'));
          console.log(chalk.gray(result.base64.substring(0, 100) + '...'));
        }
        
        // Exit with 0 for success
        process.exit(0);
      } else {
        spinner.fail(chalk.red(`Failed: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();
