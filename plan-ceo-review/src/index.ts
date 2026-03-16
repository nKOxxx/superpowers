import chalk from 'chalk';

interface ReviewOptions {
  brand?: number;
  attention?: number;
  trust?: number;
  auto: boolean;
  json: boolean;
}

interface BATScores {
  brand: number;
  attention: number;
  trust: number;
}

interface ReviewResult {
  description: string;
  name: string;
  scores: BATScores;
  total: number;
  threshold: number;
  passed: boolean;
  recommendation: 'build' | 'consider' | 'dont-build';
  reasoning: string;
  nextSteps: string[];
}

const RECOMMENDATION_THRESHOLDS = {
  build: 10,      // 2/3 of 15 (max score)
  consider: 7.5,  // 1/2 of 15
};

export async function ceoReview(options: {
  feature: string;
  brand?: number;
  attention?: number;
  trust?: number;
  goal?: string;
  interactive?: boolean;
}): Promise<void> {
  const reviewOptions: ReviewOptions = {
    brand: options.brand,
    attention: options.attention,
    trust: options.trust,
    auto: !options.brand && !options.attention && !options.trust,
    json: false,
  };
  return reviewCommand(options.feature, reviewOptions);
}

export async function reviewCommand(description: string, options: ReviewOptions): Promise<void> {
  // Parse description
  const { name, desc } = parseDescription(description);
  
  // Calculate or use provided scores
  let scores: BATScores;
  
  if (options.auto || (!options.brand && !options.attention && !options.trust)) {
    scores = autoCalculateScores(name, desc);
  } else {
    scores = {
      brand: clampScore(options.brand ?? 3),
      attention: clampScore(options.attention ?? 3),
      trust: clampScore(options.trust ?? 3),
    };
  }
  
  // Generate review
  const result = generateReview(name, desc, scores);
  
  // Output
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printReview(result);
  }
}

function parseDescription(description: string): { name: string; desc: string } {
  const parts = description.split(':');
  if (parts.length >= 2) {
    return {
      name: parts[0].trim(),
      desc: parts.slice(1).join(':').trim(),
    };
  }
  return {
    name: 'Unnamed Feature',
    desc: description,
  };
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(5, score));
}

function autoCalculateScores(name: string, description: string): BATScores {
  const text = (name + ' ' + description).toLowerCase();
  
  // Brand indicators
  const brandIndicators = [
    'brand', 'identity', 'recognition', 'market position', 'premium',
    'reputation', 'authority', 'thought leadership', 'unique',
  ];
  let brandScore = 3;
  for (const indicator of brandIndicators) {
    if (text.includes(indicator)) brandScore += 0.5;
  }
  
  // Attention indicators
  const attentionIndicators = [
    'engagement', 'viral', 'growth', 'traffic', 'acquisition',
    'retention', 'user', 'customer', 'marketing', 'seo',
    'social', 'share', 'discover', 'notification',
  ];
  let attentionScore = 3;
  for (const indicator of attentionIndicators) {
    if (text.includes(indicator)) attentionScore += 0.5;
  }
  
  // Trust indicators
  const trustIndicators = [
    'security', 'privacy', 'reliable', 'transparent', 'verified',
    'guarantee', 'compliance', 'audit', 'safe', 'protect',
    'authentic', 'proven', 'trusted', 'expert',
  ];
  let trustScore = 3;
  for (const indicator of trustIndicators) {
    if (text.includes(indicator)) trustScore += 0.5;
  }
  
  return {
    brand: clampScore(brandScore),
    attention: clampScore(attentionScore),
    trust: clampScore(trustScore),
  };
}

function generateReview(name: string, description: string, scores: BATScores): ReviewResult {
  const total = scores.brand + scores.attention + scores.trust;
  const threshold = RECOMMENDATION_THRESHOLDS.build;
  const passed = total >= threshold;
  
  let recommendation: 'build' | 'consider' | 'dont-build';
  if (total >= RECOMMENDATION_THRESHOLDS.build) {
    recommendation = 'build';
  } else if (total >= RECOMMENDATION_THRESHOLDS.consider) {
    recommendation = 'consider';
  } else {
    recommendation = 'dont-build';
  }
  
  const reasoning = generateReasoning(scores, total, recommendation);
  const nextSteps = generateNextSteps(scores, recommendation);
  
  return {
    description,
    name,
    scores,
    total,
    threshold,
    passed,
    recommendation,
    reasoning,
    nextSteps,
  };
}

