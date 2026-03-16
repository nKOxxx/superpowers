/**
 * Recommendation generator for plan-ceo-review skill
 */

import { BATScores, BATEvaluation } from './bat-scoring.js';
import { MarketAnalysis } from './market-analysis.js';
import { CEOConfig } from './config.js';

export interface Recommendation {
  build: boolean;
  confidence: number;
  reasoning: string[];
  nextSteps?: string[];
}

export function generateRecommendation(
  bat: BATEvaluation,
  marketAnalysis?: MarketAnalysis,
  config?: CEOConfig
): Recommendation {
  const minimumScore = config?.ceoReview?.minimumScore || 10;
  const requireAllBAT = config?.ceoReview?.requireAllBAT || false;
  
  const total = bat.total;
  const meetsScoreThreshold = total >= minimumScore;
  const meetsBATThreshold = requireAllBAT 
    ? bat.brand >= 3 && bat.attention >= 3 && bat.trust >= 3
    : true;
  
  const shouldBuild = meetsScoreThreshold && meetsBATThreshold;
  
  const reasoning: string[] = [];
  
  // BAT analysis
  if (bat.brand >= 4) reasoning.push('Strong brand alignment');
  if (bat.attention >= 4) reasoning.push('High user engagement potential');
  if (bat.trust >= 4) reasoning.push('Builds user trust significantly');
  
  if (bat.brand <= 2) reasoning.push('Limited brand impact');
  if (bat.attention <= 2) reasoning.push('Low expected user engagement');
  if (bat.trust <= 2) reasoning.push('May erode trust');
  
  // Score analysis
  if (total >= 12) reasoning.push('Exceptional BAT score - clear winner');
  else if (total >= 10) reasoning.push('Good BAT score - meets threshold');
  else if (total >= 8) reasoning.push('Borderline score - consider carefully');
  else reasoning.push('Below threshold - likely not worth building');
  
  // Market analysis
  if (marketAnalysis) {
    if (marketAnalysis.trend === 'rising') reasoning.push('Aligned with market trends');
    if (marketAnalysis.trend === 'declining') reasoning.push('Declining market trend');
    if (marketAnalysis.riskLevel === 'high') reasoning.push('High implementation risk');
    if (marketAnalysis.riskLevel === 'low') reasoning.push('Low risk implementation');
  }
  
  // Calculate confidence
  let confidence = 50;
  if (total >= 13) confidence += 30;
  else if (total >= 10) confidence += 15;
  else if (total < 8) confidence -= 20;
  
  if (bat.brand >= 4) confidence += 10;
  if (bat.attention >= 4) confidence += 10;
  if (bat.trust >= 4) confidence += 10;
  
  confidence = Math.min(95, Math.max(20, confidence));
  
  // Generate next steps
  const nextSteps: string[] = [];
  
  if (shouldBuild) {
    nextSteps.push('Create detailed product requirements document');
    nextSteps.push('Estimate engineering effort and timeline');
    nextSteps.push('Design user experience and interface');
    nextSteps.push('Define success metrics and KPIs');
    nextSteps.push('Schedule implementation in roadmap');
    
    if (marketAnalysis?.riskLevel === 'high') {
      nextSteps.push('Conduct security/compliance review');
    }
  } else {
    nextSteps.push('Document decision rationale for future reference');
    if (total < 8) {
      nextSteps.push('Consider alternative approaches or deprioritize');
    } else {
      nextSteps.push('Revisit when additional resources available');
    }
  }
  
  return {
    build: shouldBuild,
    confidence,
    reasoning,
    nextSteps
  };
}
