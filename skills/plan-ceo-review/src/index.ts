import chalk from 'chalk';
import { createInterface } from 'readline';

export interface CEORviewOptions {
  feature: string;
  brand?: number;
  attention?: number;
  trust?: number;
  goal?: string;
  interactive?: boolean;
}

interface BATScore {
  brand: number;
  attention: number;
  trust: number;
}

interface CEORviewResult {
  feature: string;
  goal?: string;
  scores: BATScore;
  totalStars: number;
  recommendation: 'build' | 'consider' | 'skip';
  reasoning: string;
  nextSteps: string[];
}

const BAT_DESCRIPTIONS = {
  brand: {
    name: 'Brand',
    description: 'Does this strengthen our brand and market position?',
    criteria: [
      '5: Category-defining, creates new market perception',
      '4: Significantly enhances brand differentiation',
      '3: Neutral or slight brand improvement',
      '2: Minimal brand impact',
      '1: Potential brand dilution',
      '0: Actively damages brand'
    ]
  },
  attention: {
    name: 'Attention',
    description: 'Will this capture meaningful user attention and engagement?',
    criteria: [
      '5: Viral potential, massive organic reach',
      '4: Strong organic growth and engagement',
      '3: Moderate engagement, some viral potential',
      '2: Limited attention capture',
      '1: Hard to get noticed',
      '0: No attention mechanism'
    ]
  },
  trust: {
    name: 'Trust',
    description: 'Does this build or leverage user trust?',
    criteria: [
      '5: Establishes new trust paradigm in industry',
      '4: Significantly increases user trust',
      '3: Maintains or slightly improves trust',
      '2: Trust-neutral',
      '1: Slight trust concerns',
      '0: Major trust risks'
    ]
  }
};

function calculateRecommendation(scores: BATScore): { recommendation: CEORviewResult['recommendation']; reasoning: string } {
  const total = scores.brand + scores.attention + scores.trust;
  const above3 = [scores.brand, scores.attention, scores.trust].filter(s => s >= 3).length;
  
  if (total >= 10 && above3 >= 2) {
    return {
      recommendation: 'build',
      reasoning: `Strong BAT score (${total}/15) with ${above3}/3 categories scoring 3+. Clear strategic fit.`
    };
  }
  
  if (total >= 7 && above3 >= 2) {
    return {
      recommendation: 'consider',
      reasoning: `Moderate BAT score (${total}/15). Worth exploring but needs validation.`
    };
  }
  
  const lowScores = [];
  if (scores.brand < 2) lowScores.push('brand');
  if (scores.attention < 2) lowScores.push('attention');
  if (scores.trust < 2) lowScores.push('trust');
  
  return {
    recommendation: 'skip',
    reasoning: `Low BAT score (${total}/15). Weak in: ${lowScores.join(', ')}. Resources better spent elsewhere.`
  };
}

function generateNextSteps(result: CEORviewResult): string[] {
  const steps: string[] = [];
  
  if (result.recommendation === 'build') {
    steps.push('✅ Prioritize in roadmap - allocate resources immediately');
    steps.push('📊 Define success metrics and tracking');
    steps.push('🎯 Create detailed spec and timeline');
    steps.push('👥 Assign team and kick off within 2 weeks');
    
    if (result.scores.brand >= 4) {
      steps.push('📣 Prepare marketing/PR strategy for launch');
    }
    if (result.scores.attention >= 4) {
      steps.push('🚀 Plan viral/growth mechanisms');
    }
  } else if (result.recommendation === 'consider') {
    steps.push('🧪 Run 2-week validation experiment');
    steps.push('📋 Create low-fidelity prototype or landing page');
    steps.push('👥 Interview 5-10 target users');
    steps.push('📊 Measure actual interest vs. predicted');
    
    // Suggest improvements
    if (result.scores.brand < 3) {
      steps.push('💡 Explore: How can we strengthen brand alignment?');
    }
    if (result.scores.attention < 3) {
      steps.push('💡 Explore: What would make this more attention-grabbing?');
    }
    if (result.scores.trust < 3) {
      steps.push('💡 Explore: How can we build more trust into the experience?');
    }
    
    steps.push('🔄 Re-score after validation and decide: build/pivot/kill');
  } else {
    steps.push('❌ Do not build at this time');
    steps.push('📝 Document why this was rejected (BAT scores)');
    steps.push('💾 Archive idea - revisit in 6-12 months if market changes');
    
    // Alternative suggestions
    if (result.goal) {
      steps.push(`🔍 Research alternative approaches to achieve: ${result.goal}`);
    }
  }
  
  return steps;
}

