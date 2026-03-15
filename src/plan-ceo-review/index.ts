import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'fs';

interface BATScore {
  brand: number;
  attention: number;
  trust: number;
  total: number;
}

interface TenStarRating {
  problemClarity: number;
  solutionFit: number;
  marketSize: number;
  timing: number;
  teamFit: number;
  monetization: number;
  competition: number;
  distribution: number;
  sustainability: number;
  vision: number;
  total: number;
  average: number;
}

interface CEORReview {
  feature: string;
  goal: string;
  batScore: BATScore;
  tenStar: TenStarRating;
  recommendation: 'build' | 'consider' | 'dont-build';
  reasoning: string[];
  nextSteps: string[];
  risks: string[];
  opportunities: string[];
}

interface ReviewInput {
  feature: string;
  goal: string;
  context?: string;
  marketSize?: 'small' | 'medium' | 'large';
  urgency?: 'low' | 'medium' | 'high';
  resources?: 'limited' | 'moderate' | 'abundant';
}

const BAT_DESCRIPTIONS = {
  brand: {
    name: 'Brand Alignment',
    description: 'How well does this feature align with our brand identity and values?',
    criteria: [
      '0-1: Misaligned or hurts brand',
      '2: Neutral, no brand impact',
      '3: Somewhat aligned',
      '4: Strongly aligned',
      '5: Core to brand identity'
    ]
  },
  attention: {
    name: 'Attention Capture',
    description: 'Will this feature capture and hold user attention?',
    criteria: [
      '0-1: Ignored by users',
      '2: Brief notice only',
      '3: Moderate engagement',
      '4: High engagement expected',
      '5: Viral/habit-forming potential'
    ]
  },
  trust: {
    name: 'Trust Building',
    description: 'Does this build or maintain user trust?',
    criteria: [
      '0-1: Erodes trust significantly',
      '2: Slightly negative',
      '3: Neutral',
      '4: Builds trust',
      '5: Major trust builder'
    ]
  }
};

const TEN_STAR_DESCRIPTIONS = {
  problemClarity: 'How clear and well-defined is the problem?',
  solutionFit: 'How well does the solution fit the problem?',
  marketSize: 'Size of the addressable market (1=niche, 10=massive)',
  timing: 'Is the timing right for this feature?',
  teamFit: 'Does our team have the skills to execute?',
  monetization: 'Clear path to revenue or value?',
  competition: 'Competitive landscape (10=uncontested)',
  distribution: 'Clear path to reach users?',
  sustainability: 'Long-term viability and maintenance?',
  vision: 'Alignment with long-term vision'
};

function calculateBATScore(input: ReviewInput): BATScore {
  // Algorithmic scoring based on input parameters
  let brand = 3;
  let attention = 3;
  let trust = 3;
  
  // Adjust based on urgency and resources
  if (input.urgency === 'high') {
    attention += 1;
  }
  
  if (input.resources === 'abundant') {
    brand += 1;
    trust += 1;
  }
  
  // Market size impact on attention
  if (input.marketSize === 'large') {
    attention += 1;
  } else if (input.marketSize === 'small') {
    attention -= 1;
  }
  
  // Clamp values 0-5
  brand = Math.max(0, Math.min(5, brand));
  attention = Math.max(0, Math.min(5, attention));
  trust = Math.max(0, Math.min(5, trust));
  
  return {
    brand,
    attention,
    trust,
    total: brand + attention + trust
  };
}

function calculateTenStar(input: ReviewInput): TenStarRating {
  const ratings: Partial<TenStarRating> = {};
  
  // Base calculations
  ratings.problemClarity = input.goal.length > 20 ? 7 : 5;
  ratings.solutionFit = 6; // Assume decent fit
  ratings.marketSize = input.marketSize === 'large' ? 8 : input.marketSize === 'medium' ? 6 : 4;
  ratings.timing = input.urgency === 'high' ? 8 : input.urgency === 'medium' ? 6 : 4;
  ratings.teamFit = input.resources === 'abundant' ? 8 : input.resources === 'moderate' ? 6 : 4;
  ratings.monetization = 5; // Neutral
  ratings.competition = 5; // Neutral
  ratings.distribution = 5; // Neutral
  ratings.sustainability = 6;
  ratings.vision = 7; // Generally aligned
  
  // Add some variance based on feature description
  if (input.feature.toLowerCase().includes('ai') || input.feature.toLowerCase().includes('ml')) {
    ratings.timing = Math.min(10, (ratings.timing || 0) + 1);
  }
  
  if (input.feature.toLowerCase().includes('mobile') || input.feature.toLowerCase().includes('app')) {
    ratings.marketSize = Math.min(10, (ratings.marketSize || 0) + 1);
  }
  
  // Calculate total and average
  const values = Object.values(ratings) as number[];
  const total = values.reduce((a, b) => a + b, 0);
  const average = total / values.length;
  
  return {
    ...ratings as TenStarRating,
    total,
    average
  };
}

