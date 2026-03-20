#!/usr/bin/env node
/**
 * Plan CEO Review CLI script - /plan-ceo-review command handler
 */

import { PlanCeoReviewSkill, type CeoReviewOptions, type CeoReviewResult } from '../src/index.js';
import { parseArgs, ConsoleLogger } from '@openclaw/superpowers-shared';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const logger = new ConsoleLogger(args.verbose ? 'debug' : 'info');

  if (args.help) {
    console.log('Usage: plan-ceo-review "feature name" [options]');
    console.log('');
    console.log('Options:');
    console.log('  --build-vs-buy          Include build vs buy analysis');
    console.log('  --compare <feature2>    Compare two features');
    console.log('  --audience <type>       Target audience (enterprise, consumer, saas)');
    console.log('  --market <type>         Market type');
    console.log('  --format <type>         Output format (summary, detailed)');
    console.log('  --verbose               Enable verbose logging');
    console.log('');
    console.log('Examples:');
    console.log('  plan-ceo-review "AI-powered search"');
    console.log('  plan-ceo-review "Mobile app" --audience=enterprise --build-vs-buy');
    console.log('  plan-ceo-review "Feature A" --compare "Feature B"');
    process.exit(0);
  }

  const featureName = args._ as string;
  
  if (!featureName) {
    console.error('Error: Feature name is required');
    console.error('Usage: plan-ceo-review "feature name" [options]');
    process.exit(1);
  }

  const options: CeoReviewOptions = {
    featureName,
    compareWith: args.compare as string,
    buildVsBuy: !!args['build-vs-buy'],
    audience: args.audience as CeoReviewOptions['audience'],
    market: args.market as CeoReviewOptions['market'],
    format: (args.format as CeoReviewOptions['format']) || 'detailed'
  };

  logger.info(`Starting CEO review: ${featureName}`);

  const skill = new PlanCeoReviewSkill(logger);
  
  // If comparing, run both reviews
  if (options.compareWith) {
    const result1 = await skill.review(options);
    const result2 = await skill.review({
      ...options,
      featureName: options.compareWith
    });

    console.log(skill.formatResult(result1, options.format));
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log(skill.formatResult(result2, options.format));
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('COMPARISON');
    console.log(`  ${result1.featureName}: BAT ${result1.batScore.total}/15, 10-Star ${result1.tenStarScore.overall}/10`);
    console.log(`  ${result2.featureName}: BAT ${result2.batScore.total}/15, 10-Star ${result2.tenStarScore.overall}/10`);
    
    const winner = result1.batScore.total > result2.batScore.total ? result1.featureName :
                   result2.batScore.total > result1.batScore.total ? result2.featureName : 'Tie';
    console.log(`  Winner: ${winner}`);
  } else {
    const result = await skill.review(options);
    console.log(skill.formatResult(result, options.format));
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});