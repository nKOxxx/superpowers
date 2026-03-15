import { 
  CeoReviewOptions, 
  CeoReviewResult, 
  BatScores, 
  Score, 
  Recommendation,
  BAT_CRITERIA,
  THRESHOLDS,
  RECOMMENDATION_LABELS
} from './types.js';

export * from './types.js';

function validateScore(score: number): Score {
  if (score < 0) return 0;
  if (score > 5) return 5;
  return Math.round(score) as Score;
}

function getRecommendation(totalScore: number): Recommendation {
  if (totalScore >= THRESHOLDS.build) return 'build';
  if (totalScore >= THRESHOLDS.consider) return 'consider';
  return 'dont-build';
}

function generateReasoning(feature: string, scores: BatScores, recommendation: Recommendation): string {
  const parts: string[] = [];
  
  // Brand analysis
  if (scores.brand >= 4) {
    parts.push('Strong brand alignment - this feature reinforces our identity.');
  } else if (scores.brand <= 2) {
    parts.push('Weak brand fit - may confuse our market positioning.');
  }
  
  // Attention analysis
  if (scores.attention >= 4) {
    parts.push('High attention potential - users will notice and engage.');
  } else if (scores.attention <= 2) {
    parts.push('Low attention value - may not capture user interest.');
  }
  
  // Trust analysis
  if (scores.trust >= 4) {
    parts.push('Builds trust - delivers reliable, quality experience.');
  } else if (scores.trust <= 2) {
    parts.push('Trust concerns - may raise reliability or feasibility questions.');
  }
  
  if (parts.length === 0) {
    parts.push('Mixed signals across all dimensions.');
  }
  
  return parts.join(' ');
}

function generateNextSteps(recommendation: Recommendation, feature: string): string[] {
  switch (recommendation) {
    case 'build':
      return [
        'Prioritize in next sprint/quarter',
        'Assign dedicated team/resources',
        'Define MVP scope and success metrics',
        'Create detailed product requirements',
        'Schedule design sprint if needed'
      ];
    case 'consider':
      return [
        'Conduct user research to validate assumptions',
        'Build a prototype or proof of concept',
        'Analyze competitive landscape more deeply',
        'Gather more data on technical feasibility',
        'Revisit scoring after additional insights'
      ];
    case 'dont-build':
      return [
        'Document decision and reasoning',
        'Identify what would improve the scores',
        'Consider if smaller scoped version works',
        'Monitor market/competitor for changes',
        'Revisit in 3-6 months if context changes'
      ];
  }
}

function autoCalculateScores(feature: string, context?: string): BatScores {
  // This is a simple heuristic-based auto-scoring
  // In a real implementation, this could use an LLM for more sophisticated analysis
  const feature_lower = feature.toLowerCase();
  const context_lower = (context || '').toLowerCase();
  
  const scores: BatScores = {
    brand: 3 as Score,
    attention: 3 as Score,
    trust: 3 as Score
  };
  
  // Brand indicators
  const brandKeywords = ['brand', 'identity', 'premium', 'exclusive', 'signature'];
  const brandBoost = brandKeywords.some(k => feature_lower.includes(k) || context_lower.includes(k));
  if (brandBoost) scores.brand = Math.min(5, scores.brand + 1) as Score;
  
  // Attention indicators
  const attentionKeywords = ['viral', 'share', 'notify', 'ai', 'smart', 'automatic'];
  const attentionBoost = attentionKeywords.some(k => feature_lower.includes(k) || context_lower.includes(k));
  if (attentionBoost) scores.attention = Math.min(5, scores.attention + 1) as Score;
  
  // Trust indicators
  const trustKeywords = ['secure', 'verified', 'backup', 'sync', 'export'];
  const trustBoost = trustKeywords.some(k => feature_lower.includes(k) || context_lower.includes(k));
  if (trustBoost) scores.trust = Math.min(5, scores.trust + 1) as Score;
  
  // Negative indicators
  const negativeKeywords = ['experimental', 'beta', 'maybe', 'unclear'];
  const hasNegative = negativeKeywords.some(k => feature_lower.includes(k) || context_lower.includes(k));
  if (hasNegative) {
    scores.trust = Math.max(0, scores.trust - 1) as Score;
  }
  
  return scores;
}

export function review(options: CeoReviewOptions): CeoReviewResult {
  let scores: BatScores;
  
  if (options.autoScore) {
    scores = autoCalculateScores(options.feature, options.context);
  } else if (options.scores) {
    scores = {
      brand: validateScore(options.scores.brand),
      attention: validateScore(options.scores.attention),
      trust: validateScore(options.scores.trust)
    };
  } else {
    throw new Error('Either scores or autoScore must be provided');
  }
  
  const totalScore = scores.brand + scores.attention + scores.trust;
  const maxScore = 15;
  const percentage = Math.round((totalScore / maxScore) * 100);
  const recommendation = getRecommendation(totalScore);
  
  return {
    feature: options.feature,
    scores,
    totalScore,
    maxScore,
    percentage,
    recommendation,
    reasoning: generateReasoning(options.feature, scores, recommendation),
    nextSteps: generateNextSteps(recommendation, options.feature),
    thresholds: THRESHOLDS
  };
}

export function formatReview(result: CeoReviewResult): string {
  const lines: string[] = [];
  
  lines.push('╔══════════════════════════════════════════════════════════╗');
  lines.push('║           📋 CEO REVIEW - BAT FRAMEWORK                  ║');
  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push(`║ Feature: ${result.feature.substring(0, 48).padEnd(48)} ║`);
  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push('║  🎯 SCORING (0-5 each)                                   ║');
  lines.push(`║     Brand:     ${'★'.repeat(result.scores.brand).padEnd(5)}${'☆'.repeat(5 - result.scores.brand)}  (${result.scores.brand}/5)        ║`);
  lines.push(`║     Attention: ${'★'.repeat(result.scores.attention).padEnd(5)}${'☆'.repeat(5 - result.scores.attention)}  (${result.scores.attention}/5)        ║`);
  lines.push(`║     Trust:     ${'★'.repeat(result.scores.trust).padEnd(5)}${'☆'.repeat(5 - result.scores.trust)}  (${result.scores.trust}/5)        ║`);
  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push(`║  📊 TOTAL: ${result.totalScore}/${result.maxScore} stars (${result.percentage}%)                      ║`);
  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push('║  🚦 RECOMMENDATION                                       ║');
  
  const recLabel = RECOMMENDATION_LABELS[result.recommendation];
  const recColor = result.recommendation === 'build' ? '✅' : 
                   result.recommendation === 'consider' ? '⚠️ ' : '❌';
  lines.push(`║     ${recColor} ${recLabel.padEnd(50)} ║`);
  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push('║  💡 ANALYSIS                                             ║');
  
  const reasoningLines = result.reasoning.match(/.{1,54}/g) || [result.reasoning];
  reasoningLines.forEach(line => {
    lines.push(`║     ${line.padEnd(52)} ║`);
  });
  
  lines.push('╠══════════════════════════════════════════════════════════╣');
  lines.push('║  📋 NEXT STEPS                                           ║');
  result.nextSteps.forEach((step, i) => {
    lines.push(`║     ${i + 1}. ${step.substring(0, 50).padEnd(50)} ║`);
  });
  lines.push('╚══════════════════════════════════════════════════════════╝');
  
  return lines.join('\n');
}
