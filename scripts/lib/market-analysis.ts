/**
 * Market analysis utilities for product strategy
 */

export interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  marketShare?: string;
}

export interface MarketAnalysis {
  market: string;
  size?: string;
  growth?: string;
  competitors: Competitor[];
  trends: string[];
  opportunities: string[];
  threats: string[];
}

export interface FeasibilityAnalysis {
  technical: {
    score: number; // 1-5
    complexity: 'low' | 'medium' | 'high';
    risks: string[];
  };
  business: {
    score: number; // 1-5
    impact: 'low' | 'medium' | 'high';
    revenue?: string;
    timeline: string;
  };
  resources: {
    score: number; // 1-5
    team: string;
    budget?: string;
    constraints: string[];
  };
}

/**
 * Get template for market analysis
 */
export function getMarketTemplate(market: string): MarketAnalysis {
  return {
    market,
    competitors: [],
    trends: [],
    opportunities: [],
    threats: []
  };
}

/**
 * Analyze feasibility based on complexity factors
 */
export function analyzeFeasibility(
  _featureName: string,
  options: {
    complexity?: 'low' | 'medium' | 'high';
    teamSize?: number;
    timeline?: string;
    dependencies?: string[];
  } = {}
): FeasibilityAnalysis {
  const { complexity = 'medium', teamSize = 2, timeline = '3 months', dependencies = [] } = options;

  // Calculate technical score
  const complexityScore = { low: 4, medium: 3, high: 2 }[complexity];
  const dependencyPenalty = Math.min(dependencies.length * 0.5, 2);
  const technicalScore = Math.max(1, Math.min(5, complexityScore - dependencyPenalty));

  // Calculate business score based on timeline
  const timelineMonths = parseInt(timeline) || 3;
  const timelineScore = timelineMonths <= 1 ? 5 : timelineMonths <= 3 ? 4 : timelineMonths <= 6 ? 3 : 2;

  // Calculate resource score
  const teamScore = teamSize >= 3 ? 4 : teamSize >= 2 ? 3 : 2;

  return {
    technical: {
      score: technicalScore,
      complexity,
      risks: dependencies.length > 0 
        ? [`Dependencies on: ${dependencies.join(', ')}`]
        : ['No major technical risks identified']
    },
    business: {
      score: timelineScore,
      impact: 'medium',
      timeline
    },
    resources: {
      score: teamScore,
      team: `${teamSize} engineer${teamSize > 1 ? 's' : ''}`,
      constraints: timelineMonths < 2 ? ['Tight timeline'] : []
    }
  };
}

/**
 * Generate next steps for a feature
 */
export function generateNextSteps(
  featureName: string,
  feasibility: FeasibilityAnalysis
): string[] {
  const steps: string[] = [];

  // Discovery phase
  steps.push(`Design ${featureName} user experience and interface`);

  // Technical planning
  if (feasibility.technical.complexity === 'high') {
    steps.push('Create technical design document');
    steps.push('Identify and mitigate technical risks');
  }

  // Implementation
  steps.push(`Implement ${featureName} core functionality`);
  steps.push('Add comprehensive tests');

  // Validation
  steps.push('Deploy to staging for internal testing');
  steps.push('Gather feedback and iterate');

  // Launch
  steps.push('Deploy to production');
  steps.push('Monitor metrics and user feedback');

  return steps;
}

/**
 * Format market analysis for display
 */
export function formatMarketAnalysis(analysis: MarketAnalysis): string {
  const lines: string[] = [
    `Market Analysis: ${analysis.market}`,
    '============================'
  ];

  if (analysis.size) {
    lines.push(`Market Size: ${analysis.size}`);
  }
  if (analysis.growth) {
    lines.push(`Growth Rate: ${analysis.growth}`);
  }

  if (analysis.competitors.length > 0) {
    lines.push('');
    lines.push('Competitors:');
    for (const comp of analysis.competitors) {
      lines.push(`  • ${comp.name}${comp.marketShare ? ` (${comp.marketShare})` : ''}`);
      if (comp.strengths.length > 0) {
        lines.push(`    Strengths: ${comp.strengths.join(', ')}`);
      }
    }
  }

  if (analysis.trends.length > 0) {
    lines.push('');
    lines.push('Market Trends:');
    for (const trend of analysis.trends) {
      lines.push(`  • ${trend}`);
    }
  }

  if (analysis.opportunities.length > 0) {
    lines.push('');
    lines.push('Opportunities:');
    for (const opp of analysis.opportunities) {
      lines.push(`  • ${opp}`);
    }
  }

  if (analysis.threats.length > 0) {
    lines.push('');
    lines.push('Threats:');
    for (const threat of analysis.threats) {
      lines.push(`  • ${threat}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format feasibility analysis for display
 */
export function formatFeasibilityAnalysis(analysis: FeasibilityAnalysis): string {
  const lines: string[] = ['Feasibility Analysis', '===================='];

  lines.push('');
  lines.push(`Technical: ${'⭐'.repeat(analysis.technical.score)}${'⚫'.repeat(5 - analysis.technical.score)} (${analysis.technical.complexity})`);
  if (analysis.technical.risks.length > 0) {
    lines.push('  Risks:');
    for (const risk of analysis.technical.risks) {
      lines.push(`    • ${risk}`);
    }
  }

  lines.push('');
  lines.push(`Business: ${'⭐'.repeat(analysis.business.score)}${'⚫'.repeat(5 - analysis.business.score)} (${analysis.business.impact} impact)`);
  lines.push(`  Timeline: ${analysis.business.timeline}`);
  if (analysis.business.revenue) {
    lines.push(`  Revenue: ${analysis.business.revenue}`);
  }

  lines.push('');
  lines.push(`Resources: ${'⭐'.repeat(analysis.resources.score)}${'⚫'.repeat(5 - analysis.resources.score)}`);
  lines.push(`  Team: ${analysis.resources.team}`);
  if (analysis.resources.constraints.length > 0) {
    lines.push('  Constraints:');
    for (const constraint of analysis.resources.constraints) {
      lines.push(`    • ${constraint}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get market insights template
 */
export function getMarketInsightsTemplate(feature: string, market: string): string {
  return `
## Market Context for ${feature}

### Market: ${market}

#### Key Questions to Answer:
1. Who are the top 3 competitors in this space?
2. What are users currently using instead?
3. What's the market size and growth rate?
4. What trends are shaping this market?

#### Competitive Analysis Framework:
| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|
|            |           |            |               |
|            |           |            |               |
|            |           |            |               |

#### User Research Questions:
- What job is the user hiring this feature to do?
- What pain points exist in current solutions?
- How frequently would this be used?
- What's the willingness to pay?

#### Success Metrics:
- Adoption rate within 30 days
- User satisfaction score (CSAT)
- Retention impact
- Revenue attribution
`.trim();
}
