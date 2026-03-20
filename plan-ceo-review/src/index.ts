/**
 * Plan CEO Review Skill - Product Strategy Analysis
 * 
 * Provides: BAT framework scoring, 10-star methodology for build vs buy decisions
 * Compatible with: Kimi K2.5, Node.js 18+, OpenClaw
 */

// BAT Framework Types
export interface BATScore {
  brand: number;
  attention: number;
  trust: number;
  notes: {
    brand?: string;
    attention?: string;
    trust?: string;
  };
}

// 10-Star Methodology Types
export interface TenStarScores {
  userValue: number;
  marketFit: number;
  strategicAlignment: number;
  technicalFeasibility: number;
  resourceEfficiency: number;
  speedToMarket: number;
  competitiveMoat: number;
  scalability: number;
  riskLevel: number;
  opportunityCost: number;
}

export interface Option {
  name: string;
  description: string;
  bat: BATScore;
  tenStar: TenStarScores;
  totalScore: number;
  pros: string[];
  cons: string[];
}

export interface ReviewOptions {
  topic: string;
  options?: string[];
  type?: 'build-vs-buy' | 'feature' | 'acquisition' | 'market' | 'custom';
  marketSize?: string;
  budget?: string;
  timeline?: string;
  format?: 'summary' | 'detailed' | 'executive';
  depth?: 'quick' | 'standard' | 'full';
}

export interface ReviewResult {
  topic: string;
  analysisType: string;
  options: Option[];
  recommendation: {
    option: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    nextSteps: string[];
  };
  batWinner: string;
  tenStarWinner: string;
  summary: string;
}

// Score descriptions for BAT
const BAT_DESCRIPTIONS = {
  brand: {
    5: 'Exceptional brand differentiation and positioning',
    4: 'Strong positive brand impact',
    3: 'Neutral or mixed brand impact',
    2: 'Potential brand risk',
    1: 'Significant brand damage risk'
  },
  attention: {
    5: 'Massive user acquisition and engagement potential',
    4: 'Strong user interest and retention boost',
    3: 'Moderate user engagement',
    2: 'Limited user interest',
    1: 'May lose user attention'
  },
  trust: {
    5: 'Significantly builds user trust',
    4: 'Positive trust impact',
    3: 'Neutral trust impact',
    2: 'Some trust concerns',
    1: 'Major trust/security risk'
  }
};

// 10-Star dimension descriptions
const STAR_DESCRIPTIONS: Record<keyof TenStarScores, string> = {
  userValue: 'Does it solve a real problem?',
  marketFit: 'Is the timing right?',
  strategicAlignment: 'Does it fit our mission?',
  technicalFeasibility: 'Can we build it well?',
  resourceEfficiency: 'Is it worth the investment?',
  speedToMarket: 'How fast can we ship?',
  competitiveMoat: 'Does it create defensibility?',
  scalability: 'Can it grow with us?',
  riskLevel: 'What could go wrong?',
  opportunityCost: 'What are we NOT doing?'
};

/**
 * Calculate BAT score from raw scores
 */
export function calculateBATScore(scores: Omit<BATScore, 'notes'> & { notes?: BATScore['notes'] }): BATScore {
  return {
    brand: Math.max(1, Math.min(5, scores.brand)),
    attention: Math.max(1, Math.min(5, scores.attention)),
    trust: Math.max(1, Math.min(5, scores.trust)),
    notes: scores.notes || {}
  };
}

/**
 * Calculate total BAT score
 */
export function getBATTotal(score: BATScore): number {
  return score.brand + score.attention + score.trust;
}

/**
 * Calculate 10-star total
 */
export function getTenStarTotal(scores: TenStarScores): number {
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
}

/**
 * Get score interpretation
 */
export function getScoreInterpretation(total: number): string {
  if (total >= 40) return 'Must do - Exceptional opportunity';
  if (total >= 30) return 'Strong candidate - Worth pursuing';
  if (total >= 20) return 'Consider carefully - Mixed signals';
  return 'Probably skip - High risk/low reward';
}

/**
 * Create an option analysis
 */
