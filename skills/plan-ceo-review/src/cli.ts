#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ceoReview } from './index.js';

const program = new Command();

program
  .name('superpowers-plan-ceo-review')
  .description('Product strategy review using BAT (Brand, Attention, Trust) framework')
  .version('1.0.0');

program
  .argument('<feature>', 'Feature name to review')
  .argument('[goal]', 'Feature goal/strategy context')
  .option('--brand <n>', 'Brand score (0-5)', parseFloat)
  .option('--attention <n>', 'Attention score (0-5)', parseFloat)
  .option('--trust <n>', 'Trust score (0-5)', parseFloat)
  .option('-i, --interactive', 'Interactive mode for scoring', false)
  .option('-o, --output <path>', 'Output report to file')
  .option('--json', 'Output as JSON', false)
  .action(async (feature: string, goal: string | undefined, options: any) => {
    try {
      const result = await ceoReview({
        feature,
        goal,
        brand: options.brand,
        attention: options.attention,
        trust: options.trust,
        interactive: options.interactive
      });
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      }
      
      // Exit with appropriate code
      if (result.recommendation === 'skip') {
        process.exit(1);
      }
      
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();
