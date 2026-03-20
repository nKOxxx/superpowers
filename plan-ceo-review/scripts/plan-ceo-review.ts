#!/usr/bin/env node
/**
 * Plan CEO Review CLI - Command line interface for CEO review skill
 */

import { PlanCeoReviewSkill, type CeoReviewOptions, type AudienceType, type MarketType } from '../src/index.js';
import { TelegramFormatter } from '@openclaw/superpowers-shared';

function parseArgs(args: string[]): Record<string, string | boolean | undefined> {
  const result: Record<string, string | boolean | undefined> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result[key] = nextArg;
        i++;
      } else {
        result[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      result[key] = true;
    } else if (!result.feature) {
      result.feature = arg;
    }
  }
  
  return result;
}

function showHelp(): void {
  console.log(`
Plan CEO Review - Product strategy evaluation

Usage: plan-ceo-review "feature name" [options]

Options:
  --build-vs-buy         Include build vs buy analysis
  --compare <feature2>   Compare two features
  --audience <type>      Target audience (enterprise, consumer, saas)
  --market <type>        Market type (b2b, b2c, saas)
  --format <type>        Output format (summary, detailed)
  --telegram             Output formatted for Telegram
  --help                 Show this help

Examples:
  plan-ceo-review "AI-powered search"
  plan-ceo-review "Mobile app" --audience=enterprise
  plan-ceo-review "Feature A" --compare "Feature B"
  plan-ceo-review "Notifications" --build-vs-buy
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  if (!args.feature || typeof args.feature !== 'string') {
    console.error('Error: Feature name is required');
    showHelp();
    process.exit(1);
  }
  
  const skill = new PlanCeoReviewSkill();
  
  const options: CeoReviewOptions = {
    featureName: args.feature,
    buildVsBuy: args.buildVsBuy === true,
    audience: args.audience as AudienceType,
    market: args.market as MarketType,
    format: (args.format as 'summary' | 'detailed') || 'detailed',
  };
  
  if (args.compare && typeof args.compare === 'string') {
    options.compareWith = args.compare;
  }
  
  try {
    const result = await skill.review(options);
    
    if (args.telegram) {
      const telegramResult = TelegramFormatter.formatCeoReviewResult(result);
      console.log(JSON.stringify(telegramResult, null, 2));
    } else {
      console.log(skill.formatResult(result, options.format));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('CEO Review failed:', error);
    process.exit(1);
  }
}

main();
