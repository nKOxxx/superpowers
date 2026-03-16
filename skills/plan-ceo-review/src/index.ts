import { Command } from 'commander';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

interface CEOReviewOptions {
  audience?: string;
  competition?: string;
  trust?: string;
  brand?: string;
  attention?: string;
  trustScore?: string;
  json?: boolean;
  output?: string;
}

interface BATScores {
  brand: number;
  attention: number;
  trust: number;
  total: number;
}

interface ReviewResult {
  feature: string;
  goal: string;
  scores: BATScores;
  recommendation: 'BUILD' | 'CONSIDER' | 'DONT_BUILD';
  rationale: string[];
  nextSteps: string[];
}

const program = new Command();

program
  .name('ceo-review')
  .description('Product strategy review using BAT framework')
  .argument('<feature>', 'Feature name to evaluate')
  .argument('[goal]', 'Goal or hypothesis for the feature')
  .option('-a, --audience <text>', 'Target audience')
  .option('-c, --competition <text>', 'Competitors')
  .option('-t, --trust <text>', 'Trust assets you have')
  .option('--brand <score>', 'Manual brand score (0-5)')
  .option('--attention <score>', 'Manual attention score (0-5)')
  .option('--trust-score <score>', 'Manual trust score (0-5)')
  .option('-j, --json', 'Output as JSON', false)
  .option('-o, --output <path>', 'Save to file')
  .action(async (feature: string, goal: string = '', options: CEOReviewOptions) => {
    try {
      // Handle framework explanation command
      if (feature === 'framework') {
        printFrameworkExplanation();
        return;
      }

      // Calculate or use manual scores
      const scores: BATScores = {
        brand: options.brand ? parseInt(options.brand, 10) : calculateBrandScore(feature, options),
        attention: options.attention ? parseInt(options.attention, 10) : calculateAttentionScore(feature, options),
        trust: options.trustScore ? parseInt(options.trustScore, 10) : calculateTrustScore(feature, options),
        total: 0
      };
      
      scores.total = scores.brand + scores.attention + scores.trust;

      // Determine recommendation
      const recommendation = getRecommendation(scores.total);
      
      // Generate rationale
      const rationale = generateRationale(scores, feature, options);
      
      // Generate next steps
      const nextSteps = generateNextSteps(recommendation, feature);

      const result: ReviewResult = {
        feature,
        goal,
        scores,
        recommendation,
        rationale,
        nextSteps
      };

      // Output
      if (options.json) {
        const output = JSON.stringify(result, null, 2);
        if (options.output) {
          writeFileSync(options.output, output);
        }
        console.log(output);
      } else {
        printReview(result);
        
        if (options.output) {
          writeFileSync(options.output, JSON.stringify(result, null, 2));
          console.log(chalk.gray(`\n💾 Saved to ${options.output}`));
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: errorMessage
        }, null, 2));
      } else {
        console.error(chalk.red(`\n❌ Error: ${errorMessage}\n`));
      }
      
      process.exit(1);
    }
  });

function calculateBrandScore(feature: string, options: CEOReviewOptions): number {
  let score = 3; // Default middle score
  
  const feature_lower = feature.toLowerCase();
  
  // Innovation indicators
  const innovationKeywords = ['ai', 'ml', 'smart', 'intelligent', 'auto', 'predictive', 'advanced'];
  if (innovationKeywords.some(k => feature_lower.includes(k))) {
    score += 1;
  }
  
  // Differentiation indicators
  const differentiationKeywords = ['custom', 'unique', 'proprietary', 'exclusive'];
  if (differentiationKeywords.some(k => feature_lower.includes(k))) {
    score += 1;
  }
  
  // Table stakes (negative)
  const tableStakes = ['dark mode', 'notification', 'email', 'login', 'signup'];
  if (tableStakes.some(k => feature_lower.includes(k))) {
    score -= 1;
  }
  
  return Math.max(0, Math.min(5, score));
}

