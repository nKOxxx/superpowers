import { loadConfig, getCeoReviewConfig } from '../lib/config.js';
import { sendMessage, formatCEOResult } from '../lib/telegram.js';
import {
  header,
  success,
  error,
  step,
  info,
  warning,
  section,
  list,
  box,
  divider,
  colors
} from '../lib/format.js';
import type { BATScore, CEOResult } from '../types.js';

interface CEOptions {
  feature?: string;
  goal?: string;
  marketAnalysis?: boolean;
  minimumScore?: string;
  output?: string;
}

export async function planCeoReviewCommand(question: string, options: CEOptions): Promise<void> {
  header('Plan CEO Review - BAT Framework');

  const config = loadConfig();
  const ceoConfig = getCeoReviewConfig(config);

  step(`Evaluating: "${question}"`);

  if (options.feature) {
    info(`Feature: ${options.feature}`);
  }
  if (options.goal) {
    info(`Goal: ${options.goal}`);
  }

  // Perform BAT analysis
  const scores = await analyzeBAT(question, options, ceoConfig);

  // Calculate overall score
  const overall = (scores.brand + scores.attention + scores.trust) / 3;
  scores.overall = Math.round(overall * 10) / 10;

  // Generate analysis text
  const brandAnalysis = generateBrandAnalysis(question, options, scores.brand);
  const attentionAnalysis = generateAttentionAnalysis(question, options, scores.attention);
  const trustAnalysis = generateTrustAnalysis(question, options, scores.trust);

  // Identify risks
  const risks = identifyRisks(question, options, scores);

  // Generate alternatives
  const alternatives = generateAlternatives(question, options);

  // Make decision
  const decision = makeDecision(scores, parseFloat(options.minimumScore || '7'), ceoConfig);

  // Generate next steps
  const nextSteps = generateNextSteps(decision, question, options);

  const result: CEOResult = {
    question,
    scores,
    brandAnalysis,
    attentionAnalysis,
    trustAnalysis,
    risks,
    alternatives,
    decision,
    nextSteps
  };

  // Output results
  await outputResults(result, options);
}

async function analyzeBAT(
  question: string,
  options: CEOptions,
  config: any
): Promise<BATScore> {
  step('Analyzing BAT dimensions...');

  // Brand score - alignment with core values and positioning
  const brandScore = analyzeBrandDimension(question, options);

  // Attention score - user value and differentiation
  const attentionScore = analyzeAttentionDimension(question, options);

  // Trust score - deliverability and expectations
  const trustScore = analyzeTrustDimension(question, options);

  return {
    brand: brandScore,
    attention: attentionScore,
    trust: trustScore,
    overall: 0 // Calculated later
  };
}

function analyzeBrandDimension(question: string, options: CEOptions): number {
  // Brand analysis factors
  const factors: Array<{ score: number; weight: number }> = [];

  // Core alignment - does this fit what we stand for?
  const alignment = scoreFactor(question, [
    { pattern: /free|open source|community/i, score: 8 },
    { pattern: /premium|exclusive|vip/i, score: 6 },
    { pattern: /ad|advertising|tracking/i, score: 3 },
    { pattern: /partnership|integration/i, score: 7 },
    { pattern: /rewrite|rebuild|migrate/i, score: 4 }
  ]);
  factors.push({ score: alignment, weight: 0.4 });

  // Market positioning - strengthens or weakens?
  const positioning = scoreFactor(question, [
    { pattern: /premium|enterprise|scale/i, score: 8 },
    { pattern: /free|cheap|discount/i, score: 5 },
    { pattern: /new market|expansion/i, score: 7 },
    { pattern: /pivot|change direction/i, score: 4 }
  ]);
  factors.push({ score: positioning, weight: 0.3 });

  // Long-term brand equity
  const equity = scoreFactor(question, [
    { pattern: /innovation|research|future/i, score: 9 },
    { pattern: /stability|reliability/i, score: 8 },
    { pattern: /shortcut|quick|hack/i, score: 3 },
    { pattern: /bandwidth|capacity/i, score: 6 }
  ]);
  factors.push({ score: equity, weight: 0.3 });

  return calculateWeightedScore(factors);
}

