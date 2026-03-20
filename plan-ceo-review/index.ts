/**
 * Plan CEO Review Skill - Product Strategy Evaluation
 * 
 * Product strategy using BAT framework (Brand, Attention, Trust) and 
 * 10-star methodology for build vs buy decisions.
 * Compatible with Kimi K2.5 - uses straightforward types and clear structure.
 */

// ============================================================================
// Types
// ============================================================================

export interface BatScore {
  brand: number;
  attention: number;
  trust: number;
  total: number;
}

export interface StarRating {
  overall: number;
  problem: number;
  usability: number;
  delight: number;
  feasibility: number;
  viability: number;
}

export interface ReviewOptions {
  audience?: string;
  market?: string;
  detailed?: boolean;
}

export interface ReviewResult {
  feature: string;
  batScore: BatScore;
  starRating: StarRating;
  recommendation: string;
  nextSteps: string[];
  resources: string;
  timeline: string;
}

export interface CompareResult {
  feature1: ReviewResult;
  feature2: ReviewResult;
  winner: string | null;
}

export interface BuildVsBuyOption {
  name: string;
  type: 'build' | 'buy';
  cost: string;
  timeline: string;
  pros: string[];
  cons: string[];
}

export interface BuildVsBuyResult {
  feature: string;
  options: BuildVsBuyOption[];
  recommendation: string;
  reasoning: string[];
}

export interface FrameworkInfo {
  bat: {
    description: string;
    dimensions: Array<{ name: string; description: string; maxScore: number }>;
    scoring: Array<{ range: string; recommendation: string; description: string }>;
  };
  tenStar: {
    description: string;
    scale: Array<{ stars: number; description: string }>;
  };
}

export interface SkillResult<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  media?: string[];
  errors?: string[];
}

// ============================================================================
// BAT Framework Implementation
// ============================================================================

function calculateBatScore(feature: string, options: ReviewOptions = {}): BatScore {
  const featureLower = feature.toLowerCase();
  
  // Base scores
  let brand = 3;
  let attention = 3;
  let trust = 3;
  
  // Heuristic scoring based on keywords
  if (featureLower.includes('ai') || featureLower.includes('smart') || featureLower.includes('ml')) {
    brand += 1;  // AI features enhance brand perception
    attention += 2;  // High user interest in AI
  }
  
  if (featureLower.includes('security') || featureLower.includes('privacy') || featureLower.includes('encryption')) {
    brand += 1;
    trust += 2;  // Security features build trust
  }
  
  if (featureLower.includes('mobile') || featureLower.includes('app')) {
    attention += 1;  // Mobile has high usage
  }
  
  if (featureLower.includes('dark mode') || featureLower.includes('theme')) {
    attention += 1;  // Highly requested feature
    brand += 0;  // Neutral brand impact
  }
  
  if (featureLower.includes('api') || featureLower.includes('integration')) {
    attention += 1;  // Developers want APIs
    brand += 1;  // Shows platform maturity
  }
  
  if (featureLower.includes('collaboration') || featureLower.includes('share')) {
    attention += 2;  // Viral potential
    brand += 1;
  }
  
  // Adjust based on audience
  if (options.audience === 'enterprise') {
    trust += 1;  // Enterprises care more about trust
    brand += 0;
  }
  
  if (options.audience === 'developers') {
    brand += 1;  // Developer tools enhance tech brand
    attention += 1;
  }
  
  if (options.audience === 'consumers') {
    attention += 1;  // Consumer features need high engagement
  }
  
  // Adjust based on market
  if (options.market === 'saas') {
    brand += 1;
    trust += 0;
  }
  
  if (options.market === 'fintech') {
    trust += 2;  // Trust is critical in fintech
  }
  
  // Cap scores at 0-5 range
  brand = Math.min(5, Math.max(0, brand));
  attention = Math.min(5, Math.max(0, attention));
  trust = Math.min(5, Math.max(0, trust));
  
  return {
    brand,
    attention,
    trust,
    total: brand + attention + trust
  };
}

// ============================================================================
// 10-Star Methodology Implementation
// ============================================================================

