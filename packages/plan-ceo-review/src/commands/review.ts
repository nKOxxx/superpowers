import chalk from 'chalk';
import fs from 'fs/promises';

interface ReviewOptions {
  audience?: string;
  market?: string;
  format: string;
  detailed?: boolean;
  output?: string;
}

interface BATScore {
  brand: number;
  attention: number;
  trust: number;
}

interface StarScore {
  problem: number;
  usability: number;
  delight: number;
  feasibility: number;
  viability: number;
}

// Calculate BAT score based on feature characteristics
function calculateBAT(feature: string, audience?: string, market?: string): BATScore {
  const featureLower = feature.toLowerCase();
  
  // Brand alignment indicators
  let brand = 3; // neutral
  const brandPositive = ['ai', 'smart', 'premium', 'pro', 'enterprise', 'secure', 'fast'];
  const brandNegative = ['ads', 'tracking', 'spam', 'basic', 'cheap'];
  
  for (const word of brandPositive) {
    if (featureLower.includes(word)) brand = Math.min(brand + 1, 5);
  }
  for (const word of brandNegative) {
    if (featureLower.includes(word)) brand = Math.max(brand - 1, 1);
  }
  
  // Attention indicators
  let attention = 3;
  const attentionPositive = ['mobile', 'app', 'notification', 'real-time', 'instant', 'ai'];
  const attentionNegative = ['export', 'backup', 'admin', 'config', 'settings'];
  
  for (const word of attentionPositive) {
    if (featureLower.includes(word)) attention = Math.min(attention + 1, 5);
  }
  for (const word of attentionNegative) {
    if (featureLower.includes(word)) attention = Math.max(attention - 1, 1);
  }
  
  // Trust indicators
  let trust = 3;
  const trustPositive = ['secure', 'encrypted', 'private', 'local', 'offline', 'verified'];
  const trustNegative = ['cloud', 'tracking', 'analytics', 'third-party', 'external'];
  
  for (const word of trustPositive) {
    if (featureLower.includes(word)) trust = Math.min(trust + 1, 5);
  }
  for (const word of trustNegative) {
    if (featureLower.includes(word)) trust = Math.max(trust - 1, 1);
  }
  
  // Audience adjustments
  if (audience) {
    if (audience.includes('enterprise')) {
      trust = Math.min(trust + 1, 5);
      brand = Math.min(brand + 1, 5);
    }
    if (audience.includes('developer')) {
      attention = Math.min(attention + 1, 5);
    }
  }
  
  return { brand, attention, trust };
}

// Calculate 10-star score
function calculateStars(feature: string, audience?: string): StarScore {
  const featureLower = feature.toLowerCase();
  
  // Problem score - does it solve a real problem?
  let problem = 6;
  if (featureLower.includes('ai') || featureLower.includes('automation')) problem += 1;
  if (featureLower.includes('mobile') || featureLower.includes('app')) problem += 1;
  if (featureLower.includes('export') || featureLower.includes('backup')) problem -= 1;
  problem = Math.min(Math.max(problem, 1), 10);
  
  // Usability score
  let usability = 6;
  if (featureLower.includes('one-click') || featureLower.includes('instant')) usability += 2;
  if (featureLower.includes('setup') || featureLower.includes('config')) usability -= 1;
  usability = Math.min(Math.max(usability, 1), 10);
  
  // Delight score
  let delight = 5;
  if (featureLower.includes('magic') || featureLower.includes('smart') || featureLower.includes('ai')) delight += 2;
  if (featureLower.includes('dark mode') || featureLower.includes('theme')) delight += 1;
  delight = Math.min(Math.max(delight, 1), 10);
  
  // Feasibility score
  let feasibility = 7;
  if (featureLower.includes('ai') || featureLower.includes('ml')) feasibility -= 2;
  if (featureLower.includes('integration') || featureLower.includes('sync')) feasibility -= 1;
  feasibility = Math.min(Math.max(feasibility, 1), 10);
  
  // Viability score
  let viability = 6;
  if (audience?.includes('enterprise')) viability += 2;
  if (featureLower.includes('premium') || featureLower.includes('pro')) viability += 1;
  viability = Math.min(Math.max(viability, 1), 10);
  
  return { problem, usability, delight, feasibility, viability };
}

function getBATRecommendation(score: number): { text: string; priority: string } {
  if (score >= 12) return { text: 'BUILD', priority: 'PRIORITY' };
  if (score >= 10) return { text: 'BUILD', priority: 'STANDARD' };
  if (score >= 8) return { text: 'CONSIDER', priority: 'REFINE' };
  return { text: "DON'T BUILD", priority: 'REJECT' };
}

function getStarRating(stars: StarScore): number {
  return Math.round((stars.problem + stars.usability + stars.delight + stars.feasibility + stars.viability) / 5);
}

function formatStars(rating: number): string {
  const filled = '⭐'.repeat(rating);
  const empty = '○'.repeat(10 - rating);
  return `${filled}${empty} ${rating}/10`;
}

function formatScore(score: number, max: number): string {
  const filled = '●'.repeat(score);
  const empty = '○'.repeat(max - score);
  return `${filled}${empty} ${score}/${max}`;
}

function generateNextSteps(bat: BATScore, stars: StarScore): string[] {
  const steps: string[] = [];
  
  if (bat.trust < 4) {
    steps.push('Add transparency, security features, or user control options');
  }
  if (stars.usability < 7) {
    steps.push('Simplify the user experience - reduce friction');
  }
  if (bat.attention < 4) {
    steps.push('Improve discoverability and communicate value proposition');
  }
  if (stars.feasibility < 6) {
    steps.push('Break down into smaller, deliverable milestones');
  }
  if (steps.length === 0) {
    steps.push('Validate with target users through prototypes or interviews');
    steps.push('Define success metrics and launch criteria');
  }
  
  return steps;
}

