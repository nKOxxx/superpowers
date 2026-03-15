/**
 * Plan CEO Review skill - BAT framework for product decisions
 * 
 * BAT Framework: Brand, Attention, Trust
 * 10-Star Methodology: Minimum 2/3 criteria must score 3+ to build
 */
import { Logger } from '@nko/superpowers-shared';

const logger = new Logger({ prefix: 'plan-ceo-review' });

export type BATScore = 0 | 1 | 2 | 3 | 4 | 5;
export type Recommendation = 'build' | 'consider' | 'dont-build';

export interface PlanCEOReviewOptions {
  brand?: string;
  attention?: string;
  trust?: string;
  json?: boolean;
}

export interface BATAnalysis {
  feature: string;
  scores: {
    brand: BATScore;
    attention: BATScore;
    trust: BATScore;
  };
  total: number;
  methodology: {
    criteriaMet: number;
    passesThreshold: boolean;
  };
  recommendation: Recommendation;
  reasoning: string[];
  nextSteps: string[];
}

function parseArgs(): { feature: string; options: PlanCEOReviewOptions } {
  const args = process.argv.slice(2);
  const feature = args[0] || '';
  const options: PlanCEOReviewOptions = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--brand':
      case '-b':
        options.brand = args[++i];
        break;
      case '--attention':
      case '-a':
        options.attention = args[++i];
        break;
      case '--trust':
      case '-t':
        options.trust = args[++i];
        break;
      case '--json':
        options.json = true;
        break;
    }
  }

  return { feature, options };
}

const BAT_CRITERIA = {
  brand: {
    name: 'Brand',
    description: 'Does this feature strengthen our brand identity and positioning?',
    scores: {
      0: 'Actively harms brand',
      1: 'Neutral or unclear brand impact',
      2: 'Slight brand alignment',
      3: 'Moderate brand enhancement',
      4: 'Strong brand reinforcement',
      5: 'Iconic brand-defining feature',
    },
  },
  attention: {
    name: 'Attention',
    description: 'Will this capture and retain user attention effectively?',
    scores: {
      0: 'No user interest expected',
      1: 'Minimal attention capture',
      2: 'Some interest from niche users',
      3: 'Moderate user engagement',
      4: 'High attention and engagement',
      5: 'Viral/growth-driving potential',
    },
  },
  trust: {
    name: 'Trust',
    description: 'Does this build or maintain user trust in our product?',
    scores: {
      0: 'Erodes user trust',
      1: 'Neutral trust impact',
      2: 'Minor trust improvement',
      3: 'Moderate trust building',
      4: 'Strong trust enhancement',
      5: 'Trust-building cornerstone',
    },
  },
};

function parseScore(value: string | undefined, defaultValue: BATScore = 0): BATScore {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0 || num > 5) {
    return defaultValue;
  }
  return num as BATScore;
}

function generateRecommendation(analysis: BATAnalysis): { recommendation: Recommendation; reasoning: string[] } {
  const { scores, total, methodology } = analysis;
  const reasoning: string[] = [];
  let recommendation: Recommendation;

  const highScores = [scores.brand, scores.attention, scores.trust].filter(s => s >= 3).length;

  if (methodology.passesThreshold) {
    if (total >= 12) {
      recommendation = 'build';
      reasoning.push('Strong BAT scores across multiple dimensions (10-star threshold met)');
    } else if (total >= 8) {
      recommendation = 'build';
      reasoning.push('Good BAT scores with clear value proposition');
    } else {
      recommendation = 'consider';
      reasoning.push('Meets minimum threshold but scores are modest');
    }
  } else {
    if (total <= 3) {
      recommendation = 'dont-build';
      reasoning.push('Low scores across all BAT dimensions');
    } else {
      recommendation = 'consider';
      reasoning.push('Below 10-star threshold but some potential value identified');
    }
  }

  const lowestScore = Math.min(scores.brand, scores.attention, scores.trust);
  const lowestDimension = Object.entries(scores).find(([, v]) => v === lowestScore)?.[0];
  
  if (lowestScore <= 1 && lowestDimension) {
    reasoning.push(`Warning: Low ${lowestDimension} score (${lowestScore}) may be a risk factor`);
  }

  return { recommendation, reasoning };
}

function generateNextSteps(analysis: BATAnalysis): string[] {
  const steps: string[] = [];
  const { scores, recommendation } = analysis;

  switch (recommendation) {
    case 'build':
      steps.push('1. Create detailed product spec with success metrics');
      steps.push('2. Define MVP scope and timeline');
      steps.push('3. Allocate resources and assign team');
      steps.push('4. Set up feedback loops for iteration');
      break;

    case 'consider':
      steps.push('1. Conduct user research to validate assumptions');
      steps.push('2. Prototype and test with target users');
      steps.push('3. Re-evaluate BAT scores after research');
      if (scores.brand < 3) steps.push('4. Explore brand alignment opportunities');
      if (scores.attention < 3) steps.push('4. Investigate attention-capturing mechanisms');
      if (scores.trust < 3) steps.push('4. Assess trust-building features');
      break;

    case 'dont-build':
      steps.push('1. Document rationale for future reference');
      steps.push('2. Identify alternative approaches to solve the problem');
      steps.push('3. Archive idea for potential future re-evaluation');
      break;
  }

  return steps;
}