export function createOption(
  name: string,
  description: string,
  batScores: BATScore,
  tenStarScores: TenStarScores,
  pros: string[],
  cons: string[]
): Option {
  const batTotal = getBATTotal(batScores);
  const tenStarTotal = getTenStarTotal(tenStarScores);
  
  // Weight: 30% BAT, 70% 10-Star (normalized)
  const weightedScore = (batTotal / 15 * 30) + (tenStarTotal / 50 * 70);
  
  return {
    name,
    description,
    bat: batScores,
    tenStar: tenStarScores,
    totalScore: Math.round(weightedScore),
    pros,
    cons
  };
}

/**
 * Determine winner by BAT score
 */
export function getBATWinner(options: Option[]): string {
  let winner = options[0];
  let maxScore = getBATTotal(options[0].bat);
  
  for (const option of options.slice(1)) {
    const score = getBATTotal(option.bat);
    if (score > maxScore) {
      maxScore = score;
      winner = option;
    }
  }
  
  return winner.name;
}

/**
 * Determine winner by 10-star score
 */
export function getTenStarWinner(options: Option[]): string {
  let winner = options[0];
  let maxScore = getTenStarTotal(options[0].tenStar);
  
  for (const option of options.slice(1)) {
    const score = getTenStarTotal(option.tenStar);
    if (score > maxScore) {
      maxScore = score;
      winner = option;
    }
  }
  
  return winner.name;
}

/**
 * Generate overall recommendation
 */
export function generateRecommendation(options: Option[]): ReviewResult['recommendation'] {
  // Sort by total score
  const sorted = [...options].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];
  const runnerUp = sorted[1];
  
  const scoreDiff = winner.totalScore - (runnerUp?.totalScore || 0);
  const confidence = scoreDiff > 15 ? 'high' : scoreDiff > 5 ? 'medium' : 'low';
  
  // Generate reasoning
  const reasoning = generateReasoning(winner, runnerUp);
  
  // Generate next steps
  const nextSteps = generateNextSteps(winner);
  
  return {
    option: winner.name,
    confidence,
    reasoning,
    nextSteps
  };
}

/**
 * Generate reasoning for recommendation
 */
function generateReasoning(winner: Option, runnerUp?: Option): string {
  const reasons: string[] = [];
  
  // BAT analysis
  const batTotal = getBATTotal(winner.bat);
  if (batTotal >= 12) {
    reasons.push(`Strong BAT scores (${batTotal}/15) indicate positive impact on brand, user attention, and trust.`);
  }
  
  // 10-star highlights
  const highlights = Object.entries(winner.tenStar)
    .filter(([_, score]) => score >= 4)
    .map(([dim]) => STAR_DESCRIPTIONS[dim as keyof TenStarScores]);
  
  if (highlights.length > 0) {
    reasons.push(`Excels in: ${highlights.slice(0, 2).join(', ')}.`);
  }
  
  // Compare with runner-up
  if (runnerUp) {
    const diff = winner.totalScore - runnerUp.totalScore;
    reasons.push(`Scores ${diff} points higher than ${runnerUp.name}.`);
  }
  
  return reasons.join(' ') || 'Selected based on overall weighted score.';
}

/**
 * Generate next steps
 */
function generateNextSteps(winner: Option): string[] {
  const steps: string[] = [
    `Validate ${winner.name} approach with stakeholders`,
    'Create detailed implementation timeline',
    'Identify key risks and mitigation strategies'
  ];
  
  // Add specific steps based on scores
  if (winner.tenStar.technicalFeasibility < 4) {
    steps.push('Conduct technical feasibility spike');
  }
  
  if (winner.tenStar.resourceEfficiency < 4) {
    steps.push('Build detailed cost/benefit analysis');
  }
  
  return steps;
}

/**
 * Format BAT score for display
 */
export function formatBATScore(score: BATScore): string {
  const total = getBATTotal(score);
  return `BAT: ${total}/15 ⭐\n` +
    `  Brand: ${score.brand}/5 - ${BAT_DESCRIPTIONS.brand[score.brand as 1|2|3|4|5]}\n` +
    `  Attention: ${score.attention}/5 - ${BAT_DESCRIPTIONS.attention[score.attention as 1|2|3|4|5]}\n` +
    `  Trust: ${score.trust}/5 - ${BAT_DESCRIPTIONS.trust[score.trust as 1|2|3|4|5]}`;
}

/**
 * Format 10-star score for display
 */
