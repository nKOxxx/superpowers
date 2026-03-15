import chalk from 'chalk';

/**
 * Review options
 */
export interface ReviewOptions {
  brand?: number;
  attention?: number;
  trust?: number;
  auto: boolean;
  json: boolean;
}

/**
 * BAT Scores
 */
export interface BATScores {
  brand: number;
  attention: number;
  trust: number;
}

/**
 * Review result
 */
export interface ReviewResult {
  name: string;
  description: string;
  scores: BATScores;
  total: number;
  threshold: number;
  passed: boolean;
  stars: number;
  recommendation: 'build' | 'consider' | 'dont-build';
  reasoning: string;
  nextSteps: string[];
  dimensionAnalysis: DimensionAnalysis[];
}

/**
 * Dimension analysis
 */
export interface DimensionAnalysis {
  name: string;
  score: number;
  maxScore: number;
  emoji: string;
  assessment: string;
  suggestions: string[];
}

/**
 * Recommendation thresholds (10-star methodology)
 */
const RECOMMENDATION_THRESHOLDS = {
  build: 10,
  consider: 7.5,
};

/**
 * Main review command
 */
export async function reviewCommand(description: string, options: ReviewOptions): Promise<void> {
  const { name, desc } = parseDescription(description);
  
  let scores: BATScores;
  
  if (options.auto || (options.brand === undefined && options.attention === undefined && options.trust === undefined)) {
    scores = autoCalculateScores(name, desc);
    if (!options.auto) {
      console.log(chalk.gray('No scores provided, using auto-calculation. Use --auto to silence this message.'));
    }
  } else {
    scores = {
      brand: clampScore(options.brand ?? 3),
      attention: clampScore(options.attention ?? 3),
      trust: clampScore(options.trust ?? 3),
    };
  }
  
  const result = generateReview(name, desc, scores);
  
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
  
  const brandIndicators = [
    { keyword: 'brand', weight: 1 },
    { keyword: 'identity', weight: 0.8 },
    { keyword: 'recognition', weight: 0.8 },
    { keyword: 'market position', weight: 0.8 },
    { keyword: 'premium', weight: 0.7 },
    { keyword: 'reputation', weight: 0.8 },
    { keyword: 'authority', weight: 0.7 },
    { keyword: 'thought leadership', weight: 0.8 },
    { keyword: 'unique', weight: 0.6 },
    { keyword: 'differentiation', weight: 0.8 },
  ];
  
  let brandScore = 3;
  for (const indicator of brandIndicators) {
    if (text.includes(indicator.keyword)) brandScore += indicator.weight;
  }
  
  const attentionIndicators = [
    { keyword: 'engagement', weight: 1 },
    { keyword: 'viral', weight: 0.9 },
    { keyword: 'growth', weight: 0.8 },
    { keyword: 'traffic', weight: 0.7 },
    { keyword: 'acquisition', weight: 0.8 },
    { keyword: 'retention', weight: 0.8 },
    { keyword: 'user', weight: 0.5 },
    { keyword: 'customer', weight: 0.5 },
    { keyword: 'marketing', weight: 0.7 },
    { keyword: 'seo', weight: 0.7 },
  ];
  
  let attentionScore = 3;
  for (const indicator of attentionIndicators) {
    if (text.includes(indicator.keyword)) attentionScore += indicator.weight;
  }
  
  const trustIndicators = [
    { keyword: 'security', weight: 1 },
    { keyword: 'privacy', weight: 0.9 },
    { keyword: 'reliable', weight: 0.8 },
    { keyword: 'transparent', weight: 0.8 },
    { keyword: 'verified', weight: 0.7 },
    { keyword: 'guarantee', weight: 0.7 },
    { keyword: 'compliance', weight: 0.7 },
    { keyword: 'audit', weight: 0.7 },
    { keyword: 'safe', weight: 0.6 },
    { keyword: 'protect', weight: 0.7 },
  ];
  
  let trustScore = 3;
  for (const indicator of trustIndicators) {
    if (text.includes(indicator.keyword)) trustScore += indicator.weight;
  }
  
  return {
    brand: clampScore(brandScore),
    attention: clampScore(attentionScore),
    trust: clampScore(trustScore),
  };
}

