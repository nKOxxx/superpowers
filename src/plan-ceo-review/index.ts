import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

interface CEOReviewOptions {
  brand?: number;
  attention?: number;
  trust?: number;
  goal?: string;
}

interface BATScore {
  brand: number;
  attention: number;
  trust: number;
  total: number;
}

interface ReviewResult {
  feature: string;
  goal: string;
  scores: BATScore;
  verdict: 'build' | 'consider' | 'dont-build';
  reasons: string[];
  nextSteps: string[];
}

function calculateScore(scores: Partial<BATScore>): BATScore {
  const brand = Math.min(5, Math.max(0, scores.brand || 0));
  const attention = Math.min(5, Math.max(0, scores.attention || 0));
  const trust = Math.min(5, Math.max(0, scores.trust || 0));
  
  return {
    brand,
    attention,
    trust,
    total: brand + attention + trust
  };
}

function getVerdict(scores: BATScore): { verdict: 'build' | 'consider' | 'dont-build'; reasons: string[] } {
  const highScores = [scores.brand, scores.attention, scores.trust].filter(s => s >= 4).length;
  const lowScores = [scores.brand, scores.attention, scores.trust].filter(s => s <= 2).length;
  const reasons: string[] = [];
  
  // 10-star methodology: need at least 2/3 categories at 4+ (out of 5)
  if (scores.total >= 10 && highScores >= 2) {
    if (scores.brand >= 4) reasons.push('Strong brand alignment');
    if (scores.attention >= 4) reasons.push('High attention potential');
    if (scores.trust >= 4) reasons.push('Builds significant trust');
    return { verdict: 'build', reasons };
  }
  
  // 6-9 stars: borderline, needs more consideration
  if (scores.total >= 6) {
    if (scores.brand >= 3) reasons.push('Moderate brand fit');
    if (scores.attention >= 3) reasons.push('Some attention potential');
    if (scores.trust >= 3) reasons.push('Moderate trust building');
    
    if (scores.brand < 3) reasons.push('Weak brand alignment - needs positioning work');
    if (scores.attention < 3) reasons.push('Low attention - distribution strategy needed');
    if (scores.trust < 3) reasons.push('Trust issues - credibility plan required');
    
    return { verdict: 'consider', reasons };
  }
  
  // Below 6: don't build
  if (scores.brand < 3) reasons.push('Poor brand fit');
  if (scores.attention < 3) reasons.push('Low attention capture');
  if (scores.trust < 3) reasons.push('Does not build trust');
  
  return { verdict: 'dont-build', reasons };
}

function generateNextSteps(result: ReviewResult): string[] {
  const steps: string[] = [];
  
  if (result.verdict === 'build') {
    steps.push('Define MVP scope and success metrics');
    steps.push('Create detailed product spec');
    steps.push('Estimate resources and timeline');
    steps.push('Schedule kickoff with team');
  } else if (result.verdict === 'consider') {
    if (result.scores.brand < 4) {
      steps.push('Revisit brand positioning - how does this strengthen our story?');
    }
    if (result.scores.attention < 4) {
      steps.push('Develop attention strategy - what\'s the hook?');
    }
    if (result.scores.trust < 4) {
      steps.push('Identify trust-building elements to add');
    }
    steps.push('Set up 30-day experiment to validate assumptions');
    steps.push('Re-evaluate with real data before committing');
  } else {
    steps.push('Document why this doesn\'t fit current strategy');
    steps.push('Identify what would need to change for this to make sense');
    steps.push('Archive idea for future reconsideration');
    steps.push('Redirect energy to higher-scoring opportunities');
  }
  
  return steps;
}

function formatScore(value: number): string {
  const stars = '★'.repeat(value) + '☆'.repeat(5 - value);
  if (value >= 4) return chalk.green(`${value}/5 ${stars}`);
  if (value >= 3) return chalk.yellow(`${value}/5 ${stars}`);
  return chalk.red(`${value}/5 ${stars}`);
}

function autoScore(feature: string, goal: string): BATScore {
  const lowerFeature = feature.toLowerCase();
  const lowerGoal = goal.toLowerCase();
  
  let brand = 3;
  let attention = 3;
  let trust = 3;
  
  // Brand scoring keywords
  const brandBoosters = ['brand', 'identity', 'values', 'mission', 'vision', 'premium', 'quality'];
  const brandDetractors = ['cheap', 'discount', 'temporary', 'gimmick'];
  
  for (const word of brandBoosters) {
    if (lowerFeature.includes(word) || lowerGoal.includes(word)) brand++;
  }
  for (const word of brandDetractors) {
    if (lowerFeature.includes(word) || lowerGoal.includes(word)) brand--;
  }
  
  // Attention scoring keywords
  const attentionBoosters = ['viral', 'share', 'social', 'trend', 'growth', 'marketing', 'launch', 'announce'];
  const attentionDetractors = ['internal', 'backend', 'infrastructure', 'refactor', 'cleanup'];
  
  for (const word of attentionBoosters) {
    if (lowerFeature.includes(word) || lowerGoal.includes(word)) attention++;
  }
  for (const word of attentionDetractors) {
    if (lowerFeature.includes(word) || lowerGoal.includes(word)) attention--;
  }
  
  // Trust scoring keywords
  const trustBoosters = ['security', 'privacy', 'reliability', 'support', 'guarantee', 'transparent', 'verified'];
  const trustDetractors = ['experimental', 'beta', 'risky', 'unproven', 'sketchy'];
  
  for (const word of trustBoosters) {
    if (lowerFeature.includes(word) || lowerGoal.includes(word)) trust++;
  }
  for (const word of trustDetractors) {
    if (lowerFeature.includes(word) || lowerGoal.includes(word)) trust--;
  }
  
  return calculateScore({ brand, attention, trust });
}

