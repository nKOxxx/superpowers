import { ReviewOptions, ReviewResult, BATScore, TenStarScore, ComparisonResult, BuildVsBuyResult } from './cli';

export class ReviewController {
  async review(feature: string, options: ReviewOptions): Promise<ReviewResult> {
    // Calculate BAT scores based on feature characteristics
    const batScore = this.calculateBATScore(feature, options);
    
    // Calculate 10-star rating
    const tenStar = this.calculateTenStar(feature, options);
    
    // Generate recommendation
    const totalBAT = batScore.brand + batScore.attention + batScore.trust;
    const recommendation = this.getRecommendation(totalBAT);
    
    // Generate next steps
    const nextSteps = this.generateNextSteps(feature, batScore, tenStar, options);
    
    const result: ReviewResult = {
      feature,
      batScore,
      tenStar,
      recommendation,
      nextSteps
    };

    // Handle comparison if requested
    if (options.compare) {
      result.comparison = await this.compareFeatures(feature, options.compare, options);
    }

    // Handle build vs buy analysis
    if (options.buildVsBuy) {
      result.buildVsBuy = this.analyzeBuildVsBuy(feature, options);
    }

    return result;
  }

  private calculateBATScore(feature: string, options: ReviewOptions): BATScore {
    // Default scoring based on keyword analysis
    const featureLower = feature.toLowerCase();
    
    // Brand dimension (0-5)
    // Does this strengthen our brand?
    let brand = 3; // baseline
    const brandBoosters = ['brand', 'identity', 'unique', 'signature', 'premium', 'exclusive'];
    const brandKillers = ['commodity', 'generic', 'standard', 'basic'];
    
    brandBoosters.forEach(word => {
      if (featureLower.includes(word)) brand += 0.5;
    });
    brandKillers.forEach(word => {
      if (featureLower.includes(word)) brand -= 0.5;
    });
    
    // Attention dimension (0-5)
    // Will users actually use this?
    let attention = 3; // baseline
    const attentionBoosters = ['search', 'notifications', 'messaging', 'ai', 'automation', 'analytics'];
    const attentionKillers = ['admin', 'config', 'settings', 'maintenance'];
    
    attentionBoosters.forEach(word => {
      if (featureLower.includes(word)) attention += 0.5;
    });
    attentionKillers.forEach(word => {
      if (featureLower.includes(word)) attention -= 0.5;
    });
    
    // Adjust based on audience
    if (options.audience === 'enterprise') {
      attention += 0.5; // Enterprise users are more engaged
    }
    
    // Trust dimension (0-5)
    // Does this build user trust?
    let trust = 3; // baseline
    const trustBoosters = ['security', 'privacy', 'verification', 'backup', 'encryption', 'compliance'];
    const trustKillers = ['tracking', 'ads', 'third-party', 'data-sharing'];
    
    trustBoosters.forEach(word => {
      if (featureLower.includes(word)) trust += 0.5;
    });
    trustKillers.forEach(word => {
      if (featureLower.includes(word)) trust -= 0.5;
    });
    
    // Clamp scores to valid range
    return {
      brand: Math.min(5, Math.max(0, Math.round(brand))),
      attention: Math.min(5, Math.max(0, Math.round(attention))),
      trust: Math.min(5, Math.max(0, Math.round(trust)))
    };
  }

  private calculateTenStar(feature: string, options: ReviewOptions): TenStarScore {
    const featureLower = feature.toLowerCase();
    
    // Problem fit (how well does it solve a real problem?)
    let problem = 5;
    const problemWords = ['pain', 'frustrating', 'slow', 'difficult', 'manual', 'repetitive'];
    problemWords.forEach(word => {
      if (featureLower.includes(word)) problem += 0.5;
    });
    
    // Usability (how easy to use?)
    let usability = 6;
    if (featureLower.includes('ai') || featureLower.includes('auto')) usability += 1;
    if (featureLower.includes('complex') || featureLower.includes('advanced')) usability -= 1;
    
    // Delight (moments of joy)
    let delight = 4;
    const delightWords = ['magic', 'wow', 'instant', 'beautiful', 'smooth', 'effortless'];
    delightWords.forEach(word => {
      if (featureLower.includes(word)) delight += 0.5;
    });
    
    // Feasibility (can we build this well?)
    let feasibility = 7;
    if (featureLower.includes('ai') || featureLower.includes('ml')) feasibility -= 1;
    if (featureLower.includes('integration') || featureLower.includes('api')) feasibility -= 0.5;
    
    // Viability (sustainable business model)
    let viability = 6;
    if (options.market === 'saas') viability += 1;
    if (featureLower.includes('enterprise')) viability += 1;
    
    return {
      problem: Math.min(10, Math.max(1, Math.round(problem))),
      usability: Math.min(10, Math.max(1, Math.round(usability))),
      delight: Math.min(10, Math.max(1, Math.round(delight))),
      feasibility: Math.min(10, Math.max(1, Math.round(feasibility))),
      viability: Math.min(10, Math.max(1, Math.round(viability)))
    };
  }

  private getRecommendation(totalBAT: number): string {
    if (totalBAT >= 12) return 'BUILD - Strong signal, prioritize';
    if (totalBAT >= 10) return 'BUILD - Good signal, proceed';
    if (totalBAT >= 8) return 'CONSIDER - Mixed, needs refinement';
    return "DON'T BUILD - Weak signal, reconsider";
  }