function calculateStarRating(feature: string, options: ReviewOptions = {}): StarRating {
  const featureLower = feature.toLowerCase();
  
  // Base scores (5 = meets expectations)
  let problem = 5;
  let usability = 5;
  let delight = 5;
  let feasibility = 5;
  let viability = 5;
  
  // Adjust based on feature type
  if (featureLower.includes('ai') || featureLower.includes('automation')) {
    problem += 2;      // Solves real problems
    delight += 1;      // "Magic" factor
    feasibility -= 1;  // AI can be complex
    viability += 0;
  }
  
  if (featureLower.includes('dark mode') || featureLower.includes('theme')) {
    problem += 1;      // Accessibility need
    usability += 1;    // User preference
    delight += 1;      // Visual appeal
    feasibility += 2;  // Relatively easy to implement
    viability += 2;    // Low maintenance
  }
  
  if (featureLower.includes('api') || featureLower.includes('integration')) {
    problem += 1;      // Extends capabilities
    usability += 0;    // Developer usability
    delight += 0;
    feasibility += 0;  // Depends on architecture
    viability += 1;    // Can drive adoption
  }
  
  if (featureLower.includes('mobile') || featureLower.includes('app')) {
    problem += 1;
    usability += 1;
    delight += 1;
    feasibility -= 1;  // More complex than web
    viability += 0;    // Higher maintenance
  }
  
  if (featureLower.includes('search') || featureLower.includes('discover')) {
    problem += 2;      // Critical for content platforms
    usability += 1;
    delight += 0;
    feasibility -= 1;  // Search is hard to do well
    viability += 1;
  }
  
  if (featureLower.includes('notification') || featureLower.includes('alert')) {
    problem += 1;
    usability += 0;
    delight -= 1;      // Can be annoying
    feasibility += 2;  // Generally straightforward
    viability += 1;
  }
  
  // Adjust based on audience
  if (options.audience === 'developers') {
    usability += 1;  // Developers expect good UX
    feasibility += 1;  // They can work around issues
  }
  
  if (options.audience === 'enterprise') {
    viability += 1;  // Enterprises pay
    feasibility -= 1;  // More requirements
  }
  
  // Calculate overall (average of dimensions)
  const overall = Math.round((problem + usability + delight + feasibility + viability) / 5);
  
  // Cap all scores at 1-10 range
  return {
    overall: Math.min(10, Math.max(1, overall)),
    problem: Math.min(10, Math.max(1, problem)),
    usability: Math.min(10, Math.max(1, usability)),
    delight: Math.min(10, Math.max(1, delight)),
    feasibility: Math.min(10, Math.max(1, feasibility)),
    viability: Math.min(10, Math.max(1, viability))
  };
}

// ============================================================================
// Recommendation Logic
// ============================================================================

function getRecommendation(batTotal: number, stars: number): string {
  if (batTotal >= 12 && stars >= 7) {
    return 'PRIORITY BUILD';
  } else if (batTotal >= 10 && stars >= 6) {
    return 'BUILD';
  } else if (batTotal >= 8 && stars >= 5) {
    return 'CONSIDER';
  } else {
    return "DON'T BUILD";
  }
}

function generateNextSteps(batScore: BatScore, starRating: StarRating): string[] {
  const steps: string[] = [];
  
  // Trust concerns
  if (batScore.trust < 3) {
    steps.push('Add transparency, security features, or user control options');
    steps.push('Conduct security review and penetration testing');
  }
  
  // Usability issues
  if (starRating.usability < 6) {
    steps.push('Simplify the user experience - reduce friction');
    steps.push('Conduct usability testing with target users');
  }
  
  // Feasibility concerns
  if (starRating.feasibility < 5) {
    steps.push('Break down into smaller, achievable milestones');
    steps.push('Consider MVP approach to validate technical approach');
    steps.push('Evaluate third-party solutions vs building in-house');
  }
  
  // Viability concerns
  if (starRating.viability < 5) {
    steps.push('Revisit business model and revenue projections');
    steps.push('Analyze competitive landscape for pricing benchmarks');
  }
  
  // Attention concerns
  if (batScore.attention < 3) {
    steps.push('Validate user demand through surveys or interviews');
    steps.push('Consider marketing strategy to drive awareness');
  }
  
  // If everything looks good
  if (steps.length === 0) {
    steps.push('Validate with target users through prototypes or interviews');
    steps.push('Define success metrics and monitoring strategy');
    steps.push('Create detailed technical specification');
    steps.push('Estimate resources and timeline for execution');
  }
  
  return steps.slice(0, 4);  // Limit to top 4 steps
}

