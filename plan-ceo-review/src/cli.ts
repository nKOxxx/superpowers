#!/usr/bin/env node
import { Command } from 'commander';
import { PlanCeoReviewSkill } from './index.js';
import chalk from 'chalk';
import * as fs from 'fs/promises';

const program = new Command();
const skill = new PlanCeoReviewSkill();

program
  .name('plan-ceo-review')
  .description('Product strategy evaluation using BAT framework')
  .version('1.0.0');

program
  .command('review')
  .description('Analyze a feature idea using BAT framework and 10-star methodology')
  .argument('<feature>', 'Feature name to review')
  .option('-a, --audience <audience>', 'Target audience description')
  .option('-m, --market <market>', 'Market segment')
  .option('-f, --format <format>', 'Output format: text, json, markdown', 'text')
  .option('-d, --detailed', 'Include detailed analysis')
  .option('-o, --output <file>', 'Save report to file')
  .action(async (feature, options) => {
    try {
      console.log(chalk.blue(`🎯 Analyzing: ${feature}\n`));
      
      const result = skill.review(feature, {
        audience: options.audience,
        market: options.market
      });
      
      const output = skill.formatReview(result, options.format);
      
      if (options.output) {
        await fs.writeFile(options.output, output);
        console.log(chalk.green(`✓ Report saved to ${options.output}`));
      } else {
        console.log(output);
      }
      
      // Return exit code based on recommendation
      const exitCode = result.recommendation === "DON'T BUILD" ? 1 : 0;
      process.exit(exitCode);
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare two feature ideas side-by-side')
  .argument('<feature1>', 'First feature to compare')
  .argument('<feature2>', 'Second feature to compare')
  .option('-a, --audience <audience>', 'Target audience description')
  .option('-m, --market <market>', 'Market segment')
  .action(async (feature1, feature2, options) => {
    try {
      console.log(chalk.blue('⚖️  Feature Comparison\n'));
      
      const compareResult = skill.compare(feature1, feature2, {
        audience: options.audience,
        market: options.market
      });
      
      const formatBat = (score: number) => {
        const color = score >= 12 ? 'green' : score >= 8 ? 'yellow' : 'red';
        return chalk[color](`${score}/15`);
      };
      
      const formatStars = (stars: number) => {
        const color = stars >= 7 ? 'green' : stars >= 5 ? 'yellow' : 'red';
        return chalk[color](`${stars}/10`);
      };
      
      const formatRec = (rec: string) => {
        const color = rec === 'PRIORITY BUILD' || rec === 'BUILD' ? 'green' : rec === 'CONSIDER' ? 'yellow' : 'red';
        return chalk[color](rec);
      };
      
      console.log(chalk.bold('Feature 1:'), feature1);
      console.log(`  BAT: ${formatBat(compareResult.feature1.batScore.total)} | Stars: ${formatStars(compareResult.feature1.starRating.overall)} | ${formatRec(compareResult.feature1.recommendation)}`);
      
      console.log(chalk.bold('\nFeature 2:'), feature2);
      console.log(`  BAT: ${formatBat(compareResult.feature2.batScore.total)} | Stars: ${formatStars(compareResult.feature2.starRating.overall)} | ${formatRec(compareResult.feature2.recommendation)}`);
      
      if (compareResult.winner) {
        console.log(chalk.bold(`\n🏆 Winner: ${compareResult.winner}`));
      } else {
        console.log(chalk.bold('\n🤝 Tie - both features score equally'));
      }
      
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('framework')
  .description('Display explanation of the BAT and 10-star frameworks')
  .action(() => {
    const framework = skill.getFramework();
    
    console.log(chalk.blue.bold('📚 Framework Documentation\n'));
    
    console.log(chalk.yellow.bold('BAT Framework'));
    console.log(framework.bat.description);
    console.log('');
    
    console.log(chalk.bold('Dimensions:'));
    for (const dim of framework.bat.dimensions) {
      console.log(`  ${chalk.cyan(dim.name)}: ${dim.description} (0-${dim.maxScore})`);
    }
    console.log('');
    
    console.log(chalk.bold('Scoring:'));
    for (const score of framework.bat.scoring) {
      console.log(`  ${score.range}: ${chalk.green(score.recommendation)} - ${score.description}`);
    }
    console.log('');
    
    console.log(chalk.yellow.bold('10-Star Methodology'));
    console.log(framework.tenStar.description);
    console.log('');
    
    console.log(chalk.bold('Scale:'));
    for (const level of framework.tenStar.scale) {
      const stars = '⭐'.repeat(level.stars);
      console.log(`  ${stars.padEnd(10)} ${level.description}`);
    }
    
    process.exit(0);
  });

program.parse();
