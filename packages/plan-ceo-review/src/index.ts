import { writeFileSync } from 'fs';

export interface CEOReviewOptions {
  question: string;
  auto?: boolean;
  format?: 'markdown' | 'json' | 'text';
  save?: string;
}

export interface BATScore {
  brand: number;
  attention: number;
  trust: number;
  overall: number;
}

export interface Factor {
  name: string;
  impact: 'high' | 'medium' | 'low';
  positive: boolean;
  description: string;
}

export interface DimensionAnalysis {
  score: number;
  maxScore: number;
  factors: Factor[];
  recommendations: string[];
}

export interface CEOReviewResult {
  question: string;
  bat: BATScore;
  brand: DimensionAnalysis;
  attention: DimensionAnalysis;
  trust: DimensionAnalysis;
  summary: string;
  verdict: 'proceed' | 'caution' | 'reconsider';
  nextSteps: string[];
}

// BAT Framework scoring weights
const WEIGHTS = {
  brand: 0.35,
  attention: 0.35,
  trust: 0.30
};

function analyzeBrand(question: string): DimensionAnalysis {
  const lowerQ = question.toLowerCase();
  const factors: Factor[] = [];
  let score = 50;
  
  const brandTerms = ['brand', 'identity', 'values', 'mission', 'vision'];
  const hasBrandFocus = brandTerms.some(t => lowerQ.includes(t));
  if (hasBrandFocus) {
    factors.push({
      name: 'Brand-Centric Initiative',
      impact: 'high',
      positive: true,
      description: 'Explicit focus on brand elements suggests strong alignment intention'
    });
    score += 15;
  }
  
  const diffTerms = ['unique', 'different', 'new', 'innovative', 'first', 'only'];
  const hasDifferentiation = diffTerms.some(t => lowerQ.includes(t));
  if (hasDifferentiation) {
    factors.push({
      name: 'Differentiation Potential',
      impact: 'high',
      positive: true,
      description: 'Language suggests attempt to differentiate from competitors'
    });
    score += 10;
  }
  
  const riskTerms = ['cheap', 'quick', 'easy', 'shortcut', 'hack'];
  const hasRiskLanguage = riskTerms.some(t => lowerQ.includes(t));
  if (hasRiskLanguage) {
    factors.push({
      name: 'Potential Brand Dilution',
      impact: 'high',
      positive: false,
      description: 'Language suggests shortcuts that may harm brand perception'
    });
    score -= 20;
  }
  
  const consistencyTerms = ['consistent', 'maintain', 'build on', 'extend'];
  const hasConsistency = consistencyTerms.some(t => lowerQ.includes(t));
  if (hasConsistency) {
    factors.push({
      name: 'Brand Consistency',
      impact: 'medium',
      positive: true,
      description: 'Builds on existing brand foundation'
    });
    score += 10;
  }
  
  const recommendations: string[] = [];
  if (!hasBrandFocus) {
    recommendations.push('Explicitly connect this initiative to core brand values');
  }
  if (!hasDifferentiation) {
    recommendations.push('Identify and emphasize unique aspects vs. competitors');
  }
  if (score < 60) {
    recommendations.push('Conduct brand impact assessment before proceeding');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    factors,
    recommendations
  };
}

function analyzeAttention(question: string): DimensionAnalysis {
  const lowerQ = question.toLowerCase();
  const factors: Factor[] = [];
  let score = 50;
  
  const audienceTerms = ['customer', 'user', 'audience', 'market', 'people'];
  const hasAudienceFocus = audienceTerms.some(t => lowerQ.includes(t));
  if (hasAudienceFocus) {
    factors.push({
      name: 'Audience-Centric',
      impact: 'high',
      positive: true,
      description: 'Explicit focus on target audience needs'
    });
    score += 15;
  }
  
  const noveltyTerms = ['new', 'launch', 'introduce', 'announce', 'reveal', 'unveil'];
  const hasNovelty = noveltyTerms.some(t => lowerQ.includes(t));
  if (hasNovelty) {
    factors.push({
      name: 'Newsworthiness',
      impact: 'high',
      positive: true,
      description: 'Has news value and announcement potential'
    });
    score += 10;
  }
  
  const clarityTerms = ['simple', 'clear', 'easy', 'understand', 'straightforward'];
  const hasClarity = clarityTerms.some(t => lowerQ.includes(t));
  if (hasClarity) {
    factors.push({
      name: 'Clear Value Proposition',
      impact: 'medium',
      positive: true,
      description: 'Language suggests easy-to-understand value'
    });
    score += 10;
  }
  
  const crowdedTerms = ['market', 'competitor', 'industry', 'space'];
  const inCrowdedSpace = crowdedTerms.some(t => lowerQ.includes(t));
  if (inCrowdedSpace) {
    factors.push({
      name: 'Attention Competition',
      impact: 'medium',
      positive: false,
      description: 'Operating in space with high attention competition'
    });
    score -= 5;
  }
  
  const recommendations: string[] = [];
  if (!hasAudienceFocus) {
    recommendations.push('Define clear target audience for this initiative');
  }
  if (!hasNovelty) {
    recommendations.push('Identify the "new" angle or announcement hook');
  }
  if (!hasClarity) {
    recommendations.push('Simplify value proposition to 10 words or less');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    factors,
    recommendations
  };
}

