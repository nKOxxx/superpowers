import { loadConfig, sendTelegramNotification, type TelegramConfig } from '@openclaw/superpowers-shared';
import chalk from 'chalk';

export interface CEOReviewConfig {
  minimumScore?: number;
  requireAllBAT?: boolean;
  autoGenerateNextSteps?: boolean;
  marketAnalysis?: boolean;
  telegram?: TelegramConfig;
}

export interface BATScores {
  brand: number;      // 0-5 stars
  attention: number;  // 0-5 stars
  trust: number;      // 0-5 stars
}

export interface FeatureEvaluation {
  name: string;
  goal?: string;
  market?: string;
  scores: BATScores;
  totalScore: number;
  recommendation: 'BUILD' | 'CONSIDER' | 'DONT_BUILD';
  rationale: string;
  nextSteps: string[];
}

// BAT Framework descriptions
const BRAND_DESCRIPTIONS: Record<number, string> = {
  0: 'Damages brand',
  1: 'Weakens brand',
  2: 'Mediocre, forgettable',
  3: 'Good quality, expected',
  4: 'Differentiated, memorable',
  5: 'Iconic, defines category'
};

const ATTENTION_DESCRIPTIONS: Record<number, string> = {
  0: 'Never used, wasted effort',
  1: 'Rarely used, low value',
  2: 'Occasionally used',
  3: 'Monthly use, nice to have',
  4: 'Weekly use, high value',
  5: 'Daily use, core workflow'
};

const TRUST_DESCRIPTIONS: Record<number, string> = {
  0: 'Erodes trust (dark patterns)',
  1: 'Minor trust concerns',
  2: 'Minor trust impact',
  3: 'Expected standard',
  4: 'Significant reliability improvement',
  5: 'Critical safety/security'
};

export class BATFramework {
  private config: CEOReviewConfig;

  constructor(config?: CEOReviewConfig) {
    this.config = config || {};
  }

  calculateScore(scores: BATScores): number {
    return scores.brand + scores.attention + scores.trust;
  }

  getRecommendation(score: number): FeatureEvaluation['recommendation'] {
    if (score >= 10) return 'BUILD';
    if (score >= 8) return 'CONSIDER';
    return 'DONT_BUILD';
  }

  getRecommendationLabel(rec: FeatureEvaluation['recommendation']): string {
    switch (rec) {
      case 'BUILD': return chalk.green.bold('✅ BUILD');
      case 'CONSIDER': return chalk.yellow.bold('🤔 CONSIDER');
      case 'DONT_BUILD': return chalk.red.bold('❌ DON\'T BUILD');
    }
  }

  generateRationale(eval_: FeatureEvaluation): string {
    const parts: string[] = [];

    // Score breakdown
    parts.push(`Scored ${eval_.totalScore}/15 (${eval_.scores.brand} brand + ${eval_.scores.attention} attention + ${eval_.scores.trust} trust)`);

    // Key strengths
    const strengths: string[] = [];
    if (eval_.scores.brand >= 4) strengths.push('strong brand impact');
    if (eval_.scores.attention >= 4) strengths.push('high user engagement');
    if (eval_.scores.trust >= 4) strengths.push('builds significant trust');

    if (strengths.length > 0) {
      parts.push(`Key strengths: ${strengths.join(', ')}`);
    }

    // Key concerns
    const concerns: string[] = [];
    if (eval_.scores.brand <= 2) concerns.push('weak brand differentiation');
    if (eval_.scores.attention <= 2) concerns.push('low user engagement');
    if (eval_.scores.trust <= 2) concerns.push('trust concerns');

    if (concerns.length > 0) {
      parts.push(`Key concerns: ${concerns.join(', ')}`);
    }

    return parts.join('. ');
  }

  generateNextSteps(eval_: FeatureEvaluation): string[] {
    const steps: string[] = [];

    switch (eval_.recommendation) {
      case 'BUILD':
        steps.push('Allocate engineering resources');
        steps.push('Define MVP scope and timeline');
        steps.push('Set success metrics before building');
        if (eval_.scores.brand >= 4) steps.push('Plan marketing/launch strategy');
        if (eval_.scores.attention >= 4) steps.push('Prepare onboarding for high engagement');
        break;

      case 'CONSIDER':
        steps.push('Run user research to validate assumptions');
        steps.push('Build a lightweight prototype/MVP');
        steps.push('Set go/no-go criteria');
        steps.push('Re-evaluate BAT scores with new data');
        break;

      case 'DONT_BUILD':
        steps.push('Document decision rationale');
        if (eval_.scores.attention <= 2) {
          steps.push('Consider if problem is worth solving at all');
        }
        if (eval_.scores.brand <= 2) {
          steps.push('Evaluate buy vs build alternatives');
        }
        steps.push('Revisit in 3-6 months if market changes');
        break;
    }

    return steps;
  }

  evaluate(
    name: string,
    scores: BATScores,
    context?: { goal?: string; market?: string }
  ): FeatureEvaluation {
    const totalScore = this.calculateScore(scores);
    const recommendation = this.getRecommendation(totalScore);

    const eval_: FeatureEvaluation = {
      name,
      goal: context?.goal,
      market: context?.market,
      scores,
      totalScore,
      recommendation,
      rationale: '',
      nextSteps: []
    };

    eval_.rationale = this.generateRationale(eval_);
    eval_.nextSteps = this.generateNextSteps(eval_);

    return eval_;
  }

