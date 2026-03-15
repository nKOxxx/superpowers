export interface BATScores {
  brand: number;     // 0-5
  attention: number; // 0-5
  trust: number;     // 0-5
}

export interface CEOReviewOptions {
  featureName: string;
  description?: string;
  brand?: number;
  attention?: number;
  trust?: number;
  autoScore?: boolean;
}

export interface CEOReviewResult {
  success: boolean;
  featureName: string;
  scores: BATScores;
  totalStars: number;
  recommendation: 'build' | 'consider' | 'dont-build';
  reasoning: string[];
  nextSteps: string[];
  error?: string;
}

// BAT criteria for auto-scoring
const BAT_CRITERIA = {
  brand: [
    'Does this feature align with our core brand values?',
    'Would this feature differentiate us from competitors?',
    'Does this enhance our brand recognition or reputation?',
    'Is this feature consistent with our existing product ecosystem?',
    'Would our target audience associate this with our brand positively?',
  ],
  attention: [
    'Is there existing market demand for this feature?',
    'Would this feature attract new users/customers?',
    'Is this something our users are actively asking for?',
    'Would this feature generate buzz or word-of-mouth?',
    'Is the timing right for this feature in the market?',
  ],
  trust: [
    'Can we execute this feature with high quality?',
    'Do we have the technical capability to build this?',
    'Will this feature work reliably for users?',
    'Does this feature protect user privacy and security?',
    'Have we validated the need with actual users?',
  ],
};

function calculateAutoScore(featureName: string, description: string = '', dimension: keyof typeof BAT_CRITERIA): number {
  // Simple heuristic scoring based on keywords and description length
  // In a real implementation, this might use ML or more sophisticated analysis
  
  const text = `${featureName} ${description}`.toLowerCase();
  let score = 2.5; // baseline
  
  const indicators: Record<string, Record<string, number>> = {
    brand: {
      'brand': 0.5, 'identity': 0.5, 'recognition': 0.5, 'premium': 0.3,
      'unique': 0.4, 'different': 0.4, 'stand out': 0.4, 'positioning': 0.4,
    },
    attention: {
      'demand': 0.5, 'growth': 0.5, 'viral': 0.5, 'market': 0.3,
      'users want': 0.4, 'requested': 0.4, 'trending': 0.4, 'popular': 0.4,
    },
    trust: {
      'secure': 0.5, 'privacy': 0.5, 'reliable': 0.5, 'tested': 0.4,
      'validated': 0.4, 'proven': 0.4, 'stable': 0.4, 'quality': 0.3,
    },
  };

  for (const [keyword, weight] of Object.entries(indicators[dimension])) {
    if (text.includes(keyword)) {
      score += weight;
    }
  }

  // Description quality bonus
  if (description.length > 100) score += 0.2;
  if (description.length > 200) score += 0.2;

  return Math.min(5, Math.max(0, score));
}

function getRecommendation(totalStars: number): { recommendation: 'build' | 'consider' | 'dont-build'; reasoning: string[] } {
  if (totalStars >= 12) {
    return {
      recommendation: 'build',
      reasoning: [
        `Strong BAT score (${totalStars}/15) indicates high potential`,
        'Feature aligns well with brand, captures attention, and builds trust',
        'Green light to proceed with full investment',
      ],
    };
  } else if (totalStars >= 8) {
    return {
      recommendation: 'consider',
      reasoning: [
        `Moderate BAT score (${totalStars}/15) shows promise but with caveats`,
        'Review weak dimensions and consider improvements',
        'May need validation or scope adjustment before full commitment',
      ],
    };
  } else {
    return {
      recommendation: 'dont-build',
      reasoning: [
        `Low BAT score (${totalStars}/15) indicates significant concerns`,
        'Feature may not align with strategic priorities',
        'Resources better allocated to higher-scoring initiatives',
      ],
    };
  }
}

