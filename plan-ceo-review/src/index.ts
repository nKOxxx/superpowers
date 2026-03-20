/**
 * Plan CEO Review Skill - Product strategy with BAT framework
 * 
 * BAT Framework evaluates Brand, Attention, Trust dimensions
 * 10-Star Methodology assesses overall product excellence
 */

import { Logger, ConsoleLogger, SkillResult } from '@openclaw/superpowers-shared';

export type AudienceType = 'enterprise' | 'consumer' | 'saas' | 'marketplace' | 'developer';
export type MarketType = 'b2b' | 'b2c' | 'saas' | 'fintech' | 'healthcare' | 'ecommerce' | 'other';
export type OutputFormat = 'summary' | 'detailed';

export interface CeoReviewOptions {
  featureName: string;
  compareWith?: string;
  buildVsBuy?: boolean;
  audience?: AudienceType;
  market?: MarketType;
  format?: OutputFormat;
  weights?: {
    brand: number;
    attention: number;
    trust: number;
  };
}

export interface BatScore {
  brand: number;     // 0-5: Does this strengthen our brand?
  attention: number; // 0-5: Will users actually use this?
  trust: number;     // 0-5: Does this build user trust?
  total: number;
}

export interface TenStarScore {
  problem: number;      // 0-10: Problem-solution fit
  usability: number;    // 0-10: Ease of use
  delight: number;      // 0-10: Creates joy
  feasibility: number;  // 0-10: Can we build it well?
  viability: number;    // 0-10: Business model
  overall: number;
}

export interface BuildVsBuyAnalysis {
  recommendation: 'build' | 'buy' | 'hybrid';
  build: {
    cost: string;
    time: string;
    pros: string[];
    cons: string[];
  };
  buy: {
    cost: string;
    time: string;
    pros: string[];
    cons: string[];
  };
  analysis: string;
}

export interface CeoReviewResult {
  featureName: string;
  batScore: BatScore;
  tenStarScore: TenStarScore;
  batRecommendation: 'BUILD' | 'CONSIDER' | "DON'T BUILD";
  tenStarRating: string;
  buildVsBuy?: BuildVsBuyAnalysis;
  nextSteps: string[];
  timelineEstimate: string;
  resourceEstimate: string;
}

export class PlanCeoReviewSkill {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  async review(options: CeoReviewOptions): Promise<CeoReviewResult> {
    this.logger.info(`Analyzing feature: ${options.featureName}`);

    // Calculate BAT scores (in a real implementation, this might use AI/LLM)
    const batScore = this.calculateBatScore(options);
    
    // Calculate 10-star scores
    const tenStarScore = this.calculateTenStarScore(options);

    // Determine recommendations
    const batRecommendation = this.getBatRecommendation(batScore.total);
    const tenStarRating = this.getTenStarRating(tenStarScore.overall);

    // Build vs Buy analysis if requested
    let buildVsBuy: BuildVsBuyAnalysis | undefined;
    if (options.buildVsBuy) {
      buildVsBuy = this.analyzeBuildVsBuy(options);
    }

    // Generate next steps and estimates
    const nextSteps = this.generateNextSteps(options, batRecommendation, tenStarScore);
    const timelineEstimate = this.estimateTimeline(options, tenStarScore);
    const resourceEstimate = this.estimateResources(options, tenStarScore);

    return {
      featureName: options.featureName,
      batScore,
      tenStarScore,
      batRecommendation,
      tenStarRating,
      buildVsBuy,
      nextSteps,
      timelineEstimate,
      resourceEstimate
    };
  }

  private calculateBatScore(options: CeoReviewOptions): BatScore {
    // In a real implementation, this would use heuristics or AI analysis
    // For now, we'll generate reasonable estimates based on feature characteristics
    
    const feature = options.featureName.toLowerCase();
    
    // Brand scoring (0-5)
    let brand = 3;
    if (feature.includes('ai') || feature.includes('ml')) brand = 4;
    if (feature.includes('security') || feature.includes('privacy')) brand = 5;
    if (feature.includes('integration') || feature.includes('api')) brand = 4;
    if (feature.includes('export') || feature.includes('backup')) brand = 2;

    // Attention scoring (0-5)
    let attention = 3;
    if (feature.includes('mobile') || feature.includes('app')) attention = 5;
    if (feature.includes('search') || feature.includes('filter')) attention = 5;
    if (feature.includes('notification') || feature.includes('alert')) attention = 4;
    if (feature.includes('admin') || feature.includes('settings')) attention = 2;

    // Trust scoring (0-5)
    let trust = 3;
    if (feature.includes('security') || feature.includes('auth')) trust = 5;
    if (feature.includes('backup') || feature.includes('export')) trust = 5;
    if (feature.includes('privacy') || feature.includes('gdpr')) trust = 5;
    if (feature.includes('delete') || feature.includes('remove')) trust = 4;

    // Apply weights if provided
    const weights = options.weights || { brand: 1, attention: 1, trust: 1 };
    brand = Math.min(5, Math.round(brand * weights.brand));
    attention = Math.min(5, Math.round(attention * weights.attention));
    trust = Math.min(5, Math.round(trust * weights.trust));

    return {
      brand,
      attention,
      trust,
      total: brand + attention + trust
    };
  }

