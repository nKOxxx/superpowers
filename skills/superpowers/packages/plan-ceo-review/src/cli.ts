#!/usr/bin/env node
import { Command } from 'commander';
import { planCEOReview, EXAMPLE_COMPARISONS } from './index.js';
import chalk from 'chalk';

const program = new Command();

const parseIntValue = (value: string): number => parseInt(value, 10);

program
  .name('plan-ceo-review')
  .description('Product strategy review using BAT framework and 10-star methodology')
  .version('1.0.0')
  .argument('<feature>', 'Feature name to evaluate')
  .option('-g, --goal <goal>', 'Business goal')
  .option('-m, --market <market>', 'Target market segment')
  .option('-b, --brand <n>', 'Brand score (0-5)', parseIntValue, 3)
  .option('-a, --attention <n>', 'Attention score (0-5)', parseIntValue, 3)
  .option('-t, --trust <n>', 'Trust score (0-5)', parseIntValue, 3)
  .option('-c, --config <path>', 'Config file path')
  .option('--telegram', 'Send Telegram notification', false)
  .option('--examples', 'Show example evaluations', false)
  .action(async (feature, options) => {
    try {
      if (options.examples) {
        console.log(chalk.bold('\n📊 Example BAT Evaluations\n'));
        console.log(chalk.gray('(Brand + Attention + Trust = Total)'));
        console.log('');
        
        for (const ex of EXAMPLE_COMPARISONS) {
          const total = ex.brand + ex.attention + ex.trust;
          const color = total >= 10 ? chalk.green : total >= 8 ? chalk.yellow : chalk.red;
          console.log(color(`${ex.feature.padEnd(15)} B:${ex.brand} A:${ex.attention} T:${ex.trust} = ${total}/15 → ${ex.decision}`));
        }
        console.log('');
        return;
      }

      await planCEOReview({
        feature,
        goal: options.goal,
        market: options.market,
        brand: options.brand,
        attention: options.attention,
        trust: options.trust,
        configPath: options.config,
        telegram: options.telegram
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