function generateOutput(feature: string, bat: BATScore, stars: StarScore, options: ReviewOptions): string {
  const batTotal = bat.brand + bat.attention + bat.trust;
  const starRating = getStarRating(stars);
  const recommendation = getBATRecommendation(batTotal);
  const nextSteps = generateNextSteps(bat, stars);
  
  if (options.format === 'json') {
    return JSON.stringify({
      feature,
      audience: options.audience,
      market: options.market,
      bat: {
        brand: bat.brand,
        attention: bat.attention,
        trust: bat.trust,
        total: batTotal,
        recommendation: recommendation.text,
      },
      stars: {
        problem: stars.problem,
        usability: stars.usability,
        delight: stars.delight,
        feasibility: stars.feasibility,
        viability: stars.viability,
        overall: starRating,
      },
      nextSteps,
    }, null, 2);
  }
  
  if (options.format === 'markdown') {
    let md = `# CEO Review: ${feature}\n\n`;
    md += `## BAT Framework Score\n\n`;
    md += `- Brand: ${bat.brand}/5\n`;
    md += `- Attention: ${bat.attention}/5\n`;
    md += `- Trust: ${bat.trust}/5\n`;
    md += `- **Total: ${batTotal}/15**\n\n`;
    md += `**Recommendation: ${recommendation.text}**\n\n`;
    md += `## 10-Star Methodology\n\n`;
    md += `Overall: ${starRating}/10\n\n`;
    md += `## Next Steps\n\n`;
    for (const step of nextSteps) {
      md += `1. ${step}\n`;
    }
    return md;
  }
  
  // Text format
  let output = chalk.bold(`\n📊 CEO Review: ${feature}\n\n`);
  
  output += chalk.bold('🎯 BAT Framework Score\n');
  output += `   Brand:     ${formatScore(bat.brand, 5)}\n`;
  output += `   Attention: ${formatScore(bat.attention, 5)}\n`;
  output += `   Trust:     ${formatScore(bat.trust, 5)}\n`;
  
  const color = batTotal >= 12 ? chalk.green : batTotal >= 10 ? chalk.blue : batTotal >= 8 ? chalk.yellow : chalk.red;
  output += `   TOTAL:     ${color(batTotal + '/15')} ${batTotal >= 12 ? '⭐' : ''}\n\n`;
  
  output += chalk.bold(`📋 Recommendation: ${color(recommendation.text)}\n`);
  output += chalk.gray(`   ${recommendation.priority} - ${batTotal >= 10 ? 'Strong signal across BAT dimensions' : batTotal >= 8 ? 'Mixed signals - needs refinement' : 'Weak signal - reconsider'}\n\n`);
  
  output += chalk.bold('⭐ 10-Star Methodology\n');
  output += `   Overall: ${formatStars(starRating)}\n`;
  
  if (options.detailed) {
    output += chalk.gray(`   Problem:      ${stars.problem}/10\n`);
    output += chalk.gray(`   Usability:    ${stars.usability}/10\n`);
    output += chalk.gray(`   Delight:      ${stars.delight}/10\n`);
    output += chalk.gray(`   Feasibility:  ${stars.feasibility}/10\n`);
    output += chalk.gray(`   Viability:    ${stars.viability}/10\n`);
  }
  
  let starDesc = 'Good';
  if (starRating >= 8) starDesc = 'Excellent';
  else if (starRating >= 6) starDesc = 'Great';
  else if (starRating < 5) starDesc = 'Needs work';
  
  output += chalk.gray(`   Current State: ${starDesc}${starRating >= 7 ? ' - exceeds expectations' : ''}\n\n`);
  
  output += chalk.bold('🎯 Final Verdict\n');
  output += `   ${recommendation.priority} ${recommendation.text} - Strong BAT score and ${starRating >= 7 ? 'high' : 'moderate'} star rating indicate ${batTotal >= 10 && starRating >= 7 ? 'product-market fit potential' : 'mixed viability'}.\n\n`;
  
  output += chalk.bold('📍 Next Steps:\n');
  for (let i = 0; i < nextSteps.length; i++) {
    output += `   ${i + 1}. ${nextSteps[i]}\n`;
  }
  
  // Resource estimate
  const resources = stars.feasibility >= 8 ? 'Low' : stars.feasibility >= 6 ? 'Medium' : 'High';
  const timeline = stars.feasibility >= 8 ? '2-4 weeks' : stars.feasibility >= 6 ? '2-3 months' : '4-6 months';
  
  output += chalk.gray(`\n💰 Resources: ${resources}${batTotal >= 12 ? '-High' : ''} - ${batTotal >= 12 ? 'Accelerate to capitalize on strong signals' : 'Standard allocation'}\n`);
  output += chalk.gray(`📅 Timeline: ${timeline} - ${stars.feasibility >= 6 ? 'Standard development timeline' : 'Complex implementation requiring more time'}\n`);
  
  return output;
}

export async function review(feature: string, options: ReviewOptions): Promise<void> {
  const bat = calculateBAT(feature, options.audience, options.market);
  const stars = calculateStars(feature, options.audience);
  
  const output = generateOutput(feature, bat, stars, options);
  
  console.log(output);
  
  if (options.output) {
    await fs.writeFile(options.output, output);
    console.log(chalk.green(`\n✓ Saved to ${options.output}`));
  }
}
