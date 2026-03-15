interface BATScore {
  brand: number;
  attention: number;
  trust: number;
}

interface ReviewResult {
  product: string;
  scores: BATScore;
  reasoning: {
    brand: string;
    attention: string;
    trust: string;
  };
  total: number;
  normalized: number;
  recommendation: 'BUILD' | 'CONSIDER' | "DON'T BUILD";
  nextSteps: string[];
}

function parseArgs(): string {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: plan-ceo-review "<product idea>"');
    console.error('\nExample:');
    console.error('  plan-ceo-review "Add AI voice assistant"');
    process.exit(1);
  }
  return args.join(' ');
}

function analyzeBAT(product: string): ReviewResult {
  // Keywords for scoring heuristics
  const brandKeywords = ['brand', 'identity', 'premium', 'market position', 'differentiation'];
  const attentionKeywords = ['engagement', 'viral', 'growth', 'user acquisition', 'retention', 'hook'];
  const trustKeywords = ['security', 'privacy', 'reliability', 'transparency', 'verification', 'proven'];
  
  const lowerProduct = product.toLowerCase();
  
  // Calculate base scores based on keyword presence
  let brandScore = 3; // baseline
  let attentionScore = 3;
  let trustScore = 3;
  
  brandKeywords.forEach(kw => {
    if (lowerProduct.includes(kw)) brandScore += 0.5;
  });
  
  attentionKeywords.forEach(kw => {
    if (lowerProduct.includes(kw)) attentionScore += 0.5;
  });
  
  trustKeywords.forEach(kw => {
    if (lowerProduct.includes(kw)) trustScore += 0.5;
  });
  
  // Clamp scores to 0-5 range
  brandScore = Math.min(5, Math.max(0, brandScore));
  attentionScore = Math.min(5, Math.max(0, attentionScore));
  trustScore = Math.min(5, Math.max(0, trustScore));
  
  // Generate reasoning
  const reasoning = {
    brand: generateReasoning('Brand', brandScore, product),
    attention: generateReasoning('Attention', attentionScore, product),
    trust: generateReasoning('Trust', trustScore, product)
  };
  
  const total = Math.round(brandScore + attentionScore + trustScore);
  const normalized = Math.round((total / 15) * 10);
  
  let recommendation: 'BUILD' | 'CONSIDER' | "DON'T BUILD";
  if (normalized >= 8) {
    recommendation = 'BUILD';
  } else if (normalized >= 6) {
    recommendation = 'CONSIDER';
  } else {
    recommendation = "DON'T BUILD";
  }
  
  const nextSteps = generateNextSteps(recommendation, product);
  
  return {
    product,
    scores: {
      brand: Math.round(brandScore),
      attention: Math.round(attentionScore),
      trust: Math.round(trustScore)
    },
    reasoning,
    total,
    normalized,
    recommendation,
    nextSteps
  };
}

function generateReasoning(dimension: string, score: number, product: string): string {
  const reasons: Record<string, string[]> = {
    Brand: [
      'May dilute brand focus or confuse positioning',
      'Neutral impact on brand; neither strengthens nor weakens',
      'Moderate brand alignment with current identity',
      'Good fit with brand values and market position',
      'Strong brand reinforcement and differentiation',
      'Exceptional brand opportunity - defines category'
    ],
    Attention: [
      'Low engagement potential; hard to capture interest',
      'Limited attention-grabbing capability',
      'Moderate user interest; typical engagement',
      'Above-average engagement and retention potential',
      'High virality and user acquisition potential',
      'Breakthrough attention opportunity'
    ],
    Trust: [
      'Significant trust barriers or risks',
      'Trust concerns that need addressing',
      'Standard trust requirements; no special concerns',
      'Builds on existing trust mechanisms',
      'Strong trust enhancement opportunity',
      'Paradigm-shifting trust innovation'
    ]
  };
  
  const index = Math.min(5, Math.max(0, Math.round(score)));
  return reasons[dimension][index];
}

function generateNextSteps(rec: 'BUILD' | 'CONSIDER' | "DON'T BUILD", product: string): string[] {
  const steps: Record<string, string[]> = {
    BUILD: [
      'Draft technical specification and resource requirements',
      'Create detailed timeline with milestones',
      'Identify key team members and allocate resources',
      'Define success metrics and KPIs',
      'Schedule kickoff meeting within 48 hours'
    ],
    CONSIDER: [
      'Conduct deeper market research and competitive analysis',
      'Run customer discovery interviews (target: 10-15)',
      'Build proof-of-concept to validate assumptions',
      'Re-evaluate with BAT framework after validation',
      'Set go/no-go decision deadline'
    ],
    "DON'T BUILD": [
      'Document reasoning for future reference',
      'Identify alternative approaches to solve the problem',
      'Revisit if market conditions change significantly',
      'Consider as component of larger future initiative',
      'Archive idea with context for future review'
    ]
  };
  
  return steps[rec];
}

function printReview(result: ReviewResult): void {
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(15) + 'BAT FRAMEWORK REVIEW' + ' '.repeat(23) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log();
  console.log(`📦 Product: ${result.product}`);
  console.log();
  console.log('📊 BAT SCORES');
  console.log('─'.repeat(60));
  console.log(`  Brand:      ${'★'.repeat(result.scores.brand)}${'☆'.repeat(5 - result.scores.brand)}  ${result.scores.brand}/5`);
  console.log(`    └─ ${result.reasoning.brand}`);
  console.log();
  console.log(`  Attention:  ${'★'.repeat(result.scores.attention)}${'☆'.repeat(5 - result.scores.attention)}  ${result.scores.attention}/5`);
  console.log(`    └─ ${result.reasoning.attention}`);
  console.log();
  console.log(`  Trust:      ${'★'.repeat(result.scores.trust)}${'☆'.repeat(5 - result.scores.trust)}  ${result.scores.trust}/5`);
  console.log(`    └─ ${result.reasoning.trust}`);
  console.log();
  console.log('─'.repeat(60));
  console.log(`  TOTAL:      ${result.total}/15 stars (${result.normalized}/10 normalized)`);
  console.log();
  
  const recEmoji = result.recommendation === 'BUILD' ? '✅' : 
                   result.recommendation === 'CONSIDER' ? '🤔' : '❌';
  console.log(`${recEmoji} RECOMMENDATION: ${result.recommendation}`);
  console.log();
  
  console.log('📋 NEXT STEPS');
  console.log('─'.repeat(60));
  result.nextSteps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
  
  console.log();
  console.log('─'.repeat(60));
  console.log('10-Star Methodology:');
  console.log('  0-5 stars  → Don\'t build');
  console.log('  6-7 stars  → Consider carefully');
  console.log('  8-10 stars → Build it');
  console.log('─'.repeat(60));
}

const product = parseArgs();
const result = analyzeBAT(product);
printReview(result);
