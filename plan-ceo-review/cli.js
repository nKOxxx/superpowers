#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ceoReview, brandQuestions, attentionQuestions, trustQuestions } from './dist/index.js';

const program = new Command();

program
  .name('plan-ceo-review')
  .description('BAT framework product strategy review')
  .argument('<feature>', 'Feature name (use ":" for description)')
  .option('--brand <score>', 'Brand score (0-5)', parseFloat)
  .option('--attention <score>', 'Attention score (0-5)', parseFloat)
  .option('--trust <score>', 'Trust score (0-5)', parseFloat)
  .option('--interactive', 'Force interactive mode')
  .action(async (featureArg, options) => {
    try {
      // Parse feature and description
      let feature = featureArg;
      let description;
      
      if (featureArg.includes(':')) {
        const parts = featureArg.split(':', 2);
        feature = parts[0].trim();
        description = parts[1].trim();
      }
      
      console.log(chalk.blue('📊 BAT Framework Review'));
      console.log(chalk.gray('Feature:'), feature);
      if (description) {
        console.log(chalk.gray('Description:'), description);
      }
      
      let brand = options.brand;
      let attention = options.attention;
      let trust = options.trust;
      
      // Interactive mode if scores not provided
      if (brand === undefined || attention === undefined || trust === undefined || options.interactive) {
        console.log(chalk.yellow('\n📋 Interactive scoring (enter 0-5 for each):\n'));
        
        if (brand === undefined) {
          console.log(chalk.blue('Brand (how well does this align with our brand identity?)'));
          for (const q of brandQuestions) {
            console.log(chalk.gray('  •'), q);
          }
          brand = 3;
          console.log(chalk.gray('Using default:'), brand);
        }
        
        if (attention === undefined) {
          console.log(chalk.blue('\nAttention (will this capture user interest?)'));
          for (const q of attentionQuestions) {
            console.log(chalk.gray('  •'), q);
          }
          attention = 3;
          console.log(chalk.gray('Using default:'), attention);
        }
        
        if (trust === undefined) {
          console.log(chalk.blue('\nTrust (does this build user confidence?)'));
          for (const q of trustQuestions) {
            console.log(chalk.gray('  •'), q);
          }
          trust = 3;
          console.log(chalk.gray('Using default:'), trust);
        }
      }
      
      const result = ceoReview({
        feature,
        description,
        brand,
        attention,
        trust
      });
      
      // Output results
      console.log(chalk.blue('\n📈 BAT Scores:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`Brand:      ${renderScore(result.scores.brand)}`);
      console.log(`Attention:  ${renderScore(result.scores.attention)}`);
      console.log(`Trust:      ${renderScore(result.scores.trust)}`);
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`Total:      ${result.totalScore}/15 stars`);
      console.log(chalk.gray('─'.repeat(40)));
      
      console.log(chalk.blue('\n🎯 Recommendation:'));
      const recColor = result.recommendation === 'BUILD' ? chalk.green : 
                       result.recommendation === 'CONSIDER' ? chalk.yellow : chalk.red;
      console.log(recColor.bold(result.recommendation));
      
      console.log(chalk.blue('\n💭 Reasoning:'));
      console.log(result.reasoning);
      
      console.log(chalk.blue('\n📋 Next Steps:'));
      for (const step of result.nextSteps) {
        console.log(chalk.gray('  •'), step);
      }
      
      console.log();
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

function renderScore(score) {
  const stars = '★'.repeat(score) + '☆'.repeat(5 - score);
  const color = score >= 4 ? chalk.green : score >= 3 ? chalk.yellow : chalk.red;
  return color(`${score}/5 ${stars}`);
}

program.parse();