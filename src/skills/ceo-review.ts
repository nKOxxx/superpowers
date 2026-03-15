import { CEORReviewOptions, CEORReviewResult, BATScore } from '../types/index.js';
import { Logger, loadConfig } from '../utils/index.js';

export class CEOReviewSkill {
  private logger: Logger;
  private config: any;

  constructor(verbose = false) {
    this.logger = new Logger(verbose);
    this.config = loadConfig();
  }

  async run(options: CEORReviewOptions): Promise<CEORReviewResult> {
    this.logger.header(options.feature);

    // Calculate BAT scores
    const scores = this.calculateScores(options);
    const total = scores.brand + scores.attention + scores.trust;

    // Determine recommendation
    const recommendation = this.getRecommendation(total);

    // Generate rationale
    const rationale = this.generateRationale(scores, options);

    // Generate next steps
    const nextSteps = this.generateNextSteps(recommendation, options);

    const result: CEORReviewResult = {
      feature: options.feature,
      scores,
      total,
      recommendation,
      rationale,
      nextSteps
    };

    this.printResult(result);

    return result;
  }

  private calculateScores(options: CEORReviewOptions): BATScore {
    // Use provided scores or auto-calculate
    return {
      brand: options.brandScore ?? this.assessBrand(options),
      attention: options.attentionScore ?? this.assessAttention(options),
      trust: options.trustScore ?? this.assessTrust(options)
    };
  }

  private assessBrand(options: CEORReviewOptions): number {
    const feature = options.feature.toLowerCase();
    
    // High brand impact indicators
    if (feature.includes('ai') || feature.includes('ml')) return 5;
    if (feature.includes('security') || feature.includes('privacy')) return 4;
    if (feature.includes('analytics') || feature.includes('insights')) return 4;
    if (feature.includes('automation') || feature.includes('auto')) return 4;
    if (feature.includes('premium') || feature.includes('pro')) return 3;
    
    // Default assessment based on goal
    if (options.goal) {
      const goal = options.goal.toLowerCase();
      if (goal.includes('differentiate') || goal.includes('innovation')) return 4;
      if (goal.includes('revenue') || goal.includes('growth')) return 4;
      if (goal.includes('reduce') || goal.includes('improve')) return 3;
    }

    return 3; // Default: good fit, incremental
  }

  private assessAttention(options: CEORReviewOptions): number {
    // High attention indicators
    const feature = options.feature.toLowerCase();
    
    if (feature.includes('mobile') || feature.includes('app')) return 5;
    if (feature.includes('notification') || feature.includes('alert')) return 5;
    if (feature.includes('dashboard') || feature.includes('home')) return 5;
    if (feature.includes('login') || feature.includes('auth')) return 5;
    
    // Audience-based assessment
    if (options.audience) {
      const aud = options.audience.toLowerCase();
      if (aud.includes('daily') || aud.includes('all users')) return 5;
      if (aud.includes('weekly') || aud.includes('power users')) return 4;
      if (aud.includes('monthly') || aud.includes('occasional')) return 3;
    }

    return 3; // Default: monthly use, nice-to-have
  }

  private assessTrust(options: CEORReviewOptions): number {
    const feature = options.feature.toLowerCase();
    
    // High trust impact indicators
    if (feature.includes('security') || feature.includes('2fa')) return 5;
    if (feature.includes('backup') || feature.includes('export')) return 4;
    if (feature.includes('privacy') || feature.includes('gdpr')) return 5;
    if (feature.includes('audit') || feature.includes('log')) return 4;
    if (feature.includes('encryption') || feature.includes('ssl')) return 5;
    
    // Trust assets provided
    if (options.trust) {
      return 4; // User has trust assets
    }

    return 3; // Default: transparency, user control
  }

