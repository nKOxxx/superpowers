#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { review, formatReview, BAT_CRITERIA, CeoReviewResult } from './index.js';

const program = new Command();

program
  .name('superpowers-plan-ceo-review')
  .description('Product strategy review with BAT (Brand, Attention, Trust) framework')
  .version('1.0.0');

program
  .argument('<feature>', 'Feature or idea to review (in quotes)')
  .option('-b, --brand <score>', 'Brand score (0-5)', '3')
  .option('-a, --attention <score>', 'Attention score (0-5)', '3')
  .option('-t, --trust <score>', 'Trust score (0-5)', '3')
  .option('--auto', 'Auto-calculate scores based on feature description', false)
  .option('--context <text>', 'Additional context for auto-scoring')
  .option('--criteria', 'Show BAT scoring criteria', false)
  .option('--json', 'Output as JSON', false)
  .action(async (feature, options) => {
    if (options.criteria) {
      console.log(chalk.bold('🎯 BAT Framework Scoring Criteria'));
      console.log(chalk.gray('═'.repeat(60)));
      
      console.log(chalk.cyan('\n📌 BRAND (Does it strengthen our brand identity?)'));
      BAT_CRITERIA.brand.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
      
      console.log(chalk.cyan('\n👁  ATTENTION (Will it capture and hold user attention?)'));
      BAT_CRITERIA.attention.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
      
      console.log(chalk.cyan('\n🤝 TRUST (Does it build trust with users?)'));
      BAT_CRITERIA.trust.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
      
      console.log(chalk.gray('\n' + '═'.repeat(60)));
      console.log(chalk.bold('📊 Thresholds'));
      console.log('   12-15 stars: STRONG SIGNAL → Build');
      console.log('   8-11 stars:  MIXED → Consider carefully');
      console.log('   0-7 stars:   WEAK → Don\'t build');
      
      process.exit(0);
    }
    
    try {
      let result: CeoReviewResult;
      
      if (options.auto) {
        result = review({
          feature,
          autoScore: true,
          context: options.context
        });
      } else {
        result = review({
          feature,
          scores: {
            brand: parseInt(options.brand, 10) as 0 | 1 | 2 | 3 | 4 | 5,
            attention: parseInt(options.attention, 10) as 0 | 1 | 2 | 3 | 4 | 5,
            trust: parseInt(options.trust, 10) as 0 | 1 | 2 | 3 | 4 | 5
          }
        });
      }
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatReview(result));
        
        // Colored summary
        console.log(chalk.gray('\n' + '─'.repeat(50)));
        const recColor = result.recommendation === 'build' ? chalk.green :
                        result.recommendation === 'consider' ? chalk.yellow : chalk.red;
        console.log(`Recommendation: ${recColor.bold(result.recommendation.toUpperCase())}`);
        console.log(`Total Score: ${chalk.cyan(result.totalScore)}/${result.maxScore} stars`);
        
        if (options.auto) {
          console.log(chalk.gray('\n(Scores auto-calculated based on feature description)'));
        }
      }
      
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();