function estimateResources(starRating: StarRating): string {
  if (starRating.feasibility >= 8) {
    return 'Low - Straightforward implementation';
  } else if (starRating.feasibility >= 5) {
    return 'Medium - Standard development effort';
  } else {
    return 'High - Complex implementation requiring expertise';
  }
}

function estimateTimeline(starRating: StarRating): string {
  if (starRating.feasibility >= 8) {
    return '2-4 weeks - Quick win';
  } else if (starRating.feasibility >= 5) {
    return '2-3 months - Standard development timeline';
  } else {
    return '3-6 months - Major initiative';
  }
}

// ============================================================================
// Build vs Buy Analysis
// ============================================================================

function analyzeBuildVsBuy(feature: string): BuildVsBuyResult {
  const featureLower = feature.toLowerCase();
  
  // Determine if feature is likely core or commodity
  const commodityFeatures = [
    'notification', 'email', 'auth', 'authentication', 'payment', 
    'billing', 'analytics', 'logging', 'monitoring', 'search',
    'cms', 'crm', 'support', 'chat', 'storage', 'cdn'
  ];
  
  const isCommodity = commodityFeatures.some(cf => featureLower.includes(cf));
  
  const options: BuildVsBuyOption[] = [
    {
      name: 'Build In-House',
      type: 'build',
      cost: isCommodity ? '$50k-150k initial + $20k/year' : '$100k-500k initial',
      timeline: isCommodity ? '2-3 months' : '4-6 months',
      pros: [
        'Full customization and control',
        'No ongoing vendor fees',
        'Build internal expertise',
        'IP ownership',
        isCommodity ? 'Potential long-term savings' : 'Core differentiator'
      ],
      cons: [
        'Higher upfront investment',
        'Maintenance burden',
        'Longer time to market',
        'Technical risk',
        'Opportunity cost'
      ]
    },
    {
      name: 'Buy/SaaS Solution',
      type: 'buy',
      cost: isCommodity ? '$500-5000/month' : '$2000-10000/month',
      timeline: '1-4 weeks integration',
      pros: [
        'Faster time to market',
        'Lower upfront cost',
        'Vendor expertise and support',
        'Regular updates and maintenance',
        'Proven reliability'
      ],
      cons: [
        'Ongoing subscription costs',
        'Limited customization',
        'Vendor lock-in risk',
        'Data privacy concerns',
        'Dependency on third-party'
      ]
    }
  ];
  
  const recommendation = isCommodity 
    ? 'RECOMMEND: BUY - This is a commodity feature. Focus engineering resources on core differentiators.'
    : 'EVALUATE BOTH - Consider building if this is a core differentiator, buying if it enables faster market entry.';
  
  const reasoning = isCommodity
    ? [
        'This appears to be a commodity feature widely available as SaaS',
        'Building would divert resources from core product development',
        'Third-party solutions likely more robust and feature-complete',
        'Integration is faster than building from scratch'
      ]
    : [
        'This could be a core differentiator worth investing in',
        'Building allows unique positioning in the market',
        'Consider hybrid: buy for MVP, build for scale',
        'Evaluate based on team expertise and timeline pressure'
      ];
  
  return {
    feature,
    options,
    recommendation,
    reasoning
  };
}

// ============================================================================
// Formatting
// ============================================================================