function generateReview(name: string, description: string, scores: BATScores): ReviewResult {
  const total = scores.brand + scores.attention + scores.trust;
  const maxTotal = 15;
  const stars = Math.round((total / maxTotal) * 10);
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
  
  const dimensionAnalysis = generateDimensionAnalysis(scores);
  const reasoning = generateReasoning(scores, total, recommendation);
  const nextSteps = generateNextSteps(scores, recommendation);
  
  return {
    name,
    description,
    scores,
    total,
    threshold,
    passed,
    stars,
    recommendation,
    reasoning,
    nextSteps,
    dimensionAnalysis,
  };
}

function generateDimensionAnalysis(scores: BATScores): DimensionAnalysis[] {
  const dimensions: DimensionAnalysis[] = [];
  
  const brandSuggestions: string[] = [];
  if (scores.brand < 3) {
    brandSuggestions.push('Define clear brand positioning and messaging');
    brandSuggestions.push('Identify unique value propositions');
  } else if (scores.brand < 4) {
    brandSuggestions.push('Strengthen brand storytelling');
  }
  
  dimensions.push({
    name: 'Brand',
    score: scores.brand,
    maxScore: 5,
    emoji: getScoreEmoji(scores.brand),
    assessment: getScoreAssessment('brand', scores.brand),
    suggestions: brandSuggestions,
  });
  
  const attentionSuggestions: string[] = [];
  if (scores.attention < 3) {
    attentionSuggestions.push('Identify user acquisition channels');
    attentionSuggestions.push('Improve product discoverability');
  } else if (scores.attention < 4) {
    attentionSuggestions.push('Optimize conversion funnels');
  }
  
  dimensions.push({
    name: 'Attention',
    score: scores.attention,
    maxScore: 5,
    emoji: getScoreEmoji(scores.attention),
    assessment: getScoreAssessment('attention', scores.attention),
    suggestions: attentionSuggestions,
  });
  
  const trustSuggestions: string[] = [];
  if (scores.trust < 3) {
    trustSuggestions.push('Address security and privacy concerns');
    trustSuggestions.push('Add social proof and testimonials');
  } else if (scores.trust < 4) {
    trustSuggestions.push('Add trust badges and certifications');
  }
  
  dimensions.push({
    name: 'Trust',
    score: scores.trust,
    maxScore: 5,
    emoji: getScoreEmoji(scores.trust),
    assessment: getScoreAssessment('trust', scores.trust),
    suggestions: trustSuggestions,
  });
  
  return dimensions;
}

function getScoreAssessment(dimension: string, score: number): string {
  if (score >= 4) {
    if (dimension === 'brand') return 'Strong brand alignment that enhances market position';
    if (dimension === 'attention') return 'High attention potential with strong engagement opportunities';
    if (dimension === 'trust') return 'High trust factor that reduces friction and builds confidence';
  } else if (score >= 2.5) {
    if (dimension === 'brand') return 'Moderate brand impact with room for differentiation';
    if (dimension === 'attention') return 'Moderate attention capture, may need marketing amplification';
    if (dimension === 'trust') return 'Moderate trust level, address potential credibility concerns';
  } else {
    if (dimension === 'brand') return 'Weak brand connection, may not contribute to brand equity';
    if (dimension === 'attention') return 'Low attention value, difficult to acquire users';
    if (dimension === 'trust') return 'Trust concerns, users may hesitate to adopt';
  }
  return '';
}

function generateReasoning(scores: BATScores, total: number, recommendation: string): string {
  const parts: string[] = [];
  
  if (recommendation === 'build') {
    parts.push('This feature/product scores well across the BAT framework, meeting the 2/3 criteria threshold for investment.');
  } else if (recommendation === 'consider') {
    parts.push('This feature/product shows promise but has gaps in the BAT framework, falling below the build threshold but worth exploration.');
  } else {
    parts.push('This feature/product does not meet the BAT threshold for immediate investment and needs significant refinement.');
  }
  
  const weakDimensions: string[] = [];
  if (scores.brand < 3) weakDimensions.push('Brand');
  if (scores.attention < 3) weakDimensions.push('Attention');
  if (scores.trust < 3) weakDimensions.push('Trust');
  
  const strongDimensions: string[] = [];
  if (scores.brand >= 4) strongDimensions.push('Brand');
  if (scores.attention >= 4) strongDimensions.push('Attention');
  if (scores.trust >= 4) strongDimensions.push('Trust');
  
  if (strongDimensions.length > 0) {
    parts.push(`Strongest dimension${strongDimensions.length > 1 ? 's' : ''}: ${strongDimensions.join(', ')}.`);
  }
  
  if (weakDimensions.length > 0) {
    parts.push(`Area${weakDimensions.length > 1 ? 's' : ''} for improvement: ${weakDimensions.join(', ')}.`);
  }
  
  return parts.join(' ');
}

