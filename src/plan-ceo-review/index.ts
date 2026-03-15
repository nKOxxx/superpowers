/**
 * Plan CEO Review Skill - BAT Framework for Product Strategy
 * 
 * Usage: /plan-ceo-review "<product description>" [--brand=X] [--attention=X] [--trust=X]
 * 
 * BAT Framework: Brand, Attention, Trust (0-5 each, 10+ to build)
 */

import { CEORReviewInput, CEORReviewResult, BATScore, SkillResult } from '../types.js';
import { success, failure } from '../utils.js';

export class CEOReviewSkill {
  execute(input: CEORReviewInput, scores?: BATScore): SkillResult {
    try {
      // Calculate or use provided scores
      const finalScores: BATScore = scores || this.calculateScores(input);
      const totalScore = finalScores.brand + finalScores.attention + finalScores.trust;

      // Determine recommendation
      const { recommendation, reasoning } = this.getRecommendation(totalScore, finalScores);

      // Generate next steps
      const nextSteps = this.generateNextSteps(finalScores, recommendation, input);

      const result: CEORReviewResult = {
        scores: finalScores,
        totalScore,
        recommendation,
        reasoning,
        nextSteps
      };

      const message = this.formatResult(input.productName, result);
      return success(message, result);
    } catch (error) {
      return failure(`CEO Review failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private calculateScores(input: CEORReviewInput): BATScore {
    // Auto-calculate based on input analysis
    const scores: BATScore = { brand: 0, attention: 0, trust: 0 };

    // Brand scoring (0-5)
    if (input.differentiator.length > 20) scores.brand += 2;
    if (input.description.toLowerCase().includes('unique')) scores.brand += 1;
    if (input.differentiator.toLowerCase().includes('only') || 
        input.differentiator.toLowerCase().includes('first')) scores.brand += 1;
    if (input.targetMarket.length > 10) scores.brand += 1;

    // Attention scoring (0-5)
    if (input.targetMarket.length > 5) scores.attention += 2;
    if (input.description.toLowerCase().includes('problem') ||
        input.description.toLowerCase().includes('pain')) scores.attention += 1;
    if (input.description.toLowerCase().includes('market') ||
        input.description.toLowerCase().includes('demand')) scores.attention += 1;
    if (!input.risks || input.risks.length < 3) scores.attention += 1;

    // Trust scoring (0-5)
    const riskCount = input.risks?.length || 0;
    scores.trust = Math.max(0, 5 - riskCount);
    if (input.description.length > 100) scores.trust += 0.5;
    scores.trust = Math.min(5, scores.trust);

    return scores;
  }

  private getRecommendation(
    totalScore: number, 
    scores: BATScore
  ): { recommendation: CEORReviewResult['recommendation']; reasoning: string } {
    if (totalScore >= 10) {
      return {
        recommendation: 'build',
        reasoning: `Strong BAT score (${totalScore}/15). ${this.getStrengthArea(scores)} scores well. Clear path to market with manageable risks.`
      };
    } else if (totalScore >= 7) {
      return {
        recommendation: 'consider',
        reasoning: `Moderate BAT score (${totalScore}/15). ${this.getWeaknessArea(scores)} needs strengthening before committing resources.`
      };
    } else {
      return {
        recommendation: 'dont-build',
        reasoning: `Low BAT score (${totalScore}/15). ${this.getWeaknessArea(scores)} is concerning. Reconsider approach or pivot.`
      };
    }
  }

  private getStrengthArea(scores: BATScore): string {
    const max = Math.max(scores.brand, scores.attention, scores.trust);
    if (scores.brand === max) return 'Brand alignment';
    if (scores.attention === max) return 'Market attention';
    return 'Trust factor';
  }

  private getWeaknessArea(scores: BATScore): string {
    const min = Math.min(scores.brand, scores.attention, scores.trust);
    if (scores.brand === min) return 'Brand fit';
    if (scores.attention === min) return 'Attention/demand';
    return 'Trust/delivery risk';
  }

  private generateNextSteps(scores: BATScore, recommendation: string, _input: CEORReviewInput): string[] {
    const steps: string[] = [];

    if (recommendation === 'build') {
      steps.push('✅ Proceed with detailed product spec');
      steps.push('📊 Create 6-week roadmap with milestones');
      steps.push('💰 Prepare budget and resource allocation');
    } else if (recommendation === 'consider') {
      if (scores.brand < 3) {
        steps.push('🔍 Conduct brand alignment workshop');
        steps.push('📝 Refine positioning statement');
      }
      if (scores.attention < 3) {
        steps.push('📈 Validate market demand with 10 customer interviews');
        steps.push('🎯 Define clear value proposition');
      }
      if (scores.trust < 3) {
        steps.push('⚠️  Risk mitigation plan for: ' + (_input.risks?.join(', ') || 'unknown risks'));
        steps.push('👥 Identify required expertise/partners');
      }
      steps.push('⏰ Re-evaluate in 2 weeks');
    } else {
      steps.push('❌ Pause development - revisit fundamentals');
      steps.push('🔄 Consider pivot or different approach');
      if (scores.brand < 2) steps.push('🚫 Does not align with brand - outsource or drop');
      if (scores.attention < 2) steps.push('📉 Market timing issue - wait or abandon');
      if (scores.trust < 2) steps.push('⚡ Too risky - build capabilities first');
    }

    return steps;
  }

  private formatResult(productName: string, result: CEORReviewResult): string {
    const { scores, totalScore, recommendation, reasoning, nextSteps } = result;
    
    const stars = '★'.repeat(Math.round(totalScore / 3)) + '☆'.repeat(5 - Math.round(totalScore / 3));
    const recEmoji = recommendation === 'build' ? '✅' : recommendation === 'consider' ? '⚠️' : '❌';
    const recText = recommendation === 'build' ? 'BUILD' : recommendation === 'consider' ? 'CONSIDER' : "DON'T BUILD";

    return [
      `📊 CEO Review: ${productName}`,
      ``,
      `BAT Score: ${totalScore}/15 ${stars}`,
      `  • Brand:     ${scores.brand}/5 ${this.scoreBar(scores.brand)}`,
      `  • Attention: ${scores.attention}/5 ${this.scoreBar(scores.attention)}`,
      `  • Trust:     ${scores.trust}/5 ${this.scoreBar(scores.trust)}`,
      ``,
      `${recEmoji} Recommendation: ${recText}`,
      ``,
      `📝 Reasoning:`,
      `  ${reasoning}`,
      ``,
      `🚀 Next Steps:`,
      ...nextSteps.map(s => `  ${s}`)
    ].join('\n');
  }

  private scoreBar(score: number): string {
    const filled = '█'.repeat(score);
    const empty = '░'.repeat(5 - score);
    return `[${filled}${empty}]`;
  }
}

// CLI entry point
export async function run(args: string[]): Promise<SkillResult> {
  const { input, scores } = parseCEOArgs(args);
  
  if (!input.productName) {
    return failure('Product name/description required. Usage: /plan-ceo-review "Product Name: Description"');
  }

  const skill = new CEOReviewSkill();
  return skill.execute(input, scores);
}

function parseCEOArgs(args: string[]): { input: CEORReviewInput; scores?: BATScore } {
  const input: CEORReviewInput = {
    productName: '',
    description: '',
    targetMarket: '',
    differentiator: ''
  };
  
  const scores: Partial<BATScore> = {};

  // First non-flag argument is the product description
  let descriptionArg = '';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (!arg.startsWith('--') && !descriptionArg) {
      descriptionArg = arg;
      // Parse description format: "Name: Description" or just "Description"
      if (descriptionArg.includes(':')) {
        const [name, ...descParts] = descriptionArg.split(':');
        input.productName = name.trim();
        input.description = descParts.join(':').trim();
      } else {
        input.productName = descriptionArg.slice(0, 30);
        input.description = descriptionArg;
      }
    } else if (arg === '--brand' || arg.startsWith('--brand=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : args[++i];
      scores.brand = Math.min(5, Math.max(0, parseInt(value, 10) || 0));
    } else if (arg === '--attention' || arg.startsWith('--attention=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : args[++i];
      scores.attention = Math.min(5, Math.max(0, parseInt(value, 10) || 0));
    } else if (arg === '--trust' || arg.startsWith('--trust=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : args[++i];
      scores.trust = Math.min(5, Math.max(0, parseInt(value, 10) || 0));
    } else if (arg === '--market') {
      input.targetMarket = args[++i] || '';
    } else if (arg === '--differentiator') {
      input.differentiator = args[++i] || '';
    }
  }

  return { 
    input, 
    scores: Object.keys(scores).length === 3 ? scores as BATScore : undefined 
  };
}
