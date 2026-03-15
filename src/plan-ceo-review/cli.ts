#!/usr/bin/env node

import { Command } from 'commander';
import { planCEOReview } from './index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package version
let version = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
  version = pkg.version;
} catch { /* ignore */ }

const program = new Command();

program
  .name('plan-ceo-review')
  .description('BAT framework for product strategy decisions')
  .version(version)
  .argument('<feature>', 'Feature name (use ":" for description, e.g., "Feature: Description")')
  .option('-b, --brand <score>', 'Brand score (0-5)', parseFloat)
  .option('-a, --attention <score>', 'Attention score (0-5)', parseFloat)
  .option('-t, --trust <score>', 'Trust score (0-5)', parseFloat)
  .option('--auto', 'Auto-score based on feature description', false)
  .action(async (feature: string, options) => {
    try {
      // Parse feature name and description
      let featureName = feature;
      let description: string | undefined;
      
      const colonIndex = feature.indexOf(':');
      if (colonIndex > 0) {
        featureName = feature.substring(0, colonIndex).trim();
        description = feature.substring(colonIndex + 1).trim();
      }
      
      // Validate scores
      const scores = [options.brand, options.attention, options.trust].filter(s => s !== undefined);
      for (const score of scores) {
        if (score < 0 || score > 5 || !Number.isInteger(score)) {
          console.error('Scores must be integers between 0 and 5');
          process.exit(1);
        }
      }
      
      const result = planCEOReview({
        featureName,
        description,
        brand: options.brand,
        attention: options.attention,
        trust: options.trust,
        autoScore: options.auto
      });
      
      process.exit(0);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();