  private generateNextSteps(
    feature: string, 
    batScore: BATScore, 
    tenStar: TenStarScore, 
    options: ReviewOptions
  ): string[] {
    const steps: string[] = [];
    const totalBAT = batScore.brand + batScore.attention + batScore.trust;
    const avgStars = (tenStar.problem + tenStar.usability + tenStar.delight + tenStar.feasibility + tenStar.viability) / 5;
    
    if (totalBAT >= 12) {
      steps.push('Create detailed product spec and designs');
      steps.push('Schedule engineering scoping session');
      steps.push('Define success metrics and KPIs');
      steps.push('Set target launch date');
    } else if (totalBAT >= 10) {
      steps.push('Conduct user research to validate assumptions');
      steps.push('Create prototype or MVP plan');
      steps.push('Estimate engineering effort');
      steps.push('Define go-to-market strategy');
    } else if (totalBAT >= 8) {
      steps.push('Run user interviews to better understand the problem');
      steps.push('Analyze competitive solutions');
      steps.push('Identify ways to increase BAT scores');
      steps.push('Consider deprioritizing if scores don\'t improve');
    } else {
      steps.push('Reconsider if this feature aligns with strategy');
      steps.push('Identify root cause of low scores');
      steps.push('Explore alternative approaches');
      steps.push('Document decision rationale for future reference');
    }
    
    if (avgStars < 5) {
      steps.push('⚠️ Focus on improving user experience before building');
    }
    
    if (tenStar.feasibility < 5) {
      steps.push('⚠️ Consider phased approach or MVP to reduce complexity');
    }
    
    return steps;
  }

  async compareFeatures(feature1: string, feature2: string, options: ReviewOptions): Promise<ComparisonResult> {
    const review1 = await this.review(feature1, { ...options, compare: undefined, buildVsBuy: false });
    const review2 = await this.review(feature2, { ...options, compare: undefined, buildVsBuy: false });
    
    const score1 = review1.batScore.brand + review1.batScore.attention + review1.batScore.trust;
    const score2 = review2.batScore.brand + review2.batScore.attention + review2.batScore.trust;
    
    const avgStars1 = (review1.tenStar.problem + review1.tenStar.usability + review1.tenStar.delight + review1.tenStar.feasibility + review1.tenStar.viability) / 5;
    const avgStars2 = (review2.tenStar.problem + review2.tenStar.usability + review2.tenStar.delight + review2.tenStar.feasibility + review2.tenStar.viability) / 5;
    
    const combined1 = score1 + (avgStars1 / 2);
    const combined2 = score2 + (avgStars2 / 2);
    
    let winner: string;
    let rationale: string;
    
    if (combined1 > combined2 + 2) {
      winner = feature1;
      rationale = `Stronger BAT score (${score1} vs ${score2}) and better user experience`;
    } else if (combined2 > combined1 + 2) {
      winner = feature2;
      rationale = `Stronger BAT score (${score2} vs ${score1}) and better user experience`;
    } else {
      winner = 'TIE';
      rationale = 'Both features score similarly. Consider user research to break the tie.';
    }
    
    return {
      winner,
      rationale,
      scores: {
        feature1: combined1,
        feature2: combined2
      }
    };
  }

  private analyzeBuildVsBuy(feature: string, options: ReviewOptions): BuildVsBuyResult {
    const featureLower = feature.toLowerCase();
    
    // Estimate costs
    let buildCost = 150000; // Base 3-year build cost
    let buyCost = 50000; // Base 3-year buy cost
    
    // Adjust based on complexity
    if (featureLower.includes('ai') || featureLower.includes('ml')) {
      buildCost += 200000;
      buyCost += 30000;
    }
    
    if (featureLower.includes('integration') || featureLower.includes('api')) {
      buildCost += 50000;
    }
    
    // Estimate timelines
    let buildTime = 3; // months
    let buyTime = 1; // months
    
    if (featureLower.includes('platform') || featureLower.includes('infrastructure')) {
      buildTime += 6;
    }
    
    if (featureLower.includes('complex') || featureLower.includes('advanced')) {
      buildTime += 3;
    }
    
    // Determine strategic value
    let strategicValue: string | undefined;
    const isCore = featureLower.includes('core') || featureLower.includes('differentiator');
    const isCommodity = featureLower.includes('auth') || featureLower.includes('billing') || featureLower.includes('analytics');
    
    if (isCore) {
      strategicValue = 'Core differentiator - building strengthens competitive moat';
    } else if (isCommodity) {
      strategicValue = 'Commodity feature - buying frees resources for differentiation';
    }
    
    // Make recommendation
    let recommendation: 'BUILD' | 'BUY' | 'HYBRID';
    
    if (isCore && buildCost < buyCost * 3) {
      recommendation = 'BUILD';
    } else if (isCommodity) {
      recommendation = 'BUY';
    } else if (buildTime > 6 && buyTime < 2) {
      recommendation = 'BUY';
    } else if (buildCost < buyCost) {
      recommendation = 'BUILD';
    } else {
      recommendation = 'HYBRID'; // Build core, buy integrations
    }
    
    return {
      recommendation,
      buildCost,
      buyCost,
      buildTime,
      buyTime,
      strategicValue
    };
  }
}