function analyzeAttentionDimension(question: string, options: CEOptions): number {
  const factors: Array<{ score: number; weight: number }> = [];

  // User value proposition
  const value = scoreFactor(question, [
    { pattern: /solve|fix|improve|better/i, score: 9 },
    { pattern: /new feature|capability/i, score: 7 },
    { pattern: /convenience|easier|faster/i, score: 8 },
    { pattern: /cost|price|cheaper/i, score: 6 }
  ]);
  factors.push({ score: value, weight: 0.35 });

  // Differentiation from competitors
  const differentiation = scoreFactor(question, [
    { pattern: /unique|first|only|exclusive/i, score: 9 },
    { pattern: /better than|superior/i, score: 8 },
    { pattern: /similar|like|copy/i, score: 4 },
    { pattern: /standard|common|expected/i, score: 5 }
  ]);
  factors.push({ score: differentiation, weight: 0.35 });

  // Engagement potential
  const engagement = scoreFactor(question, [
    { pattern: /notification|alert|update/i, score: 6 },
    { pattern: /social|share|community/i, score: 7 },
    { pattern: /interactive|engagement/i, score: 8 },
    { pattern: /background|invisible/i, score: 4 }
  ]);
  factors.push({ score: engagement, weight: 0.3 });

  return calculateWeightedScore(factors);
}

function analyzeTrustDimension(question: string, options: CEOptions): number {
  const factors: Array<{ score: number; weight: number }> = [];

  // User expectations
  const expectations = scoreFactor(question, [
    { pattern: /promise|commit|guarantee/i, score: 7 },
    { pattern: /experiment|test|try/i, score: 5 },
    { pattern: /beta|alpha|early/i, score: 4 },
    { pattern: /deprecated|remove|end/i, score: 3 }
  ]);
  factors.push({ score: expectations, weight: 0.4 });

  // Deliverability - can we actually do this?
  const deliverability = scoreFactor(question, [
    { pattern: /simple|easy|known/i, score: 9 },
    { pattern: /complex|difficult|hard/i, score: 5 },
    { pattern: /new technology|uncharted/i, score: 4 },
    { pattern: /proven|established|standard/i, score: 8 }
  ]);
  factors.push({ score: deliverability, weight: 0.35 });

  // Transparency and honesty
  const transparency = scoreFactor(question, [
    { pattern: /clear|transparent|open/i, score: 9 },
    { pattern: /hidden|secret|private/i, score: 3 },
    { pattern: /opt-in|consent|choice/i, score: 8 },
    { pattern: /opt-out|default|automatic/i, score: 5 }
  ]);
  factors.push({ score: transparency, weight: 0.25 });

  return calculateWeightedScore(factors);
}

function scoreFactor(
  text: string,
  patterns: Array<{ pattern: RegExp; score: number }>
): number {
  for (const { pattern, score } of patterns) {
    if (pattern.test(text)) {
      return score;
    }
  }
  return 5; // Default neutral score
}

function calculateWeightedScore(factors: Array<{ score: number; weight: number }>): number {
  const total = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return Math.round(total * 10) / 10;
}

function generateBrandAnalysis(question: string, options: CEOptions, score: number): string {
  if (score >= 8) {
    return 'Strong alignment with brand values and long-term positioning. This reinforces our core identity and market position.';
  } else if (score >= 6) {
    return 'Generally aligned with brand, though some aspects may need clarification or positioning adjustments.';
  } else if (score >= 4) {
    return 'Potential brand misalignment. Consider how this fits with our core values and market positioning.';
  } else {
    return 'Significant brand risk. This may contradict our core values or damage our market position.';
  }
}

function generateAttentionAnalysis(question: string, options: CEOptions, score: number): string {
  if (score >= 8) {
    return 'High user value with strong differentiation. This will capture attention and provide clear benefits.';
  } else if (score >= 6) {
    return 'Moderate value proposition. Users will benefit, but differentiation may need strengthening.';
  } else if (score >= 4) {
    return 'Limited attention capture. Consider how to increase user value or differentiation.';
  } else {
    return 'Weak value proposition. Unclear user benefit or significant competitive disadvantage.';
  }
}

function generateTrustAnalysis(question: string, options: CEOptions, score: number): string {
  if (score >= 8) {
    return 'High confidence in deliverability with transparent approach. User expectations will be met or exceeded.';
  } else if (score >= 6) {
    return 'Reasonable trust level. Most expectations can be met, with some areas needing attention.';
  } else if (score >= 4) {
    return 'Trust concerns. Deliverability or transparency issues may impact user confidence.';
  } else {
    return 'Significant trust risk. Expectations may not be met, or approach lacks transparency.';
  }
}

function identifyRisks(question: string, options: CEOptions, scores: BATScore): string[] {
  const risks: string[] = [];

  if (scores.brand < 6) {
    risks.push('Brand dilution or misalignment with core values');
  }
  if (scores.attention < 6) {
    risks.push('Low user adoption due to weak value proposition');
  }
  if (scores.trust < 6) {
    risks.push('User trust erosion if expectations not met');
  }
  if (scores.overall < 5) {
    risks.push('Overall strategic misfit - reconsider fundamentals');
  }

  // Question-specific risks
  if (/partnership|partner/i.test(question)) {
    risks.push('Dependency on external partner reliability');
  }
  if (/rewrite|rebuild|migrate/i.test(question)) {
    risks.push('Technical execution risk and opportunity cost');
  }
  if (/free|discount/i.test(question)) {
    risks.push('Revenue impact and user expectation setting');
  }
  if (/price|cost|increase/i.test(question)) {
    risks.push('User churn or competitive displacement');
  }

  return risks;
}

