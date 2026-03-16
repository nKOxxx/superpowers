#!/usr/bin/env node

import { program } from 'commander';
import { reviewCommand, printFrameworkExplanation } from './dist/index.js';

program
  .name('plan-ceo-review')
  .description('Product strategy review using BAT framework')
  .version('1.0.0');

program
  .argument('<description>', 'Feature/product description (e.g., "Feature Name: Description")')
  .option('-b, --brand <score>', 'Brand score (0-5)', parseFloat)
  .option('-a, --attention <score>', 'Attention score (0-5)', parseFloat)
  .option('-t, --trust <score>', 'Trust score (0-5)', parseFloat)
  .option('--auto', 'Auto-calculate scores based on description', true)
  .option('-j, --json', 'Output as JSON', false)
  .option('-o, --output <path>', 'Save results to file')
  .action((description, options) => {
    // Handle special 'framework' command
    if (description === 'framework') {
      printFrameworkExplanation();
      return;
    }

    reviewCommand(description, {
      brand: options.brand,
      attention: options.attention,
      trust: options.trust,
      auto: options.auto,
      json: options.json,
      output: options.output,
    });
  });

program.parse();