  private getRecommendation(total: number): CEORReviewResult['recommendation'] {
    const minimumScore = this.config?.ceoReview?.minimumScore || 10;
    
    if (total >= 12) return 'BUILD';
    if (total >= 10) return 'BUILD';
    if (total >= 8) return 'CONSIDER';
    return 'DONT_BUILD';
  }

  private generateRationale(scores: BATScore, options: CEORReviewOptions): string[] {
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
      rationale.push('Limited usage frequency expected');
    }

    // Trust rationale
    if (scores.trust >= 4) {
      rationale.push('Critical for user trust and retention');
    }

    // Competition-based rationale
    if (options.competition) {
      rationale.push(`Competitive landscape: ${options.competition}`);
    }

    // Goal-based rationale
    if (options.goal) {
      if (options.goal.includes('revenue')) {
        rationale.push('Direct revenue impact should be modeled');
      }
      if (options.goal.includes('retention')) {
        rationale.push('User retention play - measure churn impact');
      }
    }

    return rationale.length > 0 ? rationale : ['Standard feature evaluation'];
  }

  private generateNextSteps(recommendation: CEORReviewResult['recommendation'], options: CEORReviewOptions): string[] {
    const steps: string[] = [];

    if (recommendation === 'BUILD') {
      steps.push('Define success metrics (DAU, engagement time)');
      steps.push('Coordinate with marketing for launch narrative');
      steps.push('Set 30-day post-launch review date');
    } else if (recommendation === 'CONSIDER') {
      steps.push('Gather more user feedback on priority');
      steps.push('Model revenue/cost impact');
      steps.push('Revisit in 2-4 weeks with additional data');
    } else {
      steps.push('Deprioritize - focus on higher BAT score features');
      steps.push('Document rationale for future reference');
    }

    if (options.goal) {
      steps.push(`Validate goal alignment: "${options.goal}"`);
    }

    return steps;
  }

  private printResult(result: CEORReviewResult): void {
    const star = '⭐';
    const empty = '○';
    
    const renderStars = (score: number) => 
      star.repeat(score) + empty.repeat(5 - score);

    console.log(`\nBrand:     ${renderStars(result.scores.brand)} (${result.scores.brand}/5)`);
    console.log(`Attention: ${renderStars(result.scores.attention)} (${result.scores.attention}/5)`);
    console.log(`Trust:     ${renderStars(result.scores.trust)} (${result.scores.trust}/5)`);
    
    console.log(`\nTotal: ${result.total}/15 ${star}`);
    
    const icon = result.recommendation === 'BUILD' ? '✅' : 
                 result.recommendation === 'CONSIDER' ? '⚠️' : '❌';
    console.log(`\nRecommendation: ${result.recommendation} ${icon}`);
    
    console.log('\nRationale:');
    result.rationale.forEach((r: string) => console.log(`  • ${r}`));
    
    console.log('\nNext Steps:');
    result.nextSteps.forEach((s: string, i: number) => console.log(`  ${i + 1}. ${s}`));
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * Render result as Telegram-compatible text
   */
  static formatForTelegram(result: CEORReviewResult): string {
    const star = '⭐';
    const empty = '◯';
    
    const renderStars = (score: number) => 
      star.repeat(score) + empty.repeat(5 - score);

    const icon = result.recommendation === 'BUILD' ? '✅' : 
                 result.recommendation === 'CONSIDER' ? '⚠️' : '❌';

    let text = `*${result.feature}*\n\n`;
    text += `Brand: ${renderStars(result.scores.brand)}\n`;
    text += `Attention: ${renderStars(result.scores.attention)}\n`;
    text += `Trust: ${renderStars(result.scores.trust)}\n\n`;
    text += `*Total: ${result.total}/15 ${star}*\n\n`;
    text += `*Recommendation: ${result.recommendation}* ${icon}\n\n`;
    text += '*Next Steps:*\n';
    result.nextSteps.forEach((s: string, i: number) => {
      text += `${i + 1}. ${s}\n`;
    });

    return text;
  }
}
