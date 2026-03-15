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
  build: 10,      // 2/3 of 15 (max score) - 6.67 stars
  consider: 7.5,  // 1/2 of 15 - 5 stars
};

/**
 * Main review command
 */
export async function reviewCommand(description: string, options: ReviewOptions): Promise<void> {
  // Parse description
  const { name, desc } = parseDescription(description);
  
  // Calculate or use provided scores
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
  
  // Generate review
  const result = generateReview(name, desc, scores);
  
  // Output
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printReview(result);
  }
}

/**
 * Parse description into name and description
 */
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

/**
 * Clamp score to 0-5 range
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(5, score));
}

/**
 * Auto-calculate BAT scores based on description keywords
 */
function autoCalculateScores(name: string, description: string): BATScores {
  const text = (name + ' ' + description).toLowerCase();
  
  // Brand indicators
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
    { keyword: 'positioning', weight: 0.7 },
    { keyword: 'values', weight: 0.6 },
  ];
  
  let brandScore = 3;
  for (const indicator of brandIndicators) {
    if (text.includes(indicator.keyword)) brandScore += indicator.weight;
  }
  
  // Attention indicators
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
    { keyword: 'social', weight: 0.7 },
    { keyword: 'share', weight: 0.7 },
    { keyword: 'discover', weight: 0.6 },
    { keyword: 'notification', weight: 0.5 },
    { keyword: 'email', weight: 0.5 },
    { keyword: 'push', weight: 0.5 },
  ];
  
  let attentionScore = 3;
  for (const indicator of attentionIndicators) {
    if (text.includes(indicator.keyword)) attentionScore += indicator.weight;
  }
  
  // Trust indicators
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
    { keyword: 'authentic', weight: 0.7 },
    { keyword: 'proven', weight: 0.7 },
    { keyword: 'trusted', weight: 0.8 },
    { keyword: 'expert', weight: 0.6 },
    { keyword: 'certified', weight: 0.7 },
    { keyword: 'encrypted', weight: 0.7 },
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

/**
 * Generate complete review
 */