function calculateAttentionScore(feature: string, options: CEOReviewOptions): number {
  let score = 3; // Default middle score
  
  const feature_lower = feature.toLowerCase();
  
  // High frequency indicators
  const highFreqKeywords = ['dashboard', 'daily', 'workflow', 'core', 'main', 'home'];
  if (highFreqKeywords.some(k => feature_lower.includes(k))) {
    score += 1;
  }
  
  // User pain indicators
  if (options.audience) {
    score += 0.5;
  }
  
  // Competition (if no competition, higher attention potential)
  if (!options.competition) {
    score += 0.5;
  }
  
  // Mobile/app usually higher engagement
  if (feature_lower.includes('mobile') || feature_lower.includes('app')) {
    score += 0.5;
  }
  
  return Math.max(0, Math.min(5, Math.floor(score)));
}

function calculateTrustScore(feature: string, options: CEOReviewOptions): number {
  let score = 3; // Default middle score
  
  const feature_lower = feature.toLowerCase();
  
  // Security/privacy indicators
  const securityKeywords = ['security', 'privacy', 'encryption', '2fa', 'auth', 'verify'];
  if (securityKeywords.some(k => feature_lower.includes(k))) {
    score += 2;
  }
  
  // Existing trust assets
  if (options.trust) {
    const trust_lower = options.trust.toLowerCase();
    if (trust_lower.includes('soc2') || trust_lower.includes('iso') || trust_lower.includes('gdpr')) {
      score += 1;
    }
  }
  
  // Reliability indicators
  const reliabilityKeywords = ['backup', 'sync', 'recovery', 'uptime'];
  if (reliabilityKeywords.some(k => feature_lower.includes(k))) {
    score += 1;
  }
  
  return Math.max(0, Math.min(5, score));
}

function getRecommendation(total: number): 'BUILD' | 'CONSIDER' | 'DONT_BUILD' {
  if (total >= 10) return 'BUILD';
  if (total >= 8) return 'CONSIDER';
  return 'DONT_BUILD';
}

function generateRationale(scores: BATScores, feature: string, options: CEOReviewOptions): string[] {
  const rationale: string[] = [];
  
  // Brand rationale
  if (scores.brand >= 4) {
    rationale.push('Strong brand differentiation potential');
  } else if (scores.brand <= 2) {
    rationale.push('Limited brand impact - may be table stakes');
  }
  
  // Attention rationale
  if (scores.attention >= 4) {
    rationale.push('High user engagement potential');
  } else if (scores.attention <= 2) {
    rationale.push('Low usage frequency may limit impact');
  }
  
  // Trust rationale
  if (scores.trust >= 4) {
    rationale.push('Significant trust-building opportunity');
  } else if (scores.trust <= 2) {
    rationale.push('Consider trust implications carefully');
  }
  
  // Competition context
  if (options.competition) {
    rationale.push(`Competitive landscape: ${options.competition}`);
  }
  
  // Audience context
  if (options.audience) {
    rationale.push(`Target audience: ${options.audience}`);
  }
  
  return rationale;
}

function generateNextSteps(recommendation: string, feature: string): string[] {
  const steps: string[] = [];
  
  switch (recommendation) {
    case 'BUILD':
      steps.push('Define success metrics and KPIs');
      steps.push('Create detailed product spec');
      steps.push('Estimate engineering effort');
      steps.push('Prioritize in roadmap');
      break;
      
    case 'CONSIDER':
      steps.push('Gather more user feedback');
      steps.push('Analyze competitive positioning');
      steps.push('Validate assumptions with data');
      steps.push('Revisit in 2-4 weeks');
      break;
      
    case 'DONT_BUILD':
      steps.push('Document rationale for future reference');
      steps.push('Identify alternative solutions');
      steps.push('Focus resources on higher-priority features');
      break;
  }
  
  return steps;
}