export function formatTenStarScore(scores: TenStarScores): string {
  const total = getTenStarTotal(scores);
  let output = `10-Star: ${total}/50 ${getScoreInterpretation(total)}\n`;
  
  for (const [dim, score] of Object.entries(scores)) {
    const stars = '⭐'.repeat(score) + '○'.repeat(5 - score);
    output += `  ${STAR_DESCRIPTIONS[dim as keyof TenStarScores]}: ${stars}\n`;
  }
  
  return output.trim();
}

/**
 * Create pre-built analysis for common scenarios
 */
export function createBuildVsBuyAnalysis(feature: string): Option[] {
  return [
    createOption(
      'Build',
      `Build our own ${feature} solution`,
      calculateBATScore({
        brand: 4,
        attention: 3,
        trust: 4,
        notes: {
          brand: 'Shows technical prowess and differentiation',
          attention: 'May not drive immediate user acquisition',
          trust: 'Full control over security and reliability'
        }
      }),
      {
        userValue: 5,
        marketFit: 4,
        strategicAlignment: 5,
        technicalFeasibility: 3,
        resourceEfficiency: 2,
        speedToMarket: 2,
        competitiveMoat: 4,
        scalability: 4,
        riskLevel: 3,
        opportunityCost: 2
      },
      [
        'Full control and customization',
        'Builds internal expertise',
        'Potential competitive advantage',
        'No vendor lock-in'
      ],
      [
        'Higher upfront investment',
        'Longer time to market',
        'Maintenance burden',
        'Risk of subpar solution'
      ]
    ),
    createOption(
      'Buy',
      `Purchase ${feature} solution from vendor`,
      calculateBATScore({
        brand: 3,
        attention: 4,
        trust: 4,
        notes: {
          brand: 'Standard solution, less differentiation',
          attention: 'Proven UX, faster time to value',
          trust: 'Vendor expertise and reliability'
        }
      }),
      {
        userValue: 4,
        marketFit: 5,
        strategicAlignment: 3,
        technicalFeasibility: 5,
        resourceEfficiency: 4,
        speedToMarket: 5,
        competitiveMoat: 2,
        scalability: 4,
        riskLevel: 3,
        opportunityCost: 4
      },
      [
        'Faster time to market',
        'Lower upfront cost',
        'Proven solution',
        'Vendor support included'
      ],
      [
        'Vendor dependency',
        'Less customization',
        'Ongoing subscription costs',
        'Potential data privacy concerns'
      ]
    )
  ];
}

/**
 * Main plan-ceo-review function
 */
export function planCeoReview(options: ReviewOptions): ReviewResult {
  console.log('\n🎯 Plan CEO Review\n');
  console.log(`   Topic: ${options.topic}`);
  console.log(`   Type: ${options.type || 'custom'}`);
  
  // Generate options based on type
  let analysisOptions: Option[] = [];
  
  if (options.type === 'build-vs-buy' || (options.topic.toLowerCase().includes('build') && options.topic.toLowerCase().includes('buy'))) {
    const feature = options.topic.replace(/build vs buy/i, '').trim();
    analysisOptions = createBuildVsBuyAnalysis(feature);
  } else {
    // Create generic single-option analysis
    analysisOptions = [
      createOption(
        'Proceed',
        options.topic,
        calculateBATScore({ brand: 3, attention: 3, trust: 3 }),
        {
          userValue: 3,
          marketFit: 3,
          strategicAlignment: 3,
          technicalFeasibility: 3,
          resourceEfficiency: 3,
          speedToMarket: 3,
          competitiveMoat: 3,
          scalability: 3,
          riskLevel: 3,
          opportunityCost: 3
        },
        ['Aligned with strategy'],
        ['Requires further analysis']
      )
    ];
  }

  // Calculate winners
  const batWinner = getBATWinner(analysisOptions);
  const tenStarWinner = getTenStarWinner(analysisOptions);
  
  // Generate recommendation
  const recommendation = generateRecommendation(analysisOptions);
  
  // Generate summary
  const summary = generateSummary(options.topic, analysisOptions, recommendation);
  
  const result: ReviewResult = {
    topic: options.topic,
    analysisType: options.type || 'custom',
    options: analysisOptions,
    recommendation,
    batWinner,
    tenStarWinner,
    summary
  };

  // Output results
  outputResults(result, options.format || 'summary');

  return result;
}

/**
 * Generate summary string
 */