  formatStars(score: number): string {
    const filled = '⭐'.repeat(score);
    const empty = '  '.repeat(5 - score);
    return `${filled}${empty}`;
  }

  printEvaluation(eval_: FeatureEvaluation): void {
    console.log('');
    console.log(chalk.bold('='.repeat(60)));
    console.log(chalk.bold(`📊 Feature Evaluation: ${eval_.name}`));
    console.log(chalk.bold('='.repeat(60)));

    if (eval_.goal) {
      console.log(chalk.gray(`Goal: ${eval_.goal}`));
    }
    if (eval_.market) {
      console.log(chalk.gray(`Market: ${eval_.market}`));
    }
    console.log('');

    // BAT Breakdown
    console.log(chalk.bold('BAT Framework Scores:'));
    console.log('');
    
    console.log(`🎨 Brand     ${this.formatStars(eval_.scores.brand)} ${eval_.scores.brand}/5`);
    console.log(chalk.gray(`   ${BRAND_DESCRIPTIONS[eval_.scores.brand]}`));
    console.log('');
    
    console.log(`👁 Attention ${this.formatStars(eval_.scores.attention)} ${eval_.scores.attention}/5`);
    console.log(chalk.gray(`   ${ATTENTION_DESCRIPTIONS[eval_.scores.attention]}`));
    console.log('');
    
    console.log(`🔐 Trust     ${this.formatStars(eval_.scores.trust)} ${eval_.scores.trust}/5`);
    console.log(chalk.gray(`   ${TRUST_DESCRIPTIONS[eval_.scores.trust]}`));
    console.log('');

    console.log(chalk.bold('-'.repeat(40)));
    console.log(`Total Score: ${eval_.totalScore}/15 ${eval_.totalScore >= 10 ? chalk.green('✓') : chalk.yellow('○')}`);
    console.log('');

    // Recommendation
    console.log(chalk.bold('Recommendation:'));
    console.log(this.getRecommendationLabel(eval_.recommendation));
    console.log('');

    // Rationale
    console.log(chalk.bold('Rationale:'));
    console.log(eval_.rationale);
    console.log('');

    // Next Steps
    console.log(chalk.bold('Next Steps:'));
    eval_.nextSteps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });
    console.log('');

    // Build vs Buy guidance
    console.log(chalk.bold('Build vs Buy Analysis:'));
    if (eval_.recommendation === 'BUILD') {
      console.log(chalk.green('  • This is a core differentiator - BUILD it'));
      console.log(chalk.gray('  • Invest in making it exceptional'));
    } else if (eval_.recommendation === 'CONSIDER') {
      console.log(chalk.yellow('  • Gather more data before deciding'));
      console.log(chalk.gray('  • Consider if buying could accelerate time-to-market'));
    } else {
      console.log(chalk.red('  • Not worth building - BUY or SKIP'));
      console.log(chalk.gray('  • Focus engineering on higher-impact work'));
    }
    console.log('');
    console.log(chalk.bold('='.repeat(60)));
  }
}

// Example comparisons
export const EXAMPLE_COMPARISONS = [
  { feature: 'AI Chat', brand: 5, attention: 5, trust: 3, decision: 'BUILD' },
  { feature: 'Auth System', brand: 2, attention: 5, trust: 5, decision: 'BUY (Auth0)' },
  { feature: 'Analytics', brand: 3, attention: 4, trust: 4, decision: 'BUY (Mixpanel)' },
  { feature: 'Mobile App', brand: 4, attention: 5, trust: 4, decision: 'BUILD' },
  { feature: 'PDF Export', brand: 2, attention: 2, trust: 3, decision: 'DON\'T BUILD' }
];

export async function planCEOReview(options: {
  feature: string;
  goal?: string;
  market?: string;
  brand: number;
  attention: number;
  trust: number;
  configPath?: string;
  telegram?: boolean;
}): Promise<FeatureEvaluation> {
  const rawConfig = loadConfig(options.configPath);
  const config = rawConfig as { ceoReview?: CEOReviewConfig; telegram?: TelegramConfig };
  const reviewConfig = config.ceoReview || {};

  const framework = new BATFramework(reviewConfig);

  console.log(chalk.bold('\n📊 Plan CEO Review - BAT Framework\n'));

  const scores: BATScores = {
    brand: Math.max(0, Math.min(5, options.brand)),
    attention: Math.max(0, Math.min(5, options.attention)),
    trust: Math.max(0, Math.min(5, options.trust))
  };

  const evaluation = framework.evaluate(options.feature, scores, {
    goal: options.goal,
    market: options.market
  });

  framework.printEvaluation(evaluation);

  // Send Telegram notification if requested
  if (options.telegram && config.telegram?.enabled) {
    const status = evaluation.recommendation === 'BUILD' ? '✅ BUILD' : 
                   evaluation.recommendation === 'CONSIDER' ? '🤔 CONSIDER' : '❌ SKIP';
    
    const message = `📊 **CEO Review: ${options.feature}**\n\n` +
      `Score: ${evaluation.totalScore}/15\n` +
      `Brand: ${scores.brand}/5 | Attention: ${scores.attention}/5 | Trust: ${scores.trust}/5\n\n` +
      `**${status}**\n\n` +
      `${evaluation.rationale.substring(0, 500)}`;

    await sendTelegramNotification(config.telegram, message);
  }

  return evaluation;
}

export { loadConfig, EXAMPLE_COMPARISONS, BRAND_DESCRIPTIONS, ATTENTION_DESCRIPTIONS, TRUST_DESCRIPTIONS };