function determineRecommendation(batScore: BATScore, tenStar: TenStarRating): 'build' | 'consider' | 'dont-build' {
  const batThreshold = 12; // Out of 15
  const tenStarThreshold = 7.0; // Out of 10
  
  if (batScore.total >= batThreshold && tenStar.average >= tenStarThreshold) {
    return 'build';
  } else if (batScore.total >= 8 && tenStar.average >= 5.0) {
    return 'consider';
  }
  return 'dont-build';
}

function generateReasoning(_input: ReviewInput, batScore: BATScore, tenStar: TenStarRating): string[] {
  const reasoning: string[] = [];
  
  // BAT reasoning
  if (batScore.brand >= 4) {
    reasoning.push('Strong brand alignment creates competitive moat');
  } else if (batScore.brand <= 2) {
    reasoning.push('Potential brand dilution risk');
  }
  
  if (batScore.attention >= 4) {
    reasoning.push('High attention capture drives user engagement');
  }
  
  if (batScore.trust >= 4) {
    reasoning.push('Trust-building enhances long-term retention');
  }
  
  // 10-star reasoning
  if (tenStar.marketSize >= 8) {
    reasoning.push('Large addressable market provides growth runway');
  }
  
  if (tenStar.timing >= 8) {
    reasoning.push('Strong timing advantage in current market');
  }
  
  if (tenStar.teamFit >= 8) {
    reasoning.push('Team capabilities align well with execution requirements');
  }
  
  if (tenStar.vision >= 8) {
    reasoning.push('Strong strategic fit with long-term vision');
  }
  
  return reasoning;
}

function generateNextSteps(recommendation: string, _input: ReviewInput): string[] {
  const steps: string[] = [];
  
  switch (recommendation) {
    case 'build':
      steps.push('Create detailed product requirements document');
      steps.push('Define success metrics and KPIs');
      steps.push('Allocate development resources');
      steps.push('Set up user feedback loops');
      steps.push('Plan phased rollout strategy');
      break;
    case 'consider':
      steps.push('Conduct user research to validate assumptions');
      steps.push('Build proof-of-concept or prototype');
      steps.push('Analyze competitive landscape more deeply');
      steps.push('Revisit resource requirements');
      steps.push('Define clear go/no-go decision criteria');
      break;
    case 'dont-build':
      steps.push('Document rationale for future reference');
      steps.push('Identify alternative approaches');
      steps.push('Revisit if market conditions change');
      steps.push('Consider as inspiration for related features');
      break;
  }
  
  return steps;
}

function generateRisks(_input: ReviewInput, tenStar: TenStarRating): string[] {
  const risks: string[] = [];
  
  if (tenStar.competition <= 4) {
    risks.push('High competitive pressure may limit differentiation');
  }
  
  if (tenStar.teamFit <= 4) {
    risks.push('Team capability gaps may require hiring or training');
  }
  
  if (_input.resources === 'limited') {
    risks.push('Limited resources may constrain execution quality');
  }
  
  if (tenStar.timing <= 4) {
    risks.push('Timing may not be optimal for market entry');
  }
  
  risks.push('Scope creep could delay delivery');
  risks.push('User adoption may be slower than projected');
  
  return risks;
}

function generateOpportunities(input: ReviewInput, tenStar: TenStarRating): string[] {
  const opportunities: string[] = [];
  
  if (tenStar.vision >= 7) {
    opportunities.push('Positions company for long-term strategic goals');
  }
  
  if (tenStar.monetization >= 7) {
    opportunities.push('Clear path to revenue generation');
  }
  
  if (input.marketSize === 'large') {
    opportunities.push('Large market provides significant growth potential');
  }
  
  opportunities.push('Feature could become platform differentiator');
  opportunities.push('May open new partnership or integration opportunities');
  
  return opportunities;
}