export const ceoReviewCommand = new Command('ceo-review')
  .description('BAT framework product strategy review - Brand, Attention, Trust scoring')
  .argument('<feature>', 'Feature description (e.g., "Mobile App: User authentication")')
  .option('-g, --goal <goal>', 'Business goal this feature serves')
  .option('-b, --brand <score>', 'Brand alignment score (0-5)', parseFloat)
  .option('-a, --attention <score>', 'Attention capture score (0-5)', parseFloat)
  .option('-t, --trust <score>', 'Trust building score (0-5)', parseFloat)
  .action(async (feature: string, options: CEOReviewOptions) => {
    const spinner = ora('Analyzing feature...').start();
    
    const goal = options.goal || 'Improve product value proposition';
    
    // Use provided scores or auto-calculate
    let scores: BATScore;
    const hasManualScores = options.brand !== undefined || options.attention !== undefined || options.trust !== undefined;
    
    if (hasManualScores) {
      scores = calculateScore({
        brand: typeof options.brand === 'number' ? options.brand : undefined,
        attention: typeof options.attention === 'number' ? options.attention : undefined,
        trust: typeof options.trust === 'number' ? options.trust : undefined
      });
      spinner.text = 'Using provided scores';
    } else {
      spinner.text = 'Auto-scoring based on feature description...';
      scores = autoScore(feature, goal);
    }
    
    const { verdict, reasons } = getVerdict(scores);
    const nextSteps = generateNextSteps({ feature, goal, scores, verdict, reasons, nextSteps: [] });
    
    spinner.stop();
    
    // Output formatting
    console.log('\n' + chalk.bold('='.repeat(60)));
    console.log(chalk.bold('📊 BAT FRAMEWORK PRODUCT REVIEW'));
    console.log(chalk.bold('='.repeat(60)));
    
    console.log(chalk.cyan('\n📝 Feature:'), feature);
    console.log(chalk.cyan('🎯 Goal:'), goal);
    
    console.log(chalk.bold('\n📈 BAT Scores (10-Star Methodology):'));
    console.log(`  Brand:     ${formatScore(scores.brand)}`);
    console.log(`  Attention: ${formatScore(scores.attention)}`);
    console.log(`  Trust:     ${formatScore(scores.trust)}`);
    console.log(chalk.bold(`  ─────────────────────────`));
    
    const totalColor = scores.total >= 10 ? chalk.green : scores.total >= 6 ? chalk.yellow : chalk.red;
    console.log(totalColor(`  TOTAL:     ${scores.total}/15 stars`));
    
    // Verdict
    console.log(chalk.bold('\n🎯 Verdict:'));
    if (verdict === 'build') {
      console.log(chalk.green.bold('  ✅ BUILD') + chalk.green(' - Strong alignment, proceed with confidence'));
    } else if (verdict === 'consider') {
      console.log(chalk.yellow.bold('  ⚠️  CONSIDER') + chalk.yellow(' - Mixed signals, needs more validation'));
    } else {
      console.log(chalk.red.bold('  ❌ DON\'T BUILD') + chalk.red(' - Weak alignment, redirect efforts'));
    }
    
    // Analysis
    console.log(chalk.bold('\n📋 Analysis:'));
    for (const reason of reasons) {
      const prefix = reason.includes('Weak') || reason.includes('Poor') || reason.includes('Low') || reason.includes('Does not') 
        ? chalk.red('  •') 
        : chalk.green('  •');
      console.log(`${prefix} ${reason}`);
    }
    
    // Next steps
    console.log(chalk.bold('\n🚀 Next Steps:'));
    for (const step of nextSteps) {
      console.log(chalk.blue(`  ${step}`));
    }
    
    // BAT Threshold Reference
    console.log(chalk.gray('\n📖 BAT Thresholds:'));
    console.log(chalk.gray('  • 10+ stars (2/3 categories ≥4): Build'));
    console.log(chalk.gray('  • 6-9 stars: Consider with modifications'));
    console.log(chalk.gray('  • <6 stars: Don\'t build'));
    
    console.log('\n' + chalk.bold('='.repeat(60)) + '\n');
    
    // Exit with appropriate code for automation
    process.exit(verdict === 'build' ? 0 : verdict === 'consider' ? 1 : 2);
  });