function analyzeTrust(question: string): DimensionAnalysis {
  const lowerQ = question.toLowerCase();
  const factors: Factor[] = [];
  let score = 50;
  
  const credibilityTerms = ['proven', 'tested', 'verified', 'expert', 'research', 'data'];
  const hasCredibility = credibilityTerms.some(t => lowerQ.includes(t));
  if (hasCredibility) {
    factors.push({
      name: 'Evidence-Based Approach',
      impact: 'high',
      positive: true,
      description: 'Backed by data, research, or expertise'
    });
    score += 15;
  }
  
  const transparencyTerms = ['transparent', 'honest', 'open', 'clear about'];
  const hasTransparency = transparencyTerms.some(t => lowerQ.includes(t));
  if (hasTransparency) {
    factors.push({
      name: 'Transparency Commitment',
      impact: 'medium',
      positive: true,
      description: 'Language suggests openness about process'
    });
    score += 10;
  }
  
  const riskTerms = ['risk', 'concern', 'issue', 'problem', 'challenge'];
  const acknowledgesRisk = riskTerms.some(t => lowerQ.includes(t));
  if (acknowledgesRisk) {
    factors.push({
      name: 'Risk Awareness',
      impact: 'medium',
      positive: true,
      description: 'Acknowledges potential challenges (shows maturity)'
    });
    score += 5;
  }
  
  const overpromiseTerms = ['guarantee', 'best', 'perfect', 'revolutionary', 'game-changing', 'always'];
  const hasOverpromise = overpromiseTerms.some(t => lowerQ.includes(t));
  if (hasOverpromise) {
    factors.push({
      name: 'Potential Overpromise',
      impact: 'high',
      positive: false,
      description: 'Language may set unrealistic expectations'
    });
    score -= 15;
  }
  
  const recommendations: string[] = [];
  if (!hasCredibility) {
    recommendations.push('Add supporting evidence or third-party validation');
  }
  if (hasOverpromise) {
    recommendations.push('Review language for overpromising; use more measured claims');
  }
  if (!acknowledgesRisk && score < 70) {
    recommendations.push('Acknowledge limitations to build credibility');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    factors,
    recommendations
  };
}

function calculateOverallScore(bat: BATScore): number {
  return Math.round(
    bat.brand * WEIGHTS.brand +
    bat.attention * WEIGHTS.attention +
    bat.trust * WEIGHTS.trust
  );
}

function determineVerdict(overallScore: number): 'proceed' | 'caution' | 'reconsider' {
  if (overallScore >= 75) return 'proceed';
  if (overallScore >= 50) return 'caution';
  return 'reconsider';
}

function generateSummary(result: CEOReviewResult): string {
  const verdicts = {
    proceed: 'This initiative scores well across all BAT dimensions and is recommended to proceed.',
    caution: 'This initiative shows promise but has areas needing attention before full commitment.',
    reconsider: 'This initiative has significant concerns across multiple dimensions. Consider significant revision or alternative approaches.'
  };
  
  let summary = verdicts[result.verdict];
  summary += '\n\n';
  
  const strengths: string[] = [];
  const concerns: string[] = [];
  
  if (result.brand.score >= 70) strengths.push('Brand alignment');
  else if (result.brand.score < 50) concerns.push('Brand risks');
  
  if (result.attention.score >= 70) strengths.push('Attention capture');
  else if (result.attention.score < 50) concerns.push('Attention challenges');
  
  if (result.trust.score >= 70) strengths.push('Trust building');
  else if (result.trust.score < 50) concerns.push('Trust gaps');
  
  if (strengths.length > 0) {
    summary += `Strengths: ${strengths.join(', ')}. `;
  }
  if (concerns.length > 0) {
    summary += `Key concerns: ${concerns.join(', ')}.`;
  }
  
  return summary;
}

function generateNextSteps(result: CEOReviewResult): string[] {
  const steps: string[] = [];
  steps.push(...result.brand.recommendations);
  steps.push(...result.attention.recommendations);
  steps.push(...result.trust.recommendations);
  
  switch (result.verdict) {
    case 'proceed':
      steps.push('Document BAT rationale for stakeholder communication');
      steps.push('Set success metrics aligned with BAT dimensions');
      break;
    case 'caution':
      steps.push('Address flagged concerns before full launch');
      steps.push('Consider phased rollout with feedback loops');
      break;
    case 'reconsider':
      steps.push('Revisit core premise and strategic fit');
      steps.push('Explore alternative approaches with better BAT profile');
      break;
  }
  
  return [...new Set(steps)];
}

export async function planCEOReview(options: CEOReviewOptions): Promise<CEOReviewResult> {
  const { question } = options;
  
  const brandAnalysis = analyzeBrand(question);
  const attentionAnalysis = analyzeAttention(question);
  const trustAnalysis = analyzeTrust(question);
  
  const bat: BATScore = {
    brand: brandAnalysis.score,
    attention: attentionAnalysis.score,
    trust: trustAnalysis.score,
    overall: 0
  };
  
  bat.overall = calculateOverallScore(bat);
  
  const verdict = determineVerdict(bat.overall);
  
  const result: CEOReviewResult = {
    question,
    bat,
    brand: brandAnalysis,
    attention: attentionAnalysis,
    trust: trustAnalysis,
    summary: '',
    verdict,
    nextSteps: []
  };
  
  result.summary = generateSummary(result);
  result.nextSteps = generateNextSteps(result);
  
  return result;
}