function generateReview(name: string, description: string, scores: BATScores): ReviewResult {
  const total = scores.brand + scores.attention + scores.trust;
  const maxTotal = 15;
  const stars = Math.round((total / maxTotal) * 10); // 10-star scale
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

/**
 * Generate dimension analysis
 */
function generateDimensionAnalysis(scores: BATScores): DimensionAnalysis[] {
  const dimensions: DimensionAnalysis[] = [];
  
  // Brand analysis
  const brandSuggestions: string[] = [];
  if (scores.brand < 3) {
    brandSuggestions.push('Define clear brand positioning and messaging');
    brandSuggestions.push('Identify unique value propositions');
    brandSuggestions.push('Consider brand awareness campaigns');
  } else if (scores.brand < 4) {
    brandSuggestions.push('Strengthen brand storytelling');
    brandSuggestions.push('Enhance visual identity consistency');
  }
  
  dimensions.push({
    name: 'Brand',
    score: scores.brand,
    maxScore: 5,
    emoji: getScoreEmoji(scores.brand),
    assessment: getScoreAssessment('brand', scores.brand),
    suggestions: brandSuggestions,
  });
  
  // Attention analysis
  const attentionSuggestions: string[] = [];
  if (scores.attention < 3) {
    attentionSuggestions.push('Identify user acquisition channels');
    attentionSuggestions.push('Improve product discoverability');
    attentionSuggestions.push('Consider viral/growth mechanics');
  } else if (scores.attention < 4) {
    attentionSuggestions.push('Optimize conversion funnels');
    attentionSuggestions.push('Enhance engagement features');
  }
  
  dimensions.push({
    name: 'Attention',
    score: scores.attention,
    maxScore: 5,
    emoji: getScoreEmoji(scores.attention),
    assessment: getScoreAssessment('attention', scores.attention),
    suggestions: attentionSuggestions,
  });
  
  // Trust analysis
  const trustSuggestions: string[] = [];
  if (scores.trust < 3) {
    trustSuggestions.push('Address security and privacy concerns');
    trustSuggestions.push('Add social proof and testimonials');
    trustSuggestions.push('Ensure transparent communication');
  } else if (scores.trust < 4) {
    trustSuggestions.push('Add trust badges and certifications');
    trustSuggestions.push('Improve error handling and reliability');
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

/**
 * Get score assessment text
 */
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

/**
 * Generate reasoning text
 */
function generateReasoning(scores: BATScores, total: number, recommendation: string): string {
  const parts: string[] = [];
  
  // Overall assessment
  if (recommendation === 'build') {
    parts.push('This feature/product scores well across the BAT framework, meeting the 2/3 criteria threshold for investment.');
  } else if (recommendation === 'consider') {
    parts.push('This feature/product shows promise but has gaps in the BAT framework, falling below the build threshold but worth exploration.');
  } else {
    parts.push('This feature/product does not meet the BAT threshold for immediate investment and needs significant refinement.');
  }
  
  // Dimension analysis summary
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

/**
 * Generate next steps
 */
function generateNextSteps(scores: BATScores, recommendation: string): string[] {
  const steps: string[] = [];
  
  if (recommendation === 'build') {
    steps.push('✅ Prioritize this in the roadmap');
    steps.push('✅ Assign dedicated team/resources');
    steps.push('✅ Define success metrics and timeline');
    steps.push('✅ Begin detailed technical specification');
    steps.push('✅ Plan go-to-market strategy');
  } else if (recommendation === 'consider') {
    steps.push('⚠️ Identify gaps in the weakest BAT dimension');
    steps.push('⚠️ Prototype or research to validate assumptions');
    steps.push('⚠️ Re-evaluate after addressing key concerns');
    steps.push('⚠️ Consider as secondary priority');
    steps.push('⚠️ Run user research to understand barriers');
  } else {
    steps.push('❌ Deprioritize or reject for now');
    steps.push('❌ Revisit if market conditions change');
    steps.push('❌ Consider pivoting the concept to address BAT gaps');
    steps.push('❌ Analyze successful competitors for insights');
    steps.push('❌ Reassess core value proposition');
  }
  
  // Dimension-specific recommendations
  if (scores.brand < 3) {
    steps.push('💡 Workshop: How can this strengthen brand positioning?');
  }
  if (scores.attention < 3) {
    steps.push('💡 Research: What would make this more engaging/discoverable?');
  }
  if (scores.trust < 3) {
    steps.push('💡 Audit: Identify trust blockers and mitigation strategies');
  }
  
  return steps;
}

/**
 * Get emoji for score
 */
function getScoreEmoji(score: number): string {
  if (score >= 4) return '🟢';
  if (score >= 2.5) return '🟡';
  return '🔴';
}

/**
 * Format score for display
 */
function formatScore(score: number): string {
  return score.toFixed(1).replace('.0', '');
}

/**
 * Print review to console
 */
function printReview(result: ReviewResult): void {
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║       BAT FRAMEWORK CEO REVIEW                             ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.white.bold(`📋 ${result.name}\n`));
  console.log(chalk.gray(result.description));
  console.log();
  
  // Stars display
  const filledStars = '★'.repeat(result.stars);
  const emptyStars = '☆'.repeat(10 - result.stars);
  const starColor = result.stars >= 7 ? chalk.green : result.stars >= 5 ? chalk.yellow : chalk.red;
  console.log(starColor.bold(`⭐ ${result.stars}/10 Stars  ${filledStars}${emptyStars}\n`));
  
  // Scores
  console.log(chalk.blue('📊 BAT Scores (max 5 each):'));
  console.log(chalk.gray('  ┌─────────────────────────────────────┐'));
  result.dimensionAnalysis.forEach(dim => {
    const barLength = Math.round(dim.score);
    const bar = '█'.repeat(barLength) + '░'.repeat(5 - barLength);
    console.log(chalk.gray(`  │ ${dim.emoji} ${dim.name.padEnd(9)} ${bar} ${formatScore(dim.score).padStart(3)}/5 │`));
  });
  console.log(chalk.gray('  ├─────────────────────────────────────┤'));
  console.log(`  │ ${chalk.bold('Total:'.padEnd(16))} ${chalk.bold(formatScore(result.total).padStart(3))}/15 │`);
  console.log(chalk.gray(`  │ Threshold: ${formatScore(result.threshold)}/15 (2/3 criteria)     │`));
  console.log(chalk.gray('  └─────────────────────────────────────┘'));
  console.log();
  
  // Recommendation
  const recColor = result.recommendation === 'build' ? 'green' : 
                   result.recommendation === 'consider' ? 'yellow' : 'red';
  const recEmoji = result.recommendation === 'build' ? '✅ BUILD' : 
                   result.recommendation === 'consider' ? '⚠️  CONSIDER' : "❌ DON'T BUILD";
  
  console.log(chalk[recColor].bold(`📣 RECOMMENDATION: ${recEmoji}\n`));
  
  // Dimension analysis
  console.log(chalk.blue('🔍 Dimension Analysis:'));
  result.dimensionAnalysis.forEach(dim => {
    console.log(`\n  ${dim.emoji} ${chalk.bold(dim.name)} (${formatScore(dim.score)}/5)`);
    console.log(chalk.gray(`     ${dim.assessment}`));
    if (dim.suggestions.length > 0) {
      console.log(chalk.gray(`     💡 ${dim.suggestions[0]}`));
    }
  });
  console.log();
  
  // Reasoning
  console.log(chalk.blue('🤔 Reasoning:'));
  console.log('  ' + result.reasoning.split('. ').join('.\n  '));
  console.log();
  
  // Next Steps
  console.log(chalk.blue('📋 Next Steps:'));
  result.nextSteps.forEach((step) => {
    console.log(`   ${step}`);
  });
  
  console.log(chalk.blue.bold('\n════════════════════════════════════════════════════════════\n'));
}

/**
 * Export utility functions for programmatic use
 */
export { autoCalculateScores, clampScore, parseDescription };