function printReview(result: ReviewResult): void {
  const width = 50;
  const line = '═'.repeat(width);
  
  console.log(chalk.cyan(`\n${line}`));
  console.log(chalk.cyan(`  CEO REVIEW: ${result.feature.toUpperCase()}`));
  console.log(chalk.cyan(`${line}\n`));
  
  if (result.goal) {
    console.log(chalk.gray(`  Goal: ${result.goal}\n`));
  }
  
  console.log(chalk.white('  BAT Framework Scores:'));
  console.log(chalk.white(`    Brand:     ${renderScoreBar(result.scores.brand)} ${result.scores.brand}/5`));
  console.log(chalk.white(`    Attention: ${renderScoreBar(result.scores.attention)} ${result.scores.attention}/5`));
  console.log(chalk.white(`    Trust:     ${renderScoreBar(result.scores.trust)} ${result.scores.trust}/5`));
  console.log();
  console.log(chalk.white(`    BAT Total: ${chalk.bold(result.scores.total)}/15 stars\n`));
  
  const recColor = result.recommendation === 'BUILD' ? chalk.green : 
                   result.recommendation === 'CONSIDER' ? chalk.yellow : chalk.red;
  const recIcon = result.recommendation === 'BUILD' ? '✅' : 
                  result.recommendation === 'CONSIDER' ? '🤔' : '❌';
  
  console.log(chalk.white('  Recommendation: ') + recColor(`${recIcon} ${result.recommendation}`));
  console.log();
  
  console.log(chalk.white('  Rationale:'));
  for (const item of result.rationale) {
    console.log(chalk.gray(`    • ${item}`));
  }
  console.log();
  
  console.log(chalk.white('  Next Steps:'));
  for (let i = 0; i < result.nextSteps.length; i++) {
    console.log(chalk.gray(`    ${i + 1}. ${result.nextSteps[i]}`));
  }
  
  console.log(chalk.cyan(`\n${line}\n`));
}

function renderScoreBar(score: number): string {
  const filled = '█'.repeat(score);
  const empty = '░'.repeat(5 - score);
  return `[${filled}${empty}]`;
}

function printFrameworkExplanation(): void {
  console.log(chalk.cyan(`
╔════════════════════════════════════════════════════════════════╗
║                 THE BAT FRAMEWORK                              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Three dimensions scored 0-5 stars each:                       ║
║                                                                ║
║  BRAND (0-5)                                                   ║
║  • 5: Revolutionary, defines category, press-worthy            ║
║  • 4: Strong differentiation, innovative                       ║
║  • 3: Good fit, incremental improvement                        ║
║  • 2: Table stakes, me-too feature                             ║
║  • 1: Off-brand, confusing                                     ║
║                                                                ║
║  ATTENTION (0-5)                                               ║
║  • 5: Daily use, core workflow                                 ║
║  • 4: Weekly use, important workflow                           ║
║  • 3: Monthly use, nice-to-have                                ║
║  • 2: Rare use, edge case                                      ║
║  • 1: Nobody asked for this                                    ║
║                                                                ║
║  TRUST (0-5)                                                   ║
║  • 5: Security-critical, data protection                       ║
║  • 4: Reliability-critical, uptime essential                   ║
║  • 3: Transparency, user control                               ║
║  • 2: Error handling, feedback                                 ║
║  • 1: No trust impact                                          ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║  10-STAR METHODOLOGY                                           ║
║                                                                ║
║  12-15 ⭐ BUILD      - Strong signal, proceed with confidence  ║
║  10-11 ⭐ BUILD      - Good signal, validate assumptions       ║
║   8-9  ⭐ CONSIDER   - Mixed signal, need more data            ║
║   0-7  ⭐ DON'T BUILD - Weak signal, focus elsewhere           ║
║                                                                ║
║  Minimum threshold: 10/15 stars to build                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`));
}

program.parse();
