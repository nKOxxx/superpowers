import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../utils/config.js';
import { printHeader, printSuccess, printStars, printInfo, printWarning } from '../utils/format.js';

export interface CEORReviewOptions {
  feature: string;
  goal?: string;
  audience?: string;
  competition?: string;
  trust?: string;
  brand?: string;
  attention?: string;
  trustScore?: string;
}

interface BATScore {
  brand: number;
  attention: number;
  trust: number;
}

interface Recommendation {
  action: 'BUILD' | 'CONSIDER' | "DON'T BUILD";
  emoji: string;
  color: string;
  rationale: string[];
  nextSteps: string[];
}

function calculateRecommendation(total: number, scores: BATScore): Recommendation {
  if (total >= 12) {
    return {
      action: 'BUILD',
      emoji: '✅',
      color: 'green',
      rationale: [
        'Strong signal across BAT dimensions',
        'High confidence in success',
        'Proceed with full resources'
      ],
      nextSteps: [
        'Define success metrics (DAU, engagement time)',
        'Set 30-day post-launch review date',
        'Coordinate with marketing for launch narrative'
      ]
    };
  } else if (total >= 10) {
    return {
      action: 'BUILD',
      emoji: '✅',
      color: 'yellow',
      rationale: [
        'Good signal but validate assumptions',
        'Consider phased rollout',
        'Monitor metrics closely'
      ],
      nextSteps: [
        'Run user interviews to validate assumptions',
        'Define MVP scope',
        'Set up analytics for measuring success'
      ]
    };
  } else if (total >= 8) {
    return {
      action: 'CONSIDER',
      emoji: '🤔',
      color: 'yellow',
      rationale: [
        'Mixed signal - need more data',
        'Some BAT dimensions are weak',
        'Re-evaluate after gathering more insights'
      ],
      nextSteps: [
        'Conduct market research',
        'Analyze competitor offerings',
        'Revisit if market conditions change'
      ]
    };
  } else {
    return {
      action: "DON'T BUILD",
      emoji: '❌',
      color: 'red',
      rationale: [
        'Weak signal across BAT dimensions',
        'Resources better spent elsewhere',
        'High risk of failure'
      ],
      nextSteps: [
        'Document reasoning for future reference',
        'Focus on higher-priority initiatives',
        'Revisit if fundamental assumptions change'
      ]
    };
  }
}

function autoScoreBrand(feature: string, context: CEORReviewOptions): number {
  const feature_lower = feature.toLowerCase();
  
  // High brand value signals
  if (/ai|ml|automation|smart/.test(feature_lower)) return 4;
  if (/premium|enterprise|pro/.test(feature_lower)) return 4;
  if (/innovation|breakthrough/.test(feature_lower)) return 5;
  
  // Medium brand value
  if (/integration|sync|connect/.test(feature_lower)) return 3;
  if (/mobile|app|responsive/.test(feature_lower)) return 3;
  
  // Lower brand value (table stakes)
  if (/export|import|settings|profile/.test(feature_lower)) return 2;
  if (/bug|fix|improvement/.test(feature_lower)) return 2;
  
  return 3;
}

function autoScoreAttention(feature: string, context: CEORReviewOptions): number {
  const feature_lower = feature.toLowerCase();
  
  // High attention signals (daily use, core workflow)
  if (/dashboard|home|feed|inbox/.test(feature_lower)) return 5;
  if (/notification|alert|real-time/.test(feature_lower)) return 4;
  if (/ai|assistant|automation/.test(feature_lower)) return 4;
  
  // Medium attention
  if (/report|analytics|stats/.test(feature_lower)) return 3;
  if (/share|collaborate|invite/.test(feature_lower)) return 3;
  
  // Lower attention
  if (/export|settings|admin/.test(feature_lower)) return 2;
  if (/delete|remove|archive/.test(feature_lower)) return 2;
  
  return 3;
}

function autoScoreTrust(feature: string, context: CEORReviewOptions): number {
  const feature_lower = feature.toLowerCase();
  
  // High trust signals (security, privacy)
  if (/security|privacy|encryption|2fa|auth/.test(feature_lower)) return 5;
  if (/backup|export|data/.test(feature_lower)) return 4;
  if (/compliance|gdpr|soc2/.test(feature_lower)) return 5;
  
  // Medium trust
  if (/settings|control|permission/.test(feature_lower)) return 3;
  if (/audit|log|history/.test(feature_lower)) return 3;
  
  // Lower trust impact
  if (/ui|design|theme/.test(feature_lower)) return 2;
  if (/animation|effect|style/.test(feature_lower)) return 1;
  
  return 3;
}

export async function ceoReviewCommand(options: CEORReviewOptions): Promise<void> {
  printHeader(options.feature);
  
  const config = loadConfig();
  const spinner = ora('Analyzing feature...').start();
  
  try {
    // Calculate BAT scores
    let scores: BATScore;
    
    if (options.brand && options.attention && options.trustScore) {
      // Manual scoring provided
      scores = {
        brand: parseInt(options.brand, 10),
        attention: parseInt(options.attention, 10),
        trust: parseInt(options.trustScore, 10)
      };
    } else {
      // Auto-score based on feature analysis
      spinner.text = 'Auto-scoring BAT dimensions...';
      scores = {
        brand: autoScoreBrand(options.feature, options),
        attention: autoScoreAttention(options.feature, options),
        trust: autoScoreTrust(options.feature, options)
      };
    }
    
    const total = scores.brand + scores.attention + scores.trust;
    const recommendation = calculateRecommendation(total, scores);
    
    spinner.stop();
    
    // Print context if provided
    if (options.goal || options.audience) {
      console.log(chalk.gray('Context:'));
      if (options.goal) console.log(chalk.gray(`  Goal: ${options.goal}`));
      if (options.audience) console.log(chalk.gray(`  Audience: ${options.audience}`));
      if (options.competition) console.log(chalk.gray(`  Competition: ${options.competition}`));
      console.log();
    }
    
    // Print BAT scores
    console.log(`Brand:     ${printStars(scores.brand)} (${scores.brand}/5)`);
    console.log(`Attention: ${printStars(scores.attention)} (${scores.attention}/5)`);
    console.log(`Trust:     ${printStars(scores.trust)} (${scores.trust}/5)`);
    console.log();
    
    // Print total
    const totalColor = total >= 12 ? chalk.green : total >= 10 ? chalk.yellow : total >= 8 ? chalk.yellow : chalk.red;
    console.log(totalColor.bold(`Total: ${total}/15 ⭐`));
    console.log();
    
    // Print recommendation
    console.log(chalk.bold('Recommendation:'), chalk[recommendation.color as 'green' | 'yellow' | 'red'](`${recommendation.action} ${recommendation.emoji}`));
    console.log();
    
    // Print rationale
    console.log(chalk.bold('Rationale:'));
    recommendation.rationale.forEach(r => console.log(`  • ${r}`));
    
    // Add contextual rationale
    if (scores.brand >= 4) {
      console.log(`  • Strong brand differentiation potential`);
    }
    if (scores.attention >= 4) {
      console.log(`  • High user engagement potential`);
    }
    if (scores.trust >= 4) {
      console.log(`  • Builds significant user trust`);
    }
    
    console.log();
    
    // Print next steps
    console.log(chalk.bold('Next Steps:'));
    recommendation.nextSteps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });
    
    console.log();
    console.log(chalk.cyan('═'.repeat(50)));
    
  } catch (error) {
    spinner.stop();
    printWarning(`Review failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}