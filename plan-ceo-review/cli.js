#!/usr/bin/env node
import { analyzeBAT } from './dist/index.js';
import { program } from 'commander';

program
  .name('plan-ceo-review')
  .description('Product strategy review using BAT framework')
  .version('1.0.0')
  .argument('<idea>', 'Idea or feature description (use quotes)')
  .option('-b, --brand <n>', 'Brand score (0-5)', parseFloat)
  .option('-a, --attention <n>', 'Attention score (0-5)', parseFloat)
  .option('-t, --trust <n>', 'Trust score (0-5)', parseFloat)
  .option('--auto', 'Auto-score based on idea description', false)
  .option('-o, --output <format>', 'Output: table, json, text', 'table')
  .action((idea, opts) => {
    analyzeBAT({ idea, ...opts });
  });

program.parse();