  private calculateTenStarScore(options: CeoReviewOptions): TenStarScore {
    const feature = options.featureName.toLowerCase();
    const audience = options.audience;
    
    // Problem-solution fit (0-10)
    let problem = 6;
    if (feature.includes('search') || feature.includes('filter')) problem = 9;
    if (feature.includes('payment') || feature.includes('billing')) problem = 8;
    if (feature.includes('export') || feature.includes('import')) problem = 7;
    
    // Usability (0-10)
    let usability = 6;
    if (feature.includes('mobile')) usability = 7;
    if (feature.includes('dashboard')) usability = 8;
    if (feature.includes('wizard') || feature.includes('guide')) usability = 8;

    // Delight (0-10)
    let delight = 5;
    if (feature.includes('ai') || feature.includes('smart')) delight = 8;
    if (feature.includes('animation') || feature.includes('transition')) delight = 7;

    // Feasibility (0-10)
    let feasibility = 7;
    if (feature.includes('ai') || feature.includes('ml')) feasibility = 5;
    if (feature.includes('integration')) feasibility = 6;
    if (feature.includes('export') || feature.includes('report')) feasibility = 8;

    // Viability (0-10)
    let viability = 6;
    if (audience === 'enterprise') viability = 8;
    if (feature.includes('payment') || feature.includes('billing')) viability = 9;

    const overall = Math.round((problem + usability + delight + feasibility + viability) / 5);

    return {
      problem,
      usability,
      delight,
      feasibility,
      viability,
      overall
    };
  }

  private getBatRecommendation(total: number): 'BUILD' | 'CONSIDER' | "DON'T BUILD" {
    if (total >= 10) return 'BUILD';
    if (total >= 8) return 'CONSIDER';
    return "DON'T BUILD";
  }

  private getTenStarRating(overall: number): string {
    if (overall >= 10) return '10★ - Category Transformer';
    if (overall >= 9) return '9★ - Exceptional';
    if (overall >= 8) return '8★ - Excellent';
    if (overall >= 7) return '7★ - Great';
    if (overall >= 6) return '6★ - Good';
    if (overall >= 5) return '5★ - Meets Expectations';
    if (overall >= 4) return '4★ - Acceptable';
    if (overall >= 3) return '3★ - Below Average';
    if (overall >= 2) return '2★ - Poor';
    return '1★ - Unacceptable';
  }

  private analyzeBuildVsBuy(options: CeoReviewOptions): BuildVsBuyAnalysis {
    const feature = options.featureName.toLowerCase();
    
    // Determine recommendation based on feature type
    let recommendation: 'build' | 'buy' | 'hybrid' = 'build';
    
    if (feature.includes('auth') || feature.includes('payment') || feature.includes('analytics')) {
      recommendation = 'buy';
    } else if (feature.includes('ai') || feature.includes('ml')) {
      recommendation = 'hybrid';
    } else if (feature.includes('core') || feature.includes('brand')) {
      recommendation = 'build';
    }

    return {
      recommendation,
      build: {
        cost: 'High initial, low ongoing',
        time: '3-6 months',
        pros: [
          'Full control and customization',
          'No vendor lock-in',
          'Builds internal expertise',
          'Differentiating factor'
        ],
        cons: [
          'Longer time to market',
          'Higher upfront cost',
          'Maintenance burden',
          'Risk of technical debt'
        ]
      },
      buy: {
        cost: 'Low initial, ongoing subscription',
        time: '1-4 weeks',
        pros: [
          'Fast time to market',
          'Lower initial investment',
          'Expert support included',
          'Regular updates'
        ],
        cons: [
          'Limited customization',
          'Vendor dependency',
          'Ongoing costs',
          'Less differentiation'
        ]
      },
      analysis: recommendation === 'buy' 
        ? 'This is a commodity feature. Buying lets you focus on core differentiators.'
        : recommendation === 'hybrid'
        ? 'Consider buying the foundation and building customizations on top.'
        : 'This is core to your value proposition. Building creates competitive advantage.'
    };
  }

  private generateNextSteps(
    options: CeoReviewOptions,
    recommendation: string,
    tenStar: TenStarScore
  ): string[] {
    const steps: string[] = [];

    if (recommendation === 'BUILD') {
      steps.push('1. Create detailed product requirements document');
      steps.push('2. Conduct user research to validate assumptions');
      steps.push('3. Build prototype for usability testing');
      steps.push('4. Define success metrics and KPIs');
    } else if (recommendation === 'CONSIDER') {
      steps.push('1. Refine the feature concept with user interviews');
      steps.push('2. Re-evaluate BAT scores after research');
      steps.push('3. Consider starting with an MVP approach');
    } else {
      steps.push('1. Reconsider the problem being solved');
      steps.push('2. Research alternative solutions');
      steps.push('3. Defer until higher-priority items are complete');
    }

    if (tenStar.feasibility < 7) {
      steps.push('4. Conduct technical feasibility spike');
    }

    if (tenStar.viability < 6) {
      steps.push('5. Validate business model and pricing strategy');
    }

    return steps;
  }