function generateNextSteps(scores: BATScores, recommendation: string): string[] {
  const steps: string[] = [];
  
  if (recommendation === 'build') {
    steps.push('Prioritize this in the roadmap');
    steps.push('Assign dedicated team/resources');
    steps.push('Define success metrics and timeline');
    steps.push('Begin detailed technical specification');
  } else if (recommendation === 'consider') {
    steps.push('Identify gaps in the weakest BAT dimension');
    steps.push('Prototype or research to validate assumptions');
    steps.push('Re-evaluate after addressing key concerns');
  } else {
    steps.push('Deprioritize or reject for now');
    steps.push('Revisit if market conditions change');
    steps.push('Consider pivoting the concept to address BAT gaps');
  }
  
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
  if (score >= 4) return '[G]';
  if (score >= 2.5) return '[Y]';
  return '[R]';
}

function formatScore(score: number): string {
  return score.toFixed(1).replace('.0', '');
}

function printReview(result: ReviewResult): void {
  console.log(chalk.blue.bold('\n==========================================='));
  console.log(chalk.blue.bold('       BAT FRAMEWORK CEO REVIEW'));
  console.log(chalk.blue.bold('===========================================\n'));
  
  console.log(chalk.white.bold(`Project: ${result.name}\n`));
  console.log(chalk.gray(result.description));
  console.log();
  
  const filledStars = '*'.repeat(result.stars);
  const emptyStars = '.'.repeat(10 - result.stars);
  const starColor = result.stars >= 7 ? chalk.green : result.stars >= 5 ? chalk.yellow : chalk.red;
  console.log(starColor.bold(`Rating: ${result.stars}/10 Stars  ${filledStars}${emptyStars}\n`));
  
  console.log(chalk.blue('BAT Scores (max 5 each):'));
  result.dimensionAnalysis.forEach(dim => {
    const barLength = Math.round(dim.score);
    const bar = '#'.repeat(barLength) + '-'.repeat(5 - barLength);
    console.log(`  ${dim.emoji} ${dim.name.padEnd(10)} ${bar} ${formatScore(dim.score)}/5`);
  });
  console.log(chalk.gray(`  Total: ${formatScore(result.total)}/15`));
  console.log(chalk.gray(`  Threshold: ${formatScore(result.threshold)}/15 (2/3 criteria)`));
  console.log();
  
  const recColor = result.recommendation === 'build' ? 'green' : 
                   result.recommendation === 'consider' ? 'yellow' : 'red';
  const recEmoji = result.recommendation === 'build' ? '[BUILD]' : 
                   result.recommendation === 'consider' ? '[CONSIDER]' : "[DON'T BUILD]";
  
  console.log(chalk[recColor].bold(`RECOMMENDATION: ${recEmoji}\n`));
  
  console.log(chalk.blue('Dimension Analysis:'));
  result.dimensionAnalysis.forEach(dim => {
    console.log(`\n  ${dim.emoji} ${chalk.bold(dim.name)} (${formatScore(dim.score)}/5)`);
    console.log(chalk.gray(`     ${dim.assessment}`));
    if (dim.suggestions.length > 0) {
      console.log(chalk.gray(`     Suggestion: ${dim.suggestions[0]}`));
    }
  });
  console.log();
  
  console.log(chalk.blue('Reasoning:'));
  console.log('  ' + result.reasoning);
  console.log();
  
  console.log(chalk.blue('Next Steps:'));
  result.nextSteps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
  
  console.log(chalk.blue.bold('\n===========================================\n'));
}

export { autoCalculateScores, clampScore, parseDescription };
