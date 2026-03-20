import { Command } from 'commander';
import chalk from 'chalk';
import { ReviewController } from './controller';

const program = new Command();

program
  .name('plan-ceo-review')
  .description('Product strategy evaluation using BAT framework and 10-star methodology')
  .version('1.0.0')
  .argument('<feature>', 'Feature or idea to review')
  .option('-c, --compare <feature>', 'Compare with another feature')
  .option('-a, --audience <type>', 'Target audience (enterprise, consumer, saas)', 'consumer')
  .option('-m, --market <type>', 'Market type (saas, marketplace, consumer)', 'consumer')
  .option('-b, --build-vs-buy', 'Run build vs buy analysis')
  .option('--csv', 'Output as CSV')
  .option('--json', 'Output as JSON')
  .action(async (feature: string, options: ReviewOptions) => {
    const controller = new ReviewController();
    
    try {
      console.log(chalk.blue(`\n📊 CEO Review: ${feature}\n`));
      
      const result = await controller.review(feature, {
        compare: options.compare,
        audience: options.audience,
        market: options.market,
        buildVsBuy: options.buildVsBuy,
        format: options.csv ? 'csv' : options.json ? 'json' : 'text'
      });

      printResults(result);

      if (result.comparison) {
        printComparison(result.comparison);
      }

      if (result.buildVsBuy) {
        printBuildVsBuy(result.buildVsBuy);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function printResults(result: ReviewResult): void {
  // BAT Framework
  console.log(chalk.blue('🎯 BAT Framework Analysis'));
  console.log(chalk.gray('─'.repeat(50)));
  
  const bat = result.batScore;
  printScoreBar('Brand', bat.brand, 5, bat.brand > 3 ? 'green' : bat.brand > 2 ? 'yellow' : 'red');
  printScoreBar('Attention', bat.attention, 5, bat.attention > 3 ? 'green' : bat.attention > 2 ? 'yellow' : 'red');
  printScoreBar('Trust', bat.trust, 5, bat.trust > 3 ? 'green' : bat.trust > 2 ? 'yellow' : 'red');
  
  const totalScore = bat.brand + bat.attention + bat.trust;
  console.log(chalk.gray(`\nTotal BAT Score: ${getScoreColor(totalScore, 15)(totalScore + '/15')}`));
  
  // Recommendation
  const recommendation = getBATRecommendation(totalScore);
  console.log(chalk.blue('\n📋 Recommendation'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(getRecommendationBadge(recommendation));
  console.log(chalk.gray(`Rationale: ${recommendation.rationale}`));
  
  // 10-Star Methodology
  console.log(chalk.blue('\n⭐ 10-Star Assessment'));
  console.log(chalk.gray('─'.repeat(50)));
  
  const stars = result.tenStar;
  printStarBar('Problem', stars.problem);
  printStarBar('Usability', stars.usability);
  printStarBar('Delight', stars.delight);
  printStarBar('Feasibility', stars.feasibility);
  printStarBar('Viability', stars.viability);
  
  const avgStars = (stars.problem + stars.usability + stars.delight + stars.feasibility + stars.viability) / 5;
  console.log(chalk.gray(`\nAverage Rating: ${'⭐'.repeat(Math.round(avgStars))} (${avgStars.toFixed(1)}/10)`));
  
  // Next Steps
  console.log(chalk.blue('\n🚀 Next Steps'));
  console.log(chalk.gray('─'.repeat(50)));
  result.nextSteps.forEach((step, index) => {
    console.log(chalk.gray(`  ${index + 1}. ${step}`));
  });
}

function printScoreBar(label: string, score: number, max: number, color: 'green' | 'yellow' | 'red'): void {
  const filled = '█'.repeat(score);
  const empty = '░'.repeat(max - score);
  const colorFn = color === 'green' ? chalk.green : color === 'yellow' ? chalk.yellow : chalk.red;
  console.log(chalk.gray(`${label.padEnd(10)} ${colorFn(filled + empty)} ${score}/${max}`));
}

function printStarBar(label: string, stars: number): void {
  const filled = '⭐'.repeat(Math.floor(stars / 2));
  const half = stars % 2 >= 1 ? '½' : '';
  console.log(chalk.gray(`${label.padEnd(12)} ${filled}${half} (${stars}/10)`));
}

function getScoreColor(score: number, max: number): Function {
  const pct = score / max;
  if (pct >= 0.7) return chalk.green;
  if (pct >= 0.5) return chalk.yellow;
  return chalk.red;
}

function getBATRecommendation(score: number): { text: string; rationale: string } {
  if (score >= 12) {
    return {
      text: 'BUILD - Strong Signal',
      rationale: 'High BAT scores across all dimensions. Prioritize this feature.'
    };
  } else if (score >= 10) {
    return {
      text: 'BUILD - Good Signal',
      rationale: 'Solid foundation. Proceed with development.'
    };
  } else if (score >= 8) {
    return {
      text: 'CONSIDER - Mixed Signal',
      rationale: 'Some concerns. Needs refinement before building.'
    };
  } else {
    return {
      text: 'DON\'T BUILD - Weak Signal',
      rationale: 'Low scores suggest weak product-market fit.'
    };
  }
}

function getRecommendationBadge(rec: { text: string }): string {
  if (rec.text.startsWith('BUILD')) {
    return chalk.bgGreen.black(` ${rec.text} `);
  } else if (rec.text.startsWith('CONSIDER')) {
    return chalk.bgYellow.black(` ${rec.text} `);
  } else {
    return chalk.bgRed.white(` ${rec.text} `);
  }
}

function printComparison(comparison: ComparisonResult): void {
  console.log(chalk.blue('\n⚖️  Feature Comparison'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray(`Winner: ${comparison.winner}`));
  console.log(chalk.gray(`Rationale: ${comparison.rationale}`));
}

function printBuildVsBuy(analysis: BuildVsBuyResult): void {
  console.log(chalk.blue('\n🏗️  Build vs Buy Analysis'));
  console.log(chalk.gray('─'.repeat(50)));
  
  console.log(chalk.gray(`\nRecommendation: ${analysis.recommendation}`));
  
  console.log(chalk.gray('\nCost Analysis (3-year TCO):'));
  console.log(chalk.gray(`  Build: $${analysis.buildCost.toLocaleString()}`));
  console.log(chalk.gray(`  Buy: $${analysis.buyCost.toLocaleString()}`));
  
  console.log(chalk.gray('\nTime to Market:'));
  console.log(chalk.gray(`  Build: ${analysis.buildTime} months`));
  console.log(chalk.gray(`  Buy: ${analysis.buyTime} months`));
  
  if (analysis.strategicValue) {
    console.log(chalk.gray(`\nStrategic Value: ${analysis.strategicValue}`));
  }
}

program.parse();

export interface ReviewOptions {
  compare?: string;
  audience: string;
  market: string;
  buildVsBuy?: boolean;
  format: 'text' | 'csv' | 'json';
  csv?: boolean;
  json?: boolean;
}

export interface BATScore {
  brand: number;
  attention: number;
  trust: number;
}

export interface TenStarScore {
  problem: number;
  usability: number;
  delight: number;
  feasibility: number;
  viability: number;
}

export interface ComparisonResult {
  winner: string;
  rationale: string;
  scores: {
    feature1: number;
    feature2: number;
  };
}

export interface BuildVsBuyResult {
  recommendation: 'BUILD' | 'BUY' | 'HYBRID';
  buildCost: number;
  buyCost: number;
  buildTime: number;
  buyTime: number;
  strategicValue?: string;
}

export interface ReviewResult {
  feature: string;
  batScore: BATScore;
  tenStar: TenStarScore;
  recommendation: string;
  nextSteps: string[];
  comparison?: ComparisonResult;
  buildVsBuy?: BuildVsBuyResult;
}