function analyzeFeature(feature: string, options: PlanCEOReviewOptions): BATAnalysis {
  const scores = {
    brand: parseScore(options.brand),
    attention: parseScore(options.attention),
    trust: parseScore(options.trust),
  };

  const total = scores.brand + scores.attention + scores.trust;
  const criteriaMet = [scores.brand, scores.attention, scores.trust].filter(s => s >= 3).length;
  const passesThreshold = criteriaMet >= 2;

  const analysis: BATAnalysis = {
    feature,
    scores,
    total,
    methodology: {
      criteriaMet,
      passesThreshold,
    },
    recommendation: 'dont-build',
    reasoning: [],
    nextSteps: [],
  };

  const { recommendation, reasoning } = generateRecommendation(analysis);
  analysis.recommendation = recommendation;
  analysis.reasoning = reasoning;
  analysis.nextSteps = generateNextSteps(analysis);

  return analysis;
}

function renderStars(score: BATScore): string {
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}

function renderBATBar(score: BATScore, maxWidth: number = 30): string {
  const filled = Math.round((score / 5) * maxWidth);
  const empty = maxWidth - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${score}/5`;
}

function formatOutput(analysis: BATAnalysis, json: boolean): string {
  if (json) {
    return JSON.stringify(analysis, null, 2);
  }

  const { feature, scores, total, methodology, recommendation, reasoning, nextSteps } = analysis;

  let output = '\n';
  output += '╔════════════════════════════════════════════════════════════════╗\n';
  output += '║              BAT FRAMEWORK - PRODUCT DECISION                  ║\n';
  output += '╚════════════════════════════════════════════════════════════════╝\n\n';

  output += `Feature: ${feature}\n\n`;

  output += '┌────────────────────────────────────────────────────────────────┐\n';
  output += '│  BAT SCORING (0-5 each)                                        │\n';
  output += '├────────────────────────────────────────────────────────────────┤\n';

  Object.entries(scores).forEach(([dimension, score]) => {
    const criteria = BAT_CRITERIA[dimension as keyof typeof BAT_CRITERIA];
    output += `│  ${criteria.name.padEnd(10)} ${renderStars(score as BATScore)} ${renderBATBar(score as BATScore, 25)}  │\n`;
  });

  output += '├────────────────────────────────────────────────────────────────┤\n';
  output += `│  TOTAL SCORE: ${total}/15 ${' '.repeat(41)}│\n`;
  output += '└────────────────────────────────────────────────────────────────┘\n\n';

  output += '┌────────────────────────────────────────────────────────────────┐\n';
  output += '│  10-STAR METHODOLOGY                                           │\n';
  output += '├────────────────────────────────────────────────────────────────┤\n';
  output += `│  Criteria scoring 3+: ${methodology.criteriaMet}/3                                    │\n`;
  output += `│  Threshold met (2/3 min): ${methodology.passesThreshold ? '✓ YES' : '✗ NO'}                               │\n`;
  output += '└────────────────────────────────────────────────────────────────┘\n\n';

  const recLabels: Record<Recommendation, string> = {
    'build': '🟢 BUILD',
    'consider': '🟡 CONSIDER',
    'dont-build': "🔴 DON'T BUILD",
  };

  output += '┌────────────────────────────────────────────────────────────────┐\n';
  output += `│  RECOMMENDATION: ${recLabels[recommendation].padEnd(46)}│\n`;
  output += '├────────────────────────────────────────────────────────────────┤\n';
  reasoning.forEach(r => {
    output += `│  • ${r.padEnd(62)}│\n`;
  });
  output += '└────────────────────────────────────────────────────────────────┘\n\n';

  output += '┌────────────────────────────────────────────────────────────────┐\n';
  output += '│  NEXT STEPS                                                    │\n';
  output += '├────────────────────────────────────────────────────────────────┤\n';
  nextSteps.forEach(step => {
    output += `│  ${step.padEnd(62)}│\n`;
  });
  output += '└────────────────────────────────────────────────────────────────┘\n\n';

  output += '┌────────────────────────────────────────────────────────────────┐\n';
  output += '│  SCORING CRITERIA REFERENCE                                    │\n';
  output += '├────────────────────────────────────────────────────────────────┤\n';
  Object.entries(BAT_CRITERIA).forEach(([key, criteria]) => {
    output += `│  ${criteria.name.toUpperCase().padEnd(62)}│\n`;
    output += `│  ${criteria.description.slice(0, 62).padEnd(62)}│\n`;
    output += `│  Your score: ${scores[key as keyof typeof scores]}/5 - ${criteria.scores[scores[key as keyof typeof scores] as BATScore].slice(0, 43).padEnd(43)}│\n`;
    output += '├────────────────────────────────────────────────────────────────┤\n';
  });
  output = output.slice(0, -68) + '└────────────────────────────────────────────────────────────────┘\n';

  return output;
}

export async function main(): Promise<void> {
  const { feature, options } = parseArgs();
  
  if (!feature) {
    console.error('Error: Feature description is required');
    console.error('Usage: superpowers plan-ceo-review "Feature: Description"');
    process.exit(1);
  }

  logger.info(`Analyzing feature: ${feature}`);

  try {
    const analysis = analyzeFeature(feature, options);
    const output = formatOutput(analysis, options.json || false);

    console.log(output);

    switch (analysis.recommendation) {
      case 'build':
        console.log('Recommendation: BUILD');
        process.exit(0);
        break;
      case 'consider':
        console.log('\n⚠️  Recommendation: CONSIDER - Further research recommended');
        process.exit(0);
        break;
      case 'dont-build':
        console.log('\n🛑 Recommendation: DO NOT BUILD');
        process.exit(1);
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Analysis failed: ${message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}