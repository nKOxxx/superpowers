export interface CEOReviewOptions {
  feature: string;
  goal?: string;
  audience?: string;
  competition?: string;
  trust?: string;
  brand?: number;
  attention?: number;
  trustScore?: number;
}

export interface BATScores {
  brand: number;
  attention: number;
  trust: number;
  total: number;
}

export interface CEOReviewResult {
  feature: string;
  scores: BATScores;
  recommendation: 'BUILD' | 'CONSIDER' | 'DON\'T BUILD';
  rationale: string[];
  nextSteps: string[];
}

export class PlanCEOReviewSkill {
  review(options: CEOReviewOptions): CEOReviewResult {
    const scores = this.calculateScores(options);
    const recommendation = this.getRecommendation(scores.total);
    const rationale = this.generateRationale(scores, options);
    const nextSteps = this.generateNextSteps(recommendation, options);

    return {
      feature: options.feature,
      scores,
      recommendation,
      rationale,
      nextSteps
    };
  }

  private calculateScores(options: CEOReviewOptions): BATScores {
    // Use provided scores or auto-calculate based on context
    const brand = options.brand ?? this.autoScoreBrand(options);
    const attention = options.attention ?? this.autoScoreAttention(options);
    const trust = options.trustScore ?? this.autoScoreTrust(options);

    return {
      brand: Math.min(5, Math.max(0, brand)),
      attention: Math.min(5, Math.max(0, attention)),
      trust: Math.min(5, Math.max(0, trust)),
      total: brand + attention + trust
    };
  }

  private autoScoreBrand(options: CEOReviewOptions): number {
    let score = 3; // Default: good fit

    const feature = options.feature.toLowerCase();
    const goal = (options.goal || '').toLowerCase();

    // Revolutionary/category defining
    if (goal.includes('revolutionary') || goal.includes('first') || goal.includes('only')) {
      score = 5;
    }
    // Strong differentiation
    else if (goal.includes('different') || goal.includes('innovative') || goal.includes('unique')) {
      score = 4;
    }
    // Table stakes
    else if (feature.includes('login') || feature.includes('auth') || feature.includes('settings')) {
      score = 2;
    }

    return score;
  }

  private autoScoreAttention(options: CEOReviewOptions): number {
    let score = 3; // Default: monthly use

    const feature = options.feature.toLowerCase();
    const audience = (options.audience || '').toLowerCase();

    // Daily use / core workflow
    if (feature.includes('feed') || feature.includes('dashboard') || feature.includes('chat') ||
        feature.includes('notification') || feature.includes('sync')) {
      score = 5;
    }
    // Weekly use / important workflow
    else if (feature.includes('report') || feature.includes('analytics') || feature.includes('export')) {
      score = 4;
    }
    // Rare use / edge case
    else if (feature.includes('import') || feature.includes('migrate') || feature.includes('backup')) {
      score = 2;
    }

    // High engagement audience
    if (audience.includes('daily') || audience.includes('core') || audience.includes('power user')) {
      score = Math.min(5, score + 1);
    }

    return score;
  }

  private autoScoreTrust(options: CEOReviewOptions): number {
    let score = 3; // Default: transparency

    const feature = options.feature.toLowerCase();
    const trust = (options.trust || '').toLowerCase();

    // Security-critical
    if (feature.includes('security') || feature.includes('encryption') || feature.includes('privacy') ||
        feature.includes('auth') || feature.includes('verify') || feature.includes('2fa')) {
      score = 5;
    }
    // Reliability-critical
    else if (feature.includes('payment') || feature.includes('billing') || feature.includes('backup') ||
             feature.includes('sync')) {
      score = 4;
    }

    // Has trust assets
    if (trust.includes('certified') || trust.includes('audited') || trust.includes('enterprise')) {
      score = Math.min(5, score + 1);
    }

    return score;
  }

  private getRecommendation(total: number): 'BUILD' | 'CONSIDER' | 'DON\'T BUILD' {
    if (total >= 10) return 'BUILD';
    if (total >= 8) return 'CONSIDER';
    return 'DON\'T BUILD';
  }

  private generateRationale(scores: BATScores, options: CEOReviewOptions): string[] {
    const rationale: string[] = [];

    // Brand rationale
    if (scores.brand >= 4) {
      rationale.push('Strong brand differentiation potential');
    } else if (scores.brand <= 2) {
      rationale.push('Limited brand impact - table stakes feature');
    }

    // Attention rationale
    if (scores.attention >= 4) {
      rationale.push('High user engagement potential');
    } else if (scores.attention <= 2) {
      rationale.push('Limited usage frequency - consider impact carefully');
    }

    // Trust rationale
    if (scores.trust >= 4) {
      rationale.push('Critical trust component');
    }

    // Goal alignment
    if (options.goal) {
      if (options.goal.includes('revenue') || options.goal.includes('monetiz')) {
        rationale.push('Direct revenue impact should be modeled');
      }
      if (options.goal.includes('retention') || options.goal.includes('engagement')) {
        rationale.push('User retention play - measure cohort impact');
      }
    }

    // Competition
    if (options.competition) {
      rationale.push(`Competitive landscape: ${options.competition}`);
    }

    if (rationale.length === 0) {
      rationale.push('Standard feature improvement with moderate impact');
    }

    return rationale;
  }

  private generateNextSteps(
    recommendation: 'BUILD' | 'CONSIDER' | 'DON\'T BUILD',
    options: CEOReviewOptions
  ): string[] {
    const steps: string[] = [];

    switch (recommendation) {
      case 'BUILD':
        steps.push('Define success metrics (DAU, engagement time, etc.)');
        steps.push('Coordinate with marketing for launch narrative');
        steps.push('Set 30-day post-launch review date');
        if (options.goal?.includes('revenue')) {
          steps.push('Model revenue impact with optimistic/pessimistic scenarios');
        }
        break;

      case 'CONSIDER':
        steps.push('Validate assumptions with user research');
        steps.push('Estimate development cost and timeline');
        steps.push('Compare with alternative features on roadmap');
        steps.push('Re-evaluate if key assumptions change');
        break;

      case 'DON\'T BUILD':
        steps.push('Document rationale for future reference');
        steps.push('Identify higher-priority features from backlog');
        steps.push('Revisit if market conditions change significantly');
        break;
    }

    return steps;
  }

  formatOutput(result: CEOReviewResult): string {
    const star = '⭐';
    const empty = '○';

    const formatScore = (score: number) => {
      return star.repeat(score) + empty.repeat(5 - score);
    };

    const recommendationEmoji = {
      'BUILD': '✅',
      'CONSIDER': '🤔',
      'DON\'T BUILD': '❌'
    };

    return `
══════════════════════════════════════════════════
${result.feature}
══════════════════════════════════════════════════

Brand:     ${formatScore(result.scores.brand)} (${result.scores.brand}/5)
Attention: ${formatScore(result.scores.attention)} (${result.scores.attention}/5)
Trust:     ${formatScore(result.scores.trust)} (${result.scores.trust}/5)

Total: ${result.scores.total}/15 ⭐

Recommendation: ${result.recommendation} ${recommendationEmoji[result.recommendation]}

Rationale:
${result.rationale.map(r => `  • ${r}`).join('\n')}

Next Steps:
${result.nextSteps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

══════════════════════════════════════════════════
`;
  }
}

export default PlanCEOReviewSkill;