function generateNextSteps(recommendation: 'build' | 'consider' | 'dont-build', scores: BATScores): string[] {
  const steps: string[] = [];

  switch (recommendation) {
    case 'build':
      steps.push('Create detailed product specification');
      steps.push('Define success metrics and KPIs');
      steps.push('Allocate development resources');
      steps.push('Set target launch date');
      if (scores.trust < 4) {
        steps.push('Conduct technical feasibility review');
      }
      break;
    
    case 'consider':
      if (scores.brand < 3) {
        steps.push('Revisit brand alignment - consider how to strengthen connection');
      }
      if (scores.attention < 3) {
        steps.push('Validate market demand with user research');
      }
      if (scores.trust < 3) {
        steps.push('Assess technical risks and mitigation strategies');
      }
      steps.push('Re-score after addressing weak dimensions');
      break;
    
    case 'dont-build':
      steps.push('Document reasoning for future reference');
      steps.push('Identify alternative approaches or pivots');
      steps.push('Revisit if market conditions change');
      steps.push('Redirect resources to higher-priority initiatives');
      break;
  }

  return steps;
}

export async function planCEOReview(options: CEOReviewOptions): Promise<CEOReviewResult> {
  try {
    const { featureName, description, autoScore } = options;

    // Calculate or use provided scores
    let scores: BATScores;
    
    if (autoScore || (options.brand === undefined && options.attention === undefined && options.trust === undefined)) {
      scores = {
        brand: options.brand ?? calculateAutoScore(featureName, description, 'brand'),
        attention: options.attention ?? calculateAutoScore(featureName, description, 'attention'),
        trust: options.trust ?? calculateAutoScore(featureName, description, 'trust'),
      };
    } else {
      scores = {
        brand: options.brand ?? 2.5,
        attention: options.attention ?? 2.5,
        trust: options.trust ?? 2.5,
      };
    }

    // Round to 1 decimal place
    scores = {
      brand: Math.round(scores.brand * 10) / 10,
      attention: Math.round(scores.attention * 10) / 10,
      trust: Math.round(scores.trust * 10) / 10,
    };

    const totalStars = Math.round((scores.brand + scores.attention + scores.trust) * 10) / 10;
    const { recommendation, reasoning } = getRecommendation(totalStars);
    const nextSteps = generateNextSteps(recommendation, scores);

    return {
      success: true,
      featureName,
      scores,
      totalStars,
      recommendation,
      reasoning,
      nextSteps,
    };

  } catch (error) {
    return {
      success: false,
      featureName: options.featureName,
      scores: { brand: 0, attention: 0, trust: 0 },
      totalStars: 0,
      recommendation: 'dont-build',
      reasoning: [],
      nextSteps: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function formatReviewOutput(result: CEOReviewResult): string {
  const lines: string[] = [];
  
  lines.push(`# CEO Review: ${result.featureName}`);
  lines.push('');
  lines.push('## BAT Score');
  lines.push('');
  lines.push(`| Dimension | Score |`);
  lines.push(`|-----------|-------|`);
  lines.push(`| Brand     | ${result.scores.brand.toFixed(1)}/5 |`);
  lines.push(`| Attention | ${result.scores.attention.toFixed(1)}/5 |`);
  lines.push(`| Trust     | ${result.scores.trust.toFixed(1)}/5 |`);
  lines.push(`| **Total** | **${result.totalStars.toFixed(1)}/15** |`);
  lines.push('');
  lines.push(`## Recommendation: ${result.recommendation.toUpperCase().replace('-', ' ')}`);
  lines.push('');
  lines.push('### Reasoning');
  lines.push('');
  for (const reason of result.reasoning) {
    lines.push(`- ${reason}`);
  }
  lines.push('');
  lines.push('### Next Steps');
  lines.push('');
  for (const step of result.nextSteps) {
    lines.push(`- [ ] ${step}`);
  }
  
  return lines.join('\n');
}