function generateReasoning(scores: BATScores, total: number, recommendation: string): string {
  const parts: string[] = [];
  
  // Overall assessment
  if (recommendation === 'build') {
    parts.push('This feature/product scores well across the BAT framework (2/3 criteria met).');
  } else if (recommendation === 'consider') {
    parts.push('This feature/product shows promise but has gaps in the BAT framework (1/3 criteria met).');
  } else {
    parts.push('This feature/product does not meet the BAT threshold for immediate investment (0/3 criteria met).');
  }
  
  // Individual dimension analysis
  parts.push('\nDimension Analysis:');
  
  parts.push(`\n${getScoreEmoji(scores.brand)} Brand (${scores.brand}/5):`);
  if (scores.brand >= 4) {
    parts.push('Strong brand alignment. This enhances market position and differentiation.');
  } else if (scores.brand >= 2.5) {
    parts.push('Moderate brand impact. Consider how to strengthen unique positioning.');
  } else {
    parts.push('Weak brand connection. May not contribute to long-term brand equity.');
  }
  
  parts.push(`\n${getScoreEmoji(scores.attention)} Attention (${scores.attention}/5):`);
  if (scores.attention >= 4) {
    parts.push('High attention potential. Strong user engagement and growth opportunities.');
  } else if (scores.attention >= 2.5) {
    parts.push('Moderate attention capture. May need marketing amplification.');
  } else {
    parts.push('Low attention value. Difficult to acquire and retain users.');
  }
  
  parts.push(`\n${getScoreEmoji(scores.trust)} Trust (${scores.trust}/5):`);
  if (scores.trust >= 4) {
    parts.push('High trust factor. Builds user confidence and reduces friction.');
  } else if (scores.trust >= 2.5) {
    parts.push('Moderate trust. Address potential credibility concerns.');
  } else {
    parts.push('Trust concerns. Users may hesitate to adopt or engage.');
  }
  
  return parts.join(' ');
}

function generateNextSteps(scores: BATScores, recommendation: string): string[] {
  const steps: string[] = [];
  
  if (recommendation === 'build') {
    steps.push('Prioritize this in the roadmap');
    steps.push('Assign dedicated team/resources');
    steps.push('Define success metrics and timeline');
    steps.push('Begin detailed technical and market specification');
  } else if (recommendation === 'consider') {
    steps.push('Identify gaps in the weakest BAT dimension');
    steps.push('Prototype or research to validate assumptions');
    steps.push('Re-evaluate after addressing key concerns');
    steps.push('Consider as secondary priority');
  } else {
    steps.push('Deprioritize or reject for now');
    steps.push('Revisit if market conditions change');
    steps.push('Consider pivoting the concept to address BAT gaps');
  }
  
  // Dimension-specific recommendations
  if (scores.brand < 3) {
    steps.push('Workshop: How can this strengthen brand positioning?');
  }
  if (scores.attention < 3) {
    steps.push('Research: What would make this more engaging/discoverable?');
  }
  if (scores.trust < 3) {
    steps.push('Audit: Identify trust blockers and mitigation strategies');
  }
  
  return steps;
}

function getScoreEmoji(score: number): string {
  if (score >= 4) return '🟢';
  if (score >= 2.5) return '🟡';
  return '🔴';
}

function printReview(result: ReviewResult): void {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════'));
  console.log(chalk.blue.bold('     BAT FRAMEWORK CEO REVIEW'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════\n'));
  
  console.log(chalk.white.bold(`📋 ${result.name}\n`));
  console.log(chalk.gray(result.description));
  console.log();
  
  // Scores
  console.log(chalk.blue('📊 BAT Scores:'));
  console.log(`  ${getScoreEmoji(result.scores.brand)} Brand:     ${formatScore(result.scores.brand)}/5`);
  console.log(`  ${getScoreEmoji(result.scores.attention)} Attention: ${formatScore(result.scores.attention)}/5`);
  console.log(`  ${getScoreEmoji(result.scores.trust)} Trust:     ${formatScore(result.scores.trust)}/5`);
  console.log(chalk.gray(`  ───────────────────────`));
  console.log(`  ${chalk.bold('Total:')}     ${chalk.bold(result.total.toFixed(1))}/15`);
  console.log(chalk.gray(`  Threshold: ${result.threshold}/15 (2/3 criteria)`));
  console.log();
  
  // Recommendation
  const recColor = result.recommendation === 'build' ? 'green' : 
                   result.recommendation === 'consider' ? 'yellow' : 'red';
  const recEmoji = result.recommendation === 'build' ? '✅' : 
                   result.recommendation === 'consider' ? '⚠️' : '❌';
  
  console.log(chalk[recColor].bold(`${recEmoji} RECOMMENDATION: ${result.recommendation.toUpperCase().replace('-', ' ')}\n`));
  
  // Reasoning
  console.log(chalk.blue('🤔 Reasoning:'));
  console.log(result.reasoning);
  console.log();
  
  // Next Steps
  console.log(chalk.blue('📋 Next Steps:'));
  result.nextSteps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════\n'));
}

function formatScore(score: number): string {
  return score.toFixed(1).replace('.0', '');
}
