interface CEORviewOptions {
  feature: string;
  goal?: string;
  audience?: string;
  competition?: string;
  trust?: string;
  brand?: string;
  attention?: string;
  trustScore?: string;
}

interface BATScores {
  brand: number;
  attention: number;
  trust: number;
}

interface Recommendation {
  action: 'BUILD' | 'CONSIDER' | 'DONT_BUILD';
  emoji: string;
  description: string;
}

export async function ceoReviewCommand(options: CEORviewOptions): Promise<void> {
  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log(options.feature);
  console.log('══════════════════════════════════════════════════');
  console.log('');

  // Calculate or use provided scores
  const scores: BATScores = {
    brand: options.brand ? parseInt(options.brand, 10) : calculateBrandScore(options),
    attention: options.attention ? parseInt(options.attention, 10) : calculateAttentionScore(options),
    trust: options.trustScore ? parseInt(options.trustScore, 10) : calculateTrustScore(options)
  };

  // Ensure scores are within bounds
  scores.brand = Math.max(0, Math.min(5, scores.brand));
  scores.attention = Math.max(0, Math.min(5, scores.attention));
  scores.trust = Math.max(0, Math.min(5, scores.trust));

  const total = scores.brand + scores.attention + scores.trust;

  // Display scores
  console.log(`Brand:     ${renderStars(scores.brand)} (${scores.brand}/5)`);
  console.log(`Attention: ${renderStars(scores.attention)} (${scores.attention}/5)`);
  console.log(`Trust:     ${renderStars(scores.trust)} (${scores.trust}/5)`);
  console.log('');
  console.log(`Total: ${total}/15 ⭐`);
  console.log('');

  // Get recommendation
  const recommendation = getRecommendation(total, scores);
  console.log(`Recommendation: ${recommendation.action} ${recommendation.emoji}`);
  console.log('');

  // Show rationale
  console.log('Rationale:');
  console.log(generateRationale(scores, options));
  console.log('');

  // Next steps
  console.log('Next Steps:');
  const nextSteps = generateNextSteps(recommendation.action, options);
  nextSteps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log('');
}

function renderStars(score: number): string {
  const filled = '⭐'.repeat(score);
  const empty = '○'.repeat(5 - score);
  return filled + empty;
}

function calculateBrandScore(options: CEORviewOptions): number {
  let score = 3; // Default middle score

  // Adjust based on feature characteristics
  const feature = options.feature.toLowerCase();
  
  // High brand impact features
  if (feature.includes('ai') || feature.includes('ml')) score += 1;
  if (feature.includes('innovation') || feature.includes('breakthrough')) score += 1;
  if (options.goal?.includes('differentiate') || options.goal?.includes('unique')) score += 1;
  
  // Lower brand impact
  if (feature.includes('maintenance') || feature.includes('fix')) score -= 1;
  if (feature.includes('me too') || feature.includes('copy')) score -= 2;

  return Math.max(0, Math.min(5, score));
}

function calculateAttentionScore(options: CEORviewOptions): number {
  let score = 3; // Default middle score

  const feature = options.feature.toLowerCase();
  
  // High attention features
  if (feature.includes('notification') || feature.includes('alert')) score += 1;
  if (feature.includes('dashboard') || feature.includes('home')) score += 1;
  if (options.audience?.includes('all') || options.audience?.includes('everyone')) score += 1;
  if (options.goal?.includes('daily') || options.goal?.includes('frequent')) score += 1;
  
  // Lower attention
  if (feature.includes('admin') || feature.includes('settings')) score -= 1;
  if (options.audience?.includes('internal') || options.audience?.includes('dev')) score -= 1;

  return Math.max(0, Math.min(5, score));
}

function calculateTrustScore(options: CEORviewOptions): number {
  let score = 3; // Default middle score

  const feature = options.feature.toLowerCase();
  
  // High trust features
  if (feature.includes('security') || feature.includes('auth')) score += 2;
  if (feature.includes('privacy') || feature.includes('encrypt')) score += 2;
  if (feature.includes('backup') || feature.includes('recovery')) score += 1;
  if (options.trust?.includes('certified') || options.trust?.includes('audited')) score += 1;
  
  // Lower trust
  if (feature.includes('experimental') || feature.includes('beta')) score -= 1;
  if (options.trust?.includes('untested') || options.trust?.includes('new vendor')) score -= 1;

  return Math.max(0, Math.min(5, score));
}

function getRecommendation(total: number, scores: BATScores): Recommendation {
  if (total >= 12) {
    return {
      action: 'BUILD',
      emoji: '✅',
      description: 'Strong signal, proceed with confidence'
    };
  } else if (total >= 10) {
    return {
      action: 'BUILD',
      emoji: '✅',
      description: 'Good signal, validate assumptions before full commitment'
    };
  } else if (total >= 8) {
    return {
      action: 'CONSIDER',
      emoji: '⚠️',
      description: 'Mixed signal, need more data before deciding'
    };
  } else {
    return {
      action: 'DONT_BUILD',
      emoji: '❌',
      description: 'Weak signal, focus resources elsewhere'
    };
  }
}

function generateRationale(scores: BATScores, options: CEORviewOptions): string {
  const points: string[] = [];

  // Brand rationale
  if (scores.brand >= 4) {
    points.push('Strong brand differentiation potential');
  } else if (scores.brand <= 2) {
    points.push('Limited brand impact - consider strategic positioning');
  }

  // Attention rationale
  if (scores.attention >= 4) {
    points.push('High user engagement potential');
  } else if (scores.attention <= 2) {
    points.push('Limited user attention - niche use case');
  }

  // Trust rationale
  if (scores.trust >= 4) {
    points.push('Builds significant user trust');
  } else if (scores.trust <= 2) {
    points.push('Trust concerns need addressing');
  }

  // Business goal
  if (options.goal) {
    if (options.goal.includes('revenue') || options.goal.includes('profit')) {
      points.push('Direct revenue impact should be modeled');
    }
    if (options.goal.includes('retention') || options.goal.includes('churn')) {
      points.push('User retention implications should be measured');
    }
  }

  // Competition
  if (options.competition) {
    points.push(`Competitive landscape: ${options.competition}`);
  }

  if (points.length === 0) {
    points.push('Standard feature with moderate impact across all dimensions');
  }

  return points.map(p => `• ${p}`).join('\n');
}

function generateNextSteps(action: string, options: CEORviewOptions): string[] {
  const steps: string[] = [];

  switch (action) {
    case 'BUILD':
      steps.push('Define success metrics (DAU, engagement time, conversion)');
      steps.push('Create technical specification and resource estimate');
      steps.push('Coordinate with marketing for launch narrative');
      if (options.audience) {
        steps.push(`Validate with ${options.audience} through user interviews`);
      }
      steps.push('Set 30-day post-launch review date');
      break;

    case 'CONSIDER':
      steps.push('Conduct user research to validate assumptions');
      steps.push('Build proof-of-concept to test technical feasibility');
      steps.push('Analyze competitive alternatives in detail');
      steps.push('Revisit BAT scoring in 2 weeks with new data');
      break;

    case 'DONT_BUILD':
      steps.push('Document rationale for future reference');
      steps.push('Identify 1-2 alternative features with higher BAT scores');
      steps.push('Monitor market conditions for changes that might affect scoring');
      steps.push('Archive for potential future reconsideration');
      break;
  }

  return steps;
}