async function promptForScore(category: keyof typeof BAT_DESCRIPTIONS): Promise<number> {
  const info = BAT_DESCRIPTIONS[category];
  
  console.log(chalk.blue.bold(`\n${info.name}`));
  console.log(chalk.gray(info.description));
  console.log();
  
  for (const criterion of info.criteria) {
    console.log(chalk.gray(`  ${criterion}`));
  }
  
  console.log();
  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(chalk.yellow(`Score (0-5): `), (answer) => {
      rl.close();
      const score = parseInt(answer.trim(), 10);
      if (isNaN(score) || score < 0 || score > 5) {
        console.log(chalk.red('Invalid score. Using 2.'));
        resolve(2);
      } else {
        resolve(score);
      }
    });
  });
}

export async function ceoReview(options: CEORviewOptions): Promise<CEORviewResult> {
  console.log(chalk.blue.bold('\n📊 CEO Review - BAT Framework\n'));
  console.log(chalk.gray('10-Star Methodology: 2/3 categories must score 3+ with 10+ total stars to build\n'));
  
  let scores: BATScore;
  
  if (options.interactive || 
      options.brand === undefined || 
      options.attention === undefined || 
      options.trust === undefined) {
    console.log(chalk.blue(`Feature: ${options.feature}`));
    if (options.goal) {
      console.log(chalk.gray(`Goal: ${options.goal}`));
    }
    console.log();
    
    scores = {
      brand: options.brand ?? await promptForScore('brand'),
      attention: options.attention ?? await promptForScore('attention'),
      trust: options.trust ?? await promptForScore('trust')
    };
  } else {
    scores = {
      brand: options.brand,
      attention: options.attention,
      trust: options.trust
    };
  }
  
  const totalStars = scores.brand + scores.attention + scores.trust;
  const { recommendation, reasoning } = calculateRecommendation(scores);
  
  const result: CEORviewResult = {
    feature: options.feature,
    goal: options.goal,
    scores,
    totalStars,
    recommendation,
    reasoning,
    nextSteps: []
  };
  
  result.nextSteps = generateNextSteps(result);
  
  // Output results
  console.log(chalk.gray('\n' + '═'.repeat(50)));
  console.log(chalk.blue.bold('📋 BAT Scorecard'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log();
  console.log(chalk.white(`Feature: ${result.feature}`));
  if (result.goal) {
    console.log(chalk.gray(`Goal: ${result.goal}`));
  }
  console.log();
  
  // Score bars
  const maxBar = 20;
  const brandBar = Math.round((scores.brand / 5) * maxBar);
  const attentionBar = Math.round((scores.attention / 5) * maxBar);
  const trustBar = Math.round((scores.trust / 5) * maxBar);
  
  console.log(`Brand:     ${'█'.repeat(brandBar)}${'░'.repeat(maxBar - brandBar)} ${scores.brand}/5`);
  console.log(`Attention: ${'█'.repeat(attentionBar)}${'░'.repeat(maxBar - attentionBar)} ${scores.attention}/5`);
  console.log(`Trust:     ${'█'.repeat(trustBar)}${'░'.repeat(maxBar - trustBar)} ${scores.trust}/5`);
  console.log();
  console.log(chalk.bold(`Total: ${totalStars}/15 stars`));
  console.log();
  
  // Recommendation
  const recColor = recommendation === 'build' ? chalk.green : 
                   recommendation === 'consider' ? chalk.yellow : chalk.red;
  
  console.log(chalk.gray('─'.repeat(50)));
  console.log(recColor.bold(`📣 Recommendation: ${recommendation.toUpperCase()}`));
  console.log(chalk.gray(reasoning));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();
  
  // Next steps
  console.log(chalk.blue.bold('🎯 Next Steps:'));
  for (const step of result.nextSteps) {
    console.log(`  ${step}`);
  }
  
  console.log(chalk.gray('\n' + '═'.repeat(50) + '\n'));
  
  return result;
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const feature = args.find(a => a.startsWith('--feature='))?.split('=')[1];
  const brand = args.find(a => a.startsWith('--brand='))?.split('=')[1];
  const attention = args.find(a => a.startsWith('--attention='))?.split('=')[1];
  const trust = args.find(a => a.startsWith('--trust='))?.split('=')[1];
  const goal = args.find(a => a.startsWith('--goal='))?.split('=')[1];
  const interactive = args.includes('--interactive');
  
  if (!feature) {
    console.error(chalk.red('Usage: ceo-review --feature="Feature Name" [--brand=N] [--attention=N] [--trust=N]'));
    console.error(chalk.gray('Or use --interactive for guided scoring'));
    process.exit(1);
  }
  
  ceoReview({
    feature,
    brand: brand ? parseFloat(brand) : undefined,
    attention: attention ? parseFloat(attention) : undefined,
    trust: trust ? parseFloat(trust) : undefined,
    goal,
    interactive
  }).then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(chalk.red(err.message));
    process.exit(1);
  });
}