function formatTextReview(result: ReviewResult): string {
  const batBars = {
    brand: '●'.repeat(result.batScore.brand) + '○'.repeat(5 - result.batScore.brand),
    attention: '●'.repeat(result.batScore.attention) + '○'.repeat(5 - result.batScore.attention),
    trust: '●'.repeat(result.batScore.trust) + '○'.repeat(5 - result.batScore.trust)
  };
  
  const stars = '⭐'.repeat(result.starRating.overall) + '○'.repeat(10 - result.starRating.overall);
  
  return `
📊 CEO Review: ${result.feature}

🎯 BAT Framework Score
   Brand:     ${batBars.brand} ${result.batScore.brand}/5
   Attention: ${batBars.attention} ${result.batScore.attention}/5
   Trust:     ${batBars.trust} ${result.batScore.trust}/5
   TOTAL:     ${result.batScore.total}/15

⭐ 10-Star Methodology
   Overall: ${stars} ${result.starRating.overall}/10

   Problem:     ${'★'.repeat(result.starRating.problem)}${'☆'.repeat(10 - result.starRating.problem)} ${result.starRating.problem}/10
   Usability:   ${'★'.repeat(result.starRating.usability)}${'☆'.repeat(10 - result.starRating.usability)} ${result.starRating.usability}/10
   Delight:     ${'★'.repeat(result.starRating.delight)}${'☆'.repeat(10 - result.starRating.delight)} ${result.starRating.delight}/10
   Feasibility: ${'★'.repeat(result.starRating.feasibility)}${'☆'.repeat(10 - result.starRating.feasibility)} ${result.starRating.feasibility}/10
   Viability:   ${'★'.repeat(result.starRating.viability)}${'☆'.repeat(10 - result.starRating.viability)} ${result.starRating.viability}/10

🎯 Final Verdict: ${result.recommendation}

📍 Next Steps:
${result.nextSteps.map((s, i) => `   ${i + 1}. ${s}`).join('\n')}

💰 Resources: ${result.resources}
📅 Timeline: ${result.timeline}
`;
}

