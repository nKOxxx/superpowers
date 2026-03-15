#!/usr/bin/env node

import { program } from 'commander';
import { reviewCommand } from './dist/index.js';

program
  .name('plan-ceo-review')
  .description('Product strategy review using BAT framework')
  .version('1.0.0');

program
  .argument('<description>', 'Feature/product description (e.g., "Feature Name: Description")')
  .option('-b, --brand <score>', 'Brand score (0-5)', parseFloat)
  .option('-a, --attention <score>', 'Attention score (0-5)', parseFloat)
  .option('-t, --trust <score>', 'Trust score (0-5)', parseFloat)
  .option('--auto', 'Auto-calculate scores based on description', false)
  .option('--json', 'Output as JSON', false)
  .action(reviewCommand);

program.parse();
