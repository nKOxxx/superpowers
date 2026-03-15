#!/usr/bin/env node
import { Command } from 'commander';
import { planCeoReviewCommand } from './index.js';

const program = new Command();

program
  .name('superpowers-plan-ceo-review')
  .description('Product strategy review with BAT framework')
  .argument('<feature>', 'Feature name and description')
  .option('-b, --brand <score>', 'Brand score (0-5)', '3')
  .option('-a, --attention <score>', 'Attention score (0-5)', '3')
  .option('-t, --trust <score>', 'Trust score (0-5)', '3')
  .option('--auto', 'Auto-calculate scores from feature description')
  .action(planCeoReviewCommand);

program.parse();
