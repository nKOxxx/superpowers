import { Command } from 'commander';
import chalk from 'chalk';
import { takeScreenshot, runFlow, getViewport, parseActions } from '../lib/browser.js';
import type { BrowseOptions, FlowStep } from '../types/index.js';

// Default flows
const DEFAULT_FLOWS: Record<string, FlowStep[]> = {
  critical: [
    { name: 'Homepage', url: '/' },
    { name: 'About', url: '/about' },
    { name: 'Contact', url: '/contact' },
  ],
  auth: [
    { name: 'Login', url: '/login' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Profile', url: '/profile' },
  ],
  checkout: [
    { name: 'Cart', url: '/cart' },
    { name: 'Checkout', url: '/checkout' },
    { name: 'Payment', url: '/payment' },
  ],
};

export const browseCommand = new Command('browse')
  .description('Browser automation with Playwright')
  .argument('<url>', 'URL to screenshot')
  .option('-v, --viewport <name>', 'Viewport preset (mobile, tablet, desktop)', 'desktop')
  .option('-W, --width <pixels>', 'Custom viewport width', parseInt)
  .option('-H, --height <pixels>', 'Custom viewport height', parseInt)
  .option('-f, --full-page', 'Capture full page screenshot')
  .option('-o, --output <dir>', 'Output directory', './screenshots')
  .option('--flows <names>', 'Comma-separated flow names')
  .option('-w, --wait-for <selector>', 'Wait for element before screenshot')
  .option('-a, --actions <actions>', 'Comma-separated actions (click:selector,type:selector|text,wait:ms,scroll,hover:selector,screenshot)')
  .option('-t, --timeout <ms>', 'Navigation timeout', parseInt)
  .action(async (url: string, options: BrowseOptions) => {
    console.log(chalk.blue('══════════════════════════════════════════════════'));
    console.log(chalk.blue('Browser Automation'));
    console.log(chalk.blue('══════════════════════════════════════════════════\n'));
    
    try {
      // Validate URL
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      
      const viewport = getViewport(options);
      console.log(chalk.gray(`URL: ${url}`));
      console.log(chalk.gray(`Viewport: ${viewport.width}x${viewport.height}`));
      console.log(chalk.gray(`Output: ${options.output || './screenshots'}`));
      
      if (options.flows) {
        // Run flows
        const flowNames = options.flows.split(',').map(f => f.trim());
        console.log(chalk.gray(`Flows: ${flowNames.join(', ')}\n`));
        
        for (const flowName of flowNames) {
          const flow = DEFAULT_FLOWS[flowName];
          if (!flow) {
            console.log(chalk.yellow(`⚠ Flow "${flowName}" not found, skipping`));
            continue;
          }
          
          console.log(chalk.blue(`\nRunning flow: ${flowName}`));
          const screenshots = await runFlow(flow, options, url);
          
          for (const filepath of screenshots) {
            console.log(chalk.green(`✓ Screenshot: ${filepath}`));
          }
        }
      } else {
        // Single screenshot
        console.log('');
        const filepath = await takeScreenshot(url, options);
        console.log(chalk.green(`✓ Screenshot saved: ${filepath}`));
      }
      
      console.log(chalk.blue('\n══════════════════════════════════════════════════'));
      console.log(chalk.green('Done!'));
      console.log(chalk.blue('══════════════════════════════════════════════════'));
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
