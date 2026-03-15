import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { createSpinner, logSuccess, logError, logInfo, logWarning } from '../utils/helpers.js';

interface CEOReviewOptions {
  feature: string;
  brand?: number;
  attention?: number;
  trust?: number;
  goal?: string;
  auto?: boolean;
  output?: string;
  json: boolean;
}

interface BATScores {
  brand: number;
  attention: number;
  trust: number;
  total: number;
}

interface Recommendation {
  decision: 'build' | 'consider' | 'dont-build';
  reasoning: string[];
  nextSteps: string[];
}

export const ceoReviewCommand = new Command('plan-ceo-review')
  .description('Product strategy review using BAT (Brand, Attention, Trust) framework')
  .argument('<feature>', 'Feature name to review')
  .argument('[goal]', 'Feature goal/strategy context')
  .option('--brand <n>', 'Brand score (0-5)', parseFloat)
  .option('--attention <n>', 'Attention score (0-5)', parseFloat)
  .option('--trust <n>', 'Trust score (0-5)', parseFloat)
  .option('--auto', 'Auto-calculate scores based on feature name', false)
  .option('-o, --output <path>', 'Output report to file')
  .option('--json', 'Output as JSON', false)
  .action(async (feature: string, goal: string | undefined, options: CEOReviewOptions) => {
    const spinner = createSpinner('Analyzing feature strategy...');
    
    try {
      spinner.start();
      options.feature = feature;
      options.goal = goal || '';
      
      // Get or calculate scores
      let scores: BATScores;
      
      if (options.auto || (!options.brand && !options.attention && !options.trust)) {
        spinner.text = 'Auto-calculating BAT scores...';
        scores = await calculateAutoScores(options.feature, options.goal);
      } else {
        scores = {
          brand: clampScore(options.brand ?? 3),
          attention: clampScore(options.attention ?? 3),
          trust: clampScore(options.trust ?? 3),
          total: 0
        };
        scores.total = scores.brand + scores.attention + scores.trust;
      }
      
      spinner.stop();
      
      // Generate recommendation
      const recommendation = generateRecommendation(scores, options.feature, options.goal);
      
      // Output results
      if (options.json) {
        const result = {
          feature: options.feature,
          goal: options.goal,
          bat: scores,
          recommendation
        };
        console.log(JSON.stringify(result, null, 2));
        if (options.output) {
          writeFileSync(options.output, JSON.stringify(result, null, 2));
          logSuccess(`Report saved to ${options.output}`);
        }
      } else {
        printReport(options.feature, scores, recommendation, options.goal);
        
        // Save to file if requested
        if (options.output) {
          const report = generateMarkdownReport(options.feature, scores, recommendation, options.goal);
          writeFileSync(options.output, report);
          logSuccess(`Report saved to ${options.output}`);
        }
      }
      
      // Exit with appropriate code
      if (recommendation.decision === 'dont-build') {
        process.exit(1);
      }
      
    } catch (error) {
      spinner.stop();
      logError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

function clampScore(score: number): number {
  return Math.max(0, Math.min(5, score));
}

async function calculateAutoScores(feature: string, goal?: string): Promise<BATScores> {
  // Analyze feature name and goal to estimate scores
  const featureLower = feature.toLowerCase();
  const goalLower = goal?.toLowerCase() || '';
  
  let brand = 3;
  let attention = 3;
  let trust = 3;
  
  // Brand indicators
  const brandBoosters = ['brand', 'premium', 'luxury', 'quality', 'design', 'identity', 'logo'];
  const brandDiminishers = ['internal', 'admin', 'backend', 'utility', 'tool', 'migration'];
  
  for (const word of brandBoosters) {
    if (featureLower.includes(word) || goalLower.includes(word)) brand += 0.5;
  }
  for (const word of brandDiminishers) {
    if (featureLower.includes(word) || goalLower.includes(word)) brand -= 0.5;
  }
  
  // Attention indicators
  const attentionBoosters = ['viral', 'share', 'notification', 'alert', 'feed', 'social', 'trending', 'ai', 'ml'];
  const attentionDiminishers = ['bugfix', 'refactor', 'cleanup', 'docs', 'test', 'deprecated'];
  
  for (const word of attentionBoosters) {
    if (featureLower.includes(word) || goalLower.includes(word)) attention += 0.5;
  }
  for (const word of attentionDiminishers) {
    if (featureLower.includes(word) || goalLower.includes(word)) attention -= 0.5;
  }
  
  // Trust indicators
  const trustBoosters = ['security', 'privacy', 'verification', 'auth', 'encryption', 'compliance', 'gdpr'];
  const trustDiminishers = ['experimental', 'beta', 'alpha', 'hack', 'temp', 'workaround'];
  
  for (const word of trustBoosters) {
    if (featureLower.includes(word) || goalLower.includes(word)) trust += 0.5;
  }
  for (const word of trustDiminishers) {
    if (featureLower.includes(word) || goalLower.includes(word)) trust -= 0.5;
  }
  
  return {
    brand: clampScore(Math.round(brand)),
    attention: clampScore(Math.round(attention)),
    trust: clampScore(Math.round(trust)),
    total: clampScore(Math.round(brand)) + clampScore(Math.round(attention)) + clampScore(Math.round(trust))
  };
}

function generateRecommendation(
  scores: BATScores, 
  feature: string, 
  goal?: string
): Recommendation {
  const reasoning: string[] = [];
  const nextSteps: string[] = [];
  
  // 10-star methodology: need at least 2/3 categories at 2+ (total 6+)
  const minThreshold = 6;
  const strongThreshold = 10;
  
  const categoriesAtMin = [
    scores.brand >= 2,
    scores.attention >= 2,
    scores.trust >= 2
  ].filter(Boolean).length;
  
  // Determine decision
  let decision: 'build' | 'consider' | 'dont-build';
  
  if (scores.total >= strongThreshold && categoriesAtMin >= 2) {
    decision = 'build';
    reasoning.push('Strong alignment with BAT framework (10+ stars)');
    reasoning.push('Feature scores well across multiple dimensions');
    nextSteps.push('Prioritize in upcoming sprint');
    nextSteps.push('Assign product owner and define success metrics');
    nextSteps.push('Create detailed product requirements document');
  } else if (scores.total >= minThreshold && categoriesAtMin >= 2) {
    decision = 'consider';
    reasoning.push('Meets minimum threshold for building (6+ stars, 2/3 categories)');
    reasoning.push('Has potential but may need refinement');
    nextSteps.push('Conduct user research to validate assumptions');
    nextSteps.push('Identify quick wins to increase weaker scores');
    nextSteps.push('Re-evaluate after gathering more data');
  } else {
    decision = 'dont-build';
    reasoning.push('Does not meet minimum BAT threshold (need 6+ stars with 2/3 categories at 2+)');
    
    if (scores.brand < 2) {
      reasoning.push('Low brand impact - consider if this strengthens product identity');
    }
    if (scores.attention < 2) {
      reasoning.push('Low attention potential - may not engage users effectively');
    }
    if (scores.trust < 2) {
      reasoning.push('Low trust score - potential risk to user confidence');
    }
    
    nextSteps.push('Revisit feature definition and value proposition');
    nextSteps.push('Consider if feature should be redesigned or deprioritized');
    nextSteps.push('Focus engineering effort on higher-BAT features');
  }
  
  // Specific insights
  if (scores.brand >= 4) {
    reasoning.push('High brand impact - this feature differentiates your product');
  }
  if (scores.attention >= 4) {
    reasoning.push('Strong attention driver - users will engage with this');
  }
  if (scores.trust >= 4) {
    reasoning.push('Excellent trust builder - strengthens user confidence');
  }
  
  return { decision, reasoning, nextSteps };
}

function printReport(
  feature: string, 
  scores: BATScores, 
  rec: Recommendation, 
  goal?: string
): void {
  console.log('\n' + '='.repeat(60));
  console.log('  BAT FRAMEWORK PRODUCT STRATEGY REVIEW');
  console.log('='.repeat(60));
  console.log(`\n📋 Feature: ${feature}`);
  if (goal) console.log(`🎯 Goal: ${goal}`);
  
  console.log('\n📊 BAT Scores (0-5 each, 10-star methodology):');
  console.log(`   Brand:     ${renderBar(scores.brand)} ${scores.brand}/5`);
  console.log(`   Attention: ${renderBar(scores.attention)} ${scores.attention}/5`);
  console.log(`   Trust:     ${renderBar(scores.trust)} ${scores.trust}/5`);
  console.log(`   ─────────────────────────────`);
  console.log(`   TOTAL:     ${scores.total}/15 stars`);
  
  const decisionEmoji = {
    'build': '🟢 BUILD',
    'consider': '🟡 CONSIDER', 
    'dont-build': '🔴 DON\'T BUILD'
  };
  
  console.log(`\n${decisionEmoji[rec.decision]}`);
  
  console.log('\n💡 Reasoning:');
  for (const r of rec.reasoning) {
    console.log(`   • ${r}`);
  }
  
  console.log('\n📋 Recommended Next Steps:');
  for (const step of rec.nextSteps) {
    console.log(`   • ${step}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('  10-Star Threshold: 6+ total with 2/3 categories ≥2');
  console.log('='.repeat(60) + '\n');
}

function renderBar(score: number): string {
  const filled = '█'.repeat(score);
  const empty = '░'.repeat(5 - score);
  return filled + empty;
}

function generateMarkdownReport(
  feature: string, 
  scores: BATScores, 
  rec: Recommendation, 
  goal?: string
): string {
  const decisionColors = {
    'build': 'green',
    'consider': 'yellow',
    'dont-build': 'red'
  };
  
  return `# BAT Framework Review: ${feature}

**Date:** ${new Date().toISOString().split('T')[0]}
${goal ? `**Goal:** ${goal}` : ''}

## BAT Scores

| Category | Score | Max |
|----------|-------|-----|
| Brand | ${scores.brand} | 5 |
| Attention | ${scores.attention} | 5 |
| Trust | ${scores.trust} | 5 |
| **Total** | **${scores.total}** | **15** |

## Recommendation: ${rec.decision.toUpperCase()}

![${rec.decision}](https://img.shields.io/badge/decision-${rec.decision}-${decisionColors[rec.decision]})

### Reasoning

${rec.reasoning.map(r => `- ${r}`).join('\n')}

### Next Steps

${rec.nextSteps.map(s => `- [ ] ${s}`).join('\n')}

---

*Generated by OpenClaw Superpowers CEO Review*
`;
}