function generateAlternatives(question: string, options: CEOptions): string[] {
  const alternatives: string[] = [];

  // Generic alternatives
  alternatives.push('MVP test with limited rollout before full commitment');
  alternatives.push('Partner with existing solution instead of building');
  alternatives.push('Defer decision pending more data or market validation');

  // Question-specific alternatives
  if (/feature|build/i.test(question)) {
    alternatives.push('Build a simpler version addressing core need only');
    alternatives.push('Use third-party integration as interim solution');
  }
  if (/price|cost/i.test(question)) {
    alternatives.push('Test pricing change with subset of users');
    alternatives.push('Add value before increasing price (grandfathering)');
  }
  if (/partnership/i.test(question)) {
    alternatives.push('Loose collaboration without formal partnership');
    alternatives.push('White-label arrangement instead of co-branding');
  }

  return alternatives;
}

function makeDecision(scores: BATScore, minimumScore: number, config: any): 'PROCEED' | 'PAUSE' | 'REJECT' {
  // Check if requireAllBAT is set
  if (config.requireAllBAT) {
    const allPass = scores.brand >= minimumScore && 
                   scores.attention >= minimumScore && 
                   scores.trust >= minimumScore;
    if (!allPass) {
      return scores.overall < minimumScore - 2 ? 'REJECT' : 'PAUSE';
    }
  }

  if (scores.overall >= 8.5) {
    return 'PROCEED';
  } else if (scores.overall >= minimumScore) {
    return 'PROCEED';
  } else if (scores.overall >= minimumScore - 1.5) {
    return 'PAUSE';
  } else {
    return 'REJECT';
  }
}

function generateNextSteps(
  decision: string,
  question: string,
  options: CEOptions
): string[] {
  const steps: string[] = [];

  switch (decision) {
    case 'PROCEED':
      steps.push('Create detailed implementation plan with milestones');
      steps.push('Assign ownership and resources');
      steps.push('Set success metrics and review cadence');
      steps.push('Communicate decision to stakeholders');
      break;
    case 'PAUSE':
      steps.push('Gather additional data to address identified concerns');
      steps.push('Run limited experiment or pilot to validate assumptions');
      steps.push('Revisit decision in 2-4 weeks with new information');
      steps.push('Document conditions for PROCEED or REJECT');
      break;
    case 'REJECT':
      steps.push('Document rationale for future reference');
      steps.push('Identify alternative approaches from suggestions');
      steps.push('Monitor market for changes that might affect decision');
      steps.push('Archive for potential future reconsideration');
      break;
  }

  return steps;
}

async function outputResults(result: CEOResult, options: CEOptions): Promise<void> {
  divider();

  // BAT Scores
  section('🎯 BAT Scores');
  console.log(`  🏷️  Brand:     ${formatScore(result.scores.brand)}`);
  console.log(`  👀 Attention: ${formatScore(result.scores.attention)}`);
  console.log(`  🤝 Trust:     ${formatScore(result.scores.trust)}`);
  console.log(`  ──────────────────`);
  console.log(`  📊 Overall:   ${formatScore(result.scores.overall)}`);

  divider();

  // Analysis
  section('📋 Analysis');
  console.log(colors.bold('\nBrand:'));
  console.log(result.brandAnalysis);
  console.log(colors.bold('\nAttention:'));
  console.log(result.attentionAnalysis);
  console.log(colors.bold('\nTrust:'));
  console.log(result.trustAnalysis);

  divider();

  // Risks
  if (result.risks.length > 0) {
    section('⚠️  Risks');
    list(result.risks);
    divider();
  }

  // Alternatives
  section('💡 Alternative Approaches');
  list(result.alternatives);

  divider();

  // Decision
  const decisionColor = {
    'PROCEED': colors.success,
    'PAUSE': colors.primary,
    'REJECT': colors.error
  }[result.decision];

  box(`DECISION: ${result.decision}\n\nScore: ${result.scores.overall}/10`);

  // Next Steps
  section('📍 Next Steps');
  list(result.nextSteps);

  divider();

  // Send notification if configured
  try {
    await sendMessage(formatCEOResult(result));
  } catch {
    // Notification failed, but analysis succeeded
  }
}

function formatScore(score: number): string {
  let color = colors.muted;
  if (score >= 8) color = colors.success;
  else if (score >= 6) color = colors.primary;
  else if (score >= 4) color = colors.warning;
  else color = colors.error;

  const bar = '█'.repeat(Math.floor(score)) + '░'.repeat(10 - Math.floor(score));
  return `${color(bar)} ${color(score.toFixed(1) + '/10')}`;
}