function generateSummary(topic: string, options: Option[], recommendation: ReviewResult['recommendation']): string {
  const winner = options.find(o => o.name === recommendation.option);
  return `${topic}: ${recommendation.option} recommended (${winner?.totalScore}/100 points)`;
}

/**
 * Output results in requested format
 */
function outputResults(result: ReviewResult, format: string): void {
  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS RESULTS');
  console.log('='.repeat(60) + '\n');

  if (format === 'executive') {
    // One-page brief
    console.log(`📋 ${result.topic}`);
    console.log('\n🎯 RECOMMENDATION');
    console.log(`   ${result.recommendation.option} (${result.recommendation.confidence.toUpperCase()} confidence)`);
    console.log(`   ${result.recommendation.reasoning}`);
    console.log('\n⚡ NEXT STEPS');
    for (const step of result.recommendation.nextSteps) {
      console.log(`   • ${step}`);
    }
  } else if (format === 'detailed') {
    // Full breakdown
    for (const option of result.options) {
      console.log(`\n📊 ${option.name}`);
      console.log(`   ${option.description}`);
      console.log('\n   ' + formatBATScore(option.bat).replace(/\n/g, '\n   '));
      console.log('\n   ' + formatTenStarScore(option.tenStar).replace(/\n/g, '\n   '));
      console.log(`\n   ✅ Pros: ${option.pros.join(', ')}`);
      console.log(`   ❌ Cons: ${option.cons.join(', ')}`);
    }
    
    console.log('\n🏆 WINNERS');
    console.log(`   BAT: ${result.batWinner}`);
    console.log(`   10-Star: ${result.tenStarWinner}`);
    console.log(`   Overall: ${result.recommendation.option}`);
  } else {
    // Summary (default)
    console.log('📊 Option Comparison:\n');
    
    for (const option of result.options) {
      const batTotal = getBATTotal(option.bat);
      const tenStarTotal = getTenStarTotal(option.tenStar);
      const isWinner = option.name === result.recommendation.option;
      const marker = isWinner ? '👉' : '  ';
      
      console.log(`${marker} ${option.name}: ${option.totalScore}/100`);
      console.log(`   BAT: ${batTotal}/15 | 10-Star: ${tenStarTotal}/50`);
    }
    
    console.log('\n🎯 RECOMMENDATION');
    console.log(`   ${result.recommendation.option} (${result.recommendation.confidence} confidence)`);
    console.log(`   ${result.recommendation.reasoning}`);
  }

  console.log('\n' + '='.repeat(60));
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  // Get topic (first non-flag argument)
  const topic = args.find(arg => !arg.startsWith('-')) || '';
  
  if (!topic) {
    console.error('Error: Topic is required');
    console.log('Usage: plan-ceo-review "Topic" [options]');
    process.exit(1);
  }

  const options: ReviewOptions = {
    topic,
    type: 'custom',
    format: 'summary',
    depth: 'standard'
  };

  // Parse type
  const typeIndex = args.findIndex(arg => arg === '--type' || arg === '-t');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    options.type = args[typeIndex + 1] as any;
  }

  // Auto-detect type from topic
  if (topic.toLowerCase().includes('build') && topic.toLowerCase().includes('buy')) {
    options.type = 'build-vs-buy';
  } else if (topic.toLowerCase().includes('acquire')) {
    options.type = 'acquisition';
  } else if (topic.toLowerCase().includes('market')) {
    options.type = 'market';
  } else if (topic.toLowerCase().includes('feature')) {
    options.type = 'feature';
  }

  // Parse format
  const formatIndex = args.findIndex(arg => arg === '--format' || arg === '-f');
  if (formatIndex !== -1 && args[formatIndex + 1]) {
    options.format = args[formatIndex + 1] as any;
  }

  // Parse depth
  const depthIndex = args.findIndex(arg => arg === '--depth' || arg === '-d');
  if (depthIndex !== -1 && args[depthIndex + 1]) {
    options.depth = args[depthIndex + 1] as any;
  }

  // Parse market size
  const marketSizeIndex = args.findIndex(arg => arg === '--market-size');
  if (marketSizeIndex !== -1 && args[marketSizeIndex + 1]) {
    options.marketSize = args[marketSizeIndex + 1];
  }

  planCeoReview(options);
}

export default planCeoReview;