async function runCEOReview(input: ReviewInput, options: { output?: string; json?: boolean }): Promise<void> {
  const spinner = ora('Analyzing feature with CEO framework...').start();
  
  try {
    // Calculate scores
    const batScore = calculateBATScore(input);
    const tenStar = calculateTenStar(input);
    const recommendation = determineRecommendation(batScore, tenStar);
    const reasoning = generateReasoning(input, batScore, tenStar);
    const nextSteps = generateNextSteps(recommendation, input);
    const risks = generateRisks(input, tenStar);
    const opportunities = generateOpportunities(input, tenStar);
    
    const review: CEORReview = {
      feature: input.feature,
      goal: input.goal,
      batScore,
      tenStar,
      recommendation,
      reasoning,
      nextSteps,
      risks,
      opportunities
    };
    
    spinner.succeed('CEO Review complete');
    
    if (options.json) {
      console.log(JSON.stringify(review, null, 2));
      
      if (options.output) {
        writeFileSync(options.output, JSON.stringify(review, null, 2));
        console.log(chalk.gray(`\nSaved to: ${options.output}`));
      }
      return;
    }
    
    // Print formatted review
    console.log('\n' + chalk.cyan('═'.repeat(70)));
    console.log(chalk.bold('  🎯 CEO REVIEW: PRODUCT STRATEGY ANALYSIS'));
    console.log(chalk.cyan('═'.repeat(70)));
    
    console.log(`\n  ${chalk.bold('Feature:')} ${input.feature}`);
    console.log(`  ${chalk.bold('Goal:')} ${input.goal}`);
    
    // BAT Framework
    console.log('\n' + chalk.yellow('  📊 BAT FRAMEWORK SCORES (0-5 each)'));
    console.log('  ' + '─'.repeat(50));
    console.log(`  ${chalk.bold('Brand Alignment:')}   ${renderScore(batScore.brand, 5)} ${batScore.brand}/5`);
    console.log(`  ${chalk.bold('Attention Capture:')}  ${renderScore(batScore.attention, 5)} ${batScore.attention}/5`);
    console.log(`  ${chalk.bold('Trust Building:')}    ${renderScore(batScore.trust, 5)} ${batScore.trust}/5`);
    console.log('  ' + '─'.repeat(50));
    console.log(`  ${chalk.bold('BAT Total:')}          ${chalk.cyan(batScore.total)}/15 ${renderVerdict(batScore.total >= 12)}`);
    
    // 10-Star Methodology
    console.log('\n' + chalk.yellow('  ⭐ 10-STAR METHODOLOGY'));
    console.log('  ' + '─'.repeat(50));
    console.log(`  ${'Problem Clarity:'.padEnd(18)} ${renderScore(tenStar.problemClarity, 10)} ${tenStar.problemClarity}/10`);
    console.log(`  ${'Solution Fit:'.padEnd(18)} ${renderScore(tenStar.solutionFit, 10)} ${tenStar.solutionFit}/10`);
    console.log(`  ${'Market Size:'.padEnd(18)} ${renderScore(tenStar.marketSize, 10)} ${tenStar.marketSize}/10`);
    console.log(`  ${'Timing:'.padEnd(18)} ${renderScore(tenStar.timing, 10)} ${tenStar.timing}/10`);
    console.log(`  ${'Team Fit:'.padEnd(18)} ${renderScore(tenStar.teamFit, 10)} ${tenStar.teamFit}/10`);
    console.log(`  ${'Monetization:'.padEnd(18)} ${renderScore(tenStar.monetization, 10)} ${tenStar.monetization}/10`);
    console.log(`  ${'Competition:'.padEnd(18)} ${renderScore(tenStar.competition, 10)} ${tenStar.competition}/10`);
    console.log(`  ${'Distribution:'.padEnd(18)} ${renderScore(tenStar.distribution, 10)} ${tenStar.distribution}/10`);
    console.log(`  ${'Sustainability:'.padEnd(18)} ${renderScore(tenStar.sustainability, 10)} ${tenStar.sustainability}/10`);
    console.log(`  ${'Vision Alignment:'.padEnd(18)} ${renderScore(tenStar.vision, 10)} ${tenStar.vision}/10`);
    console.log('  ' + '─'.repeat(50));
    console.log(`  ${chalk.bold('Average:')}           ${chalk.cyan(tenStar.average.toFixed(1))}/10 ${renderVerdict(tenStar.average >= 7)}`);
    console.log(`  ${chalk.bold('Total:')}             ${chalk.cyan(tenStar.total)}/100`);
    
    // Recommendation
    console.log('\n' + chalk.yellow('  🎯 RECOMMENDATION'));
    console.log('  ' + '─'.repeat(50));
    const recColor = recommendation === 'build' ? 'green' : recommendation === 'consider' ? 'yellow' : 'red';
    const recEmoji = recommendation === 'build' ? '✅' : recommendation === 'consider' ? '⚠️' : '❌';
    const recText = recommendation === 'build' ? 'BUILD' : recommendation === 'consider' ? 'CONSIDER' : "DON'T BUILD";
    console.log(`  ${recEmoji} ${chalk[recColor].bold(recText)}`);
    
    // Reasoning
    console.log('\n' + chalk.yellow('  💡 KEY REASONING'));
    reasoning.forEach(r => console.log(`  • ${r}`));
    
    // Opportunities
    console.log('\n' + chalk.green('  🚀 OPPORTUNITIES'));
    opportunities.forEach(o => console.log(`  • ${o}`));
    
    // Risks
    console.log('\n' + chalk.red('  ⚠️  RISKS'));
    risks.forEach(r => console.log(`  • ${r}`));
    
    // Next Steps
    console.log('\n' + chalk.cyan('  📋 NEXT STEPS'));
    nextSteps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
    
    console.log('\n' + chalk.cyan('═'.repeat(70)) + '\n');
    
    // Save if output specified
    if (options.output) {
      writeFileSync(options.output, JSON.stringify(review, null, 2));
      console.log(chalk.gray(`Saved review to: ${options.output}\n`));
    }
    
  } catch (error) {
    spinner.fail(chalk.red(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

function renderScore(score: number, max: number): string {
  const filled = Math.round((score / max) * 5);
  const empty = 5 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return chalk.gray('[') + bar + chalk.gray(']');
}

function renderVerdict(passed: boolean): string {
  return passed ? chalk.green('✓') : chalk.red('✗');
}

const program = new Command();

program
  .name('plan-ceo-review')
  .description('Product strategy with BAT framework')
  .version('1.0.0');

program
  .argument('<feature>', 'Feature name to review')
  .argument('<goal>', 'Goal/objective of the feature')
  .option('-c, --context <text>', 'Additional context about the feature')
  .option('-m, --market-size <size>', 'Market size (small, medium, large)', 'medium')
  .option('-u, --urgency <level>', 'Urgency level (low, medium, high)', 'medium')
  .option('-r, --resources <level>', 'Available resources (limited, moderate, abundant)', 'moderate')
  .option('-o, --output <path>', 'Save review to JSON file')
  .option('--json', 'Output as JSON')
  .option('--frameworks', 'Show BAT and 10-star framework details')
  .action(async (feature, goal, options) => {
    if (options.frameworks) {
      showFrameworks();
      return;
    }
    
    const input: ReviewInput = {
      feature,
      goal,
      context: options.context,
      marketSize: options.marketSize,
      urgency: options.urgency,
      resources: options.resources
    };
    
    await runCEOReview(input, { output: options.output, json: options.json });
  });

program
  .command('framework')
  .description('Show BAT and 10-star methodology details')
  .action(() => {
    showFrameworks();
  });

function showFrameworks(): void {
  console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║         BAT FRAMEWORK - Strategic Decision Making                  ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════════════════╝\n'));
  
  for (const [, desc] of Object.entries(BAT_DESCRIPTIONS)) {
    console.log(chalk.yellow(`${desc.name.toUpperCase()}`));
    console.log(chalk.gray(`  ${desc.description}`));
    console.log(chalk.gray('  Scoring:'));
    for (const criterion of desc.criteria) {
      console.log(chalk.gray(`    ${criterion}`));
    }
    console.log('');
  }
  
  console.log(chalk.cyan('╔════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║         10-STAR METHODOLOGY - Product Evaluation                   ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════════════════╝\n'));
  
  for (const [key, desc] of Object.entries(TEN_STAR_DESCRIPTIONS)) {
    const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(chalk.yellow(`${name.padEnd(18)}`) + chalk.gray(desc));
  }
  
  console.log(chalk.gray('\n  Scoring: 1-10 stars per criterion'));
  console.log(chalk.gray('  Thresholds:'));
  console.log(chalk.green('    8.0+   → Strong candidate (BUILD)'));
  console.log(chalk.yellow('    6.0-7.9 → Marginal (CONSIDER)'));
  console.log(chalk.red('    <6.0   → Weak candidate (DON\'T BUILD)'));
  console.log('');
}

// Run if called directly
if (require.main === module) {
  program.parse();
}

export { runCEOReview, calculateBATScore, calculateTenStar, determineRecommendation };
export type { BATScore, TenStarRating, CEORReview, ReviewInput };