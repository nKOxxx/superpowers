#!/usr/bin/env tsx
/**
 * /plan-ceo-review - Product Strategy Skill
 * 
 * BAT framework + 10-star methodology for build decisions
 */
import { Command } from 'commander';
import pc from 'picocolors';
import { createInterface } from 'readline';
import { loadConfig } from './lib/config.js';
import { 
  evaluateBAT, 
  formatBATEvaluation, 
  getRecommendationTable,
  DIMENSION_TITLES,
  CRITERIA,
  type BATDimension 
} from './lib/bat-scoring.js';
import { analyzeFeasibility, generateNextSteps, formatFeasibilityAnalysis, getMarketInsightsTemplate } from './lib/market-analysis.js';

const program = new Command();

program
  .name('plan-ceo-review')
  .description('Product strategy review using BAT framework')
  .version('1.0.0');

program
  .argument('[feature]', 'Feature name to evaluate')
  .option('-g, --goal <goal>', 'What this feature aims to achieve')
  .option('-m, --market <market>', 'Target market or category')
  .option('--brand <score>', 'Brand score (0-5)', '0')
  .option('--attention <score>', 'Attention score (0-5)', '0')
  .option('--trust <score>', 'Trust score (0-5)', '0')
  .option('-i, --interactive', 'Interactive mode with prompts', false)
  .option('--config <path>', 'Path to config file')
  .option('--feasibility', 'Include feasibility analysis', false)
  .option('--market-analysis', 'Include market analysis', false)
  .action(async (featureArg: string | undefined, options: { goal?: string; market?: string; brand?: string; attention?: string; trust?: string; interactive?: boolean; config?: string; feasibility?: boolean; marketAnalysis?: boolean }) => {
    try {
      const config = loadConfig(options.config);
      
      console.log(pc.cyan('📊 Plan CEO Review: Product Strategy'));
      console.log('');

      let feature = featureArg;
      let goal = options.goal;
      let market = options.market;
      
      // Interactive mode
      if (options.interactive || !feature) {
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const ask = (question: string): Promise<string> => {
          return new Promise((resolve) => {
            rl.question(question, (answer) => resolve(answer.trim()));
          });
        };

        if (!feature) {
          feature = await ask('Feature name: ');
        }

        if (!goal) {
          goal = await ask('Goal (what will this achieve?): ');
        }

        if (!market && config.ceoReview.marketAnalysis) {
          market = await ask('Target market (optional): ') || undefined;
        }

        console.log('');
        console.log(pc.cyan('BAT Framework Scoring (0-5 for each dimension)'));
        console.log('');

        // Show criteria and get scores
        const scores: Record<BATDimension, number> = {
          brand: parseInt(options.brand || '0') || 0,
          attention: parseInt(options.attention || '0') || 0,
          trust: parseInt(options.trust || '0') || 0
        };

        for (const dimension of ['brand', 'attention', 'trust'] as BATDimension[]) {
          console.log(pc.yellow(`${DIMENSION_TITLES[dimension]}:`));
          for (const criteria of CRITERIA[dimension]) {
            console.log(`  ${criteria.score} - ${criteria.label}: ${criteria.description}`);
          }
          
          const input = await ask(`Score (0-5) [${scores[dimension]}]: `);
          if (input) {
            scores[dimension] = parseInt(input, 10);
          }
          console.log('');
        }

        rl.close();

        // Update options with interactive values
        options.brand = String(scores.brand);
        options.attention = String(scores.attention);
        options.trust = String(scores.trust);
      }

      // Validate required fields
      if (!feature) {
        console.error(pc.red('❌ Feature name is required'));
        console.error(pc.gray('Usage: plan-ceo-review "Feature Name" --goal="..."'));
        process.exit(1);
      }

      if (!goal) {
        console.error(pc.red('❌ Goal is required'));
        console.error(pc.gray('Usage: plan-ceo-review "Feature Name" --goal="..."'));
        process.exit(1);
      }

      // Parse scores
      const scores = {
        brand: parseInt(options.brand || '0', 10) || 0,
        attention: parseInt(options.attention || '0', 10) || 0,
        trust: parseInt(options.trust || '0', 10) || 0
      };

      // Show recommendation table
      if (!options.interactive) {
        console.log(getRecommendationTable());
        console.log('');
      }

      // Perform BAT evaluation
      const evaluation = evaluateBAT(feature, goal, scores, market, {
        minimumScore: config.ceoReview.minimumScore,
        requireAllBAT: config.ceoReview.requireAllBAT
      });

      // Output evaluation
      console.log(formatBATEvaluation(evaluation));

      // Generate next steps if approved
      if (evaluation.recommendation === 'build' && config.ceoReview.autoGenerateNextSteps) {
        console.log('');
        console.log(pc.cyan('Next Steps:'));
        console.log('-----------');
        
        const feasibility = analyzeFeasibility(feature);
        const steps = generateNextSteps(feature, feasibility);
        
        for (let i = 0; i < steps.length; i++) {
          console.log(`${i + 1}. ${steps[i]}`);
        }
      }

      // Feasibility analysis
      if (options.feasibility) {
        console.log('');
        const feasibility = analyzeFeasibility(feature);
        console.log(formatFeasibilityAnalysis(feasibility));
      }

      // Market analysis template
      if (options.marketAnalysis && market) {
        console.log('');
        console.log(getMarketInsightsTemplate(feature, market));
      }

      // Exit with appropriate code
      if (evaluation.recommendation === 'dont-build') {
        process.exit(1);
      }

    } catch (error) {
      console.error(pc.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