  private estimateTimeline(options: CeoReviewOptions, tenStar: TenStarScore): string {
    const baseWeeks = 8;
    const complexityFactor = (10 - tenStar.feasibility) / 2;
    const totalWeeks = Math.round(baseWeeks + complexityFactor);
    
    if (totalWeeks <= 4) return '2-4 weeks (Quick win)';
    if (totalWeeks <= 8) return '1-2 months (Standard feature)';
    if (totalWeeks <= 16) return '3-4 months (Major feature)';
    return '5+ months (Complex initiative)';
  }

  private estimateResources(options: CeoReviewOptions, tenStar: TenStarScore): string {
    const baseTeam = tenStar.feasibility >= 7 ? '1-2 engineers' : '2-4 engineers';
    const needsDesign = tenStar.usability >= 7 ? ' + Product Designer' : '';
    const needsPM = tenStar.viability < 7 ? ' + Product Manager' : '';
    
    return baseTeam + needsDesign + needsPM;
  }

  formatResult(result: CeoReviewResult, format: OutputFormat = 'detailed'): string {
    const lines: string[] = [];

    lines.push(`═══ CEO Review: ${result.featureName} ═══`);
    lines.push('');

    // BAT Score
    lines.push('BAT FRAMEWORK SCORE');
    lines.push(`  Brand:     ${this.renderBar(result.batScore.brand, 5)} ${result.batScore.brand}/5`);
    lines.push(`  Attention: ${this.renderBar(result.batScore.attention, 5)} ${result.batScore.attention}/5`);
    lines.push(`  Trust:     ${this.renderBar(result.batScore.trust, 5)} ${result.batScore.trust}/5`);
    lines.push(`  TOTAL:     ${result.batScore.total}/15`);
    lines.push('');

    // Recommendation
    const recColor = result.batRecommendation === 'BUILD' ? '\x1b[32m' : 
                     result.batRecommendation === 'CONSIDER' ? '\x1b[33m' : '\x1b[31m';
    lines.push(`RECOMMENDATION: ${recColor}${result.batRecommendation}\x1b[0m`);
    lines.push('');

    // 10-Star Score
    lines.push('10-STAR METHODOLOGY');
    lines.push(`  Problem:     ${this.renderBar(result.tenStarScore.problem, 10)} ${result.tenStarScore.problem}/10`);
    lines.push(`  Usability:   ${this.renderBar(result.tenStarScore.usability, 10)} ${result.tenStarScore.usability}/10`);
    lines.push(`  Delight:     ${this.renderBar(result.tenStarScore.delight, 10)} ${result.tenStarScore.delight}/10`);
    lines.push(`  Feasibility: ${this.renderBar(result.tenStarScore.feasibility, 10)} ${result.tenStarScore.feasibility}/10`);
    lines.push(`  Viability:   ${this.renderBar(result.tenStarScore.viability, 10)} ${result.tenStarScore.viability}/10`);
    lines.push(`  OVERALL:     ${result.tenStarRating}`);
    lines.push('');

    if (format === 'detailed') {
      // Build vs Buy
      if (result.buildVsBuy) {
        lines.push('BUILD VS BUY ANALYSIS');
        lines.push(`  Recommendation: ${result.buildVsBuy.recommendation.toUpperCase()}`);
        lines.push('');
        lines.push('  BUILD:');
        lines.push(`    Cost: ${result.buildVsBuy.build.cost}`);
        lines.push(`    Time: ${result.buildVsBuy.build.time}`);
        lines.push('');
        lines.push('  BUY:');
        lines.push(`    Cost: ${result.buildVsBuy.buy.cost}`);
        lines.push(`    Time: ${result.buildVsBuy.buy.time}`);
        lines.push('');
        lines.push(`  Analysis: ${result.buildVsBuy.analysis}`);
        lines.push('');
      }

      // Next Steps
      lines.push('NEXT STEPS');
      for (const step of result.nextSteps) {
        lines.push(`  ${step}`);
      }
      lines.push('');

      // Estimates
      lines.push('ESTIMATES');
      lines.push(`  Timeline: ${result.timelineEstimate}`);
      lines.push(`  Team:     ${result.resourceEstimate}`);
    }

    return lines.join('\n');
  }

  private renderBar(value: number, max: number): string {
    const filled = Math.round((value / max) * 10);
    const empty = 10 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return bar;
  }
}

// Export convenience function
export async function review(options: CeoReviewOptions): Promise<CeoReviewResult> {
  const skill = new PlanCeoReviewSkill();
  return skill.review(options);
}