function formatMarkdownReview(result: ReviewResult): string {
  return `# CEO Review: ${result.feature}

## BAT Framework Score

| Dimension | Score | Visual |
|-----------|-------|--------|
| Brand | ${result.batScore.brand}/5 | ${'●'.repeat(result.batScore.brand)}${'○'.repeat(5 - result.batScore.brand)} |
| Attention | ${result.batScore.attention}/5 | ${'●'.repeat(result.batScore.attention)}${'○'.repeat(5 - result.batScore.attention)} |
| Trust | ${result.batScore.trust}/5 | ${'●'.repeat(result.batScore.trust)}${'○'.repeat(5 - result.batScore.trust)} |
| **Total** | **${result.batScore.total}/15** | |

## 10-Star Methodology

**Overall: ${result.starRating.overall}/10** ${'⭐'.repeat(result.starRating.overall)}

| Dimension | Score | Visual |
|-----------|-------|--------|
| Problem | ${result.starRating.problem}/10 | ${'★'.repeat(result.starRating.problem)}${'☆'.repeat(10 - result.starRating.problem)} |
| Usability | ${result.starRating.usability}/10 | ${'★'.repeat(result.starRating.usability)}${'☆'.repeat(10 - result.starRating.usability)} |
| Delight | ${result.starRating.delight}/10 | ${'★'.repeat(result.starRating.delight)}${'☆'.repeat(10 - result.starRating.delight)} |
| Feasibility | ${result.starRating.feasibility}/10 | ${'★'.repeat(result.starRating.feasibility)}${'☆'.repeat(10 - result.starRating.feasibility)} |
| Viability | ${result.starRating.viability}/10 | ${'★'.repeat(result.starRating.viability)}${'☆'.repeat(10 - result.starRating.viability)} |

## Recommendation

**${result.recommendation}**

## Next Steps

${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Resources

${result.resources}

## Timeline

${result.timeline}
`;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Review a feature using BAT framework and 10-star methodology
 */
export function review(feature: string, options: ReviewOptions = {}): SkillResult<ReviewResult> {
  try {
    const batScore = calculateBatScore(feature, options);
    const starRating = calculateStarRating(feature, options);
    
    const recommendation = getRecommendation(batScore.total, starRating.overall);
    const nextSteps = generateNextSteps(batScore, starRating);
    
    const result: ReviewResult = {
      feature,
      batScore,
      starRating,
      recommendation,
      nextSteps,
      resources: estimateResources(starRating),
      timeline: estimateTimeline(starRating)
    };
    
    const message = formatTextReview(result);
    
    return {
      success: true,
      data: result,
      message
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ Review failed: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Compare two features side-by-side
 */
export function compare(feature1: string, feature2: string, options: ReviewOptions = {}): SkillResult<CompareResult> {
  try {
    const result1 = review(feature1, options).data!;
    const result2 = review(feature2, options).data!;
    
    const winner = result1.batScore.total > result2.batScore.total 
      ? feature1 
      : result2.batScore.total > result1.batScore.total 
        ? feature2 
        : null;
    
    const compareResult: CompareResult = {
      feature1: result1,
      feature2: result2,
      winner
    };
    
    const message = `⚖️ Feature Comparison\n\n` +
      `${feature1}:\n` +
      `  BAT: ${result1.batScore.total}/15 | Stars: ${result1.starRating.overall}/10\n` +
      `  → ${result1.recommendation}\n\n` +
      `${feature2}:\n` +
      `  BAT: ${result2.batScore.total}/15 | Stars: ${result2.starRating.overall}/10\n` +
      `  → ${result2.recommendation}\n\n` +
      `${winner ? `🏆 Winner: ${winner}` : '🤝 Tie - Equal scores'}`;
    
    return {
      success: true,
      data: compareResult,
      message
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ Comparison failed: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Analyze build vs buy decision
 */
export function buildVsBuy(feature: string): SkillResult<BuildVsBuyResult> {
  try {
    const result = analyzeBuildVsBuy(feature);
    
    let message = `🏗️ Build vs Buy Analysis: ${feature}\n\n`;
    
    for (const option of result.options) {
      message += `${option.name} (${option.type.toUpperCase()})\n`;
      message += `  Cost: ${option.cost}\n`;
      message += `  Timeline: ${option.timeline}\n`;
      message += `  Pros:\n${option.pros.map(p => `    ✓ ${p}`).join('\n')}\n`;
      message += `  Cons:\n${option.cons.map(c => `    ✗ ${c}`).join('\n')}\n\n`;
    }
    
    message += `📋 ${result.recommendation}\n\n`;
    message += `Reasoning:\n${result.reasoning.map(r => `  • ${r}`).join('\n')}`;
    
    return {
      success: true,
      data: result,
      message
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ Analysis failed: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Get framework documentation
 */
export function getFramework(): SkillResult<FrameworkInfo> {
  const framework: FrameworkInfo = {
    bat: {
      description: 'Evaluates product opportunities across Brand, Attention, and Trust dimensions',
      dimensions: [
        { name: 'Brand', description: 'Does this strengthen our brand?', maxScore: 5 },
        { name: 'Attention', description: 'Will users actually use this?', maxScore: 5 },
        { name: 'Trust', description: 'Does this build user trust?', maxScore: 5 }
      ],
      scoring: [
        { range: '12-15', recommendation: 'BUILD', description: 'Strong signal - prioritize' },
        { range: '10-11', recommendation: 'BUILD', description: 'Good signal - proceed' },
        { range: '8-9', recommendation: 'CONSIDER', description: 'Mixed signal - needs refinement' },
        { range: '0-7', recommendation: "DON'T BUILD", description: 'Weak signal - reconsider' }
      ]
    },
    tenStar: {
      description: 'Inspired by Brian Chesky - push beyond "good enough" to exceptional',
      scale: [
        { stars: 1, description: 'Works (barely)' },
        { stars: 2, description: 'Functional but frustrating' },
        { stars: 3, description: 'Meets basic needs' },
        { stars: 4, description: 'Adequate' },
        { stars: 5, description: 'Meets expectations' },
        { stars: 6, description: 'Good' },
        { stars: 7, description: 'Great - exceeds expectations' },
        { stars: 8, description: 'Excellent - delightful' },
        { stars: 9, description: 'World-class' },
        { stars: 10, description: 'Transforms the category' }
      ]
    }
  };
  
  const message = `🎯 BAT Framework\n\n` +
    `Evaluates product opportunities across three dimensions:\n` +
    `• Brand: Does this strengthen our brand?\n` +
    `• Attention: Will users actually use this?\n` +
    `• Trust: Does this build user trust?\n\n` +
    `Scoring:\n` +
    `• 12-15: BUILD - Strong signal\n` +
    `• 10-11: BUILD - Good signal\n` +
    `• 8-9: CONSIDER - Mixed signal\n` +
    `• 0-7: DON'T BUILD - Weak signal\n\n` +
    `⭐ 10-Star Methodology\n\n` +
    `Inspired by Brian Chesky - push beyond "good enough":\n` +
    `• 1-3★: Below expectations\n` +
    `• 5★: Meets expectations\n` +
    `• 7★: Exceeds expectations\n` +
    `• 10★: Transforms the category`;
  
  return {
    success: true,
    data: framework,
    message
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  review,
  compare,
  buildVsBuy,
  getFramework
};
