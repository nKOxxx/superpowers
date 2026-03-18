#!/usr/bin/env node
/**
 * plan-ceo-review.ts - Product strategy evaluation
 * 
 * Features:
 * - BAT framework (Brand, Attention, Trust)
 * - 10-star methodology for scoring
 * - Build vs buy analysis
 * - Structured recommendations
 * - Telegram notifications
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile } from 'fs/promises';
import { execSync } from 'child_process';

const program = new Command();

interface CEOOptions {
  framework?: 'bat' | '10star' | 'both';
  build?: string;
  buy?: string;
  timeline?: string;
  budget?: string;
  teamSize?: string;
  output?: string;
  format?: 'markdown' | 'json';
  telegram?: boolean;
}

// BAT Framework Scoring
interface BATScore {
  brand: number;
  attention: number;
  trust: number;
  details: {
    brand: string[];
    attention: string[];
    trust: string[];
  };
}

// 10-Star Methodology
interface TenStarScore {
  userImpact: number;
  strategicAlignment: number;
  technicalFeasibility: number;
  timeToMarket: number;
  resourceRequirements: number;
  competitiveAdvantage: number;
  riskLevel: number; // inverted (10 = low risk)
  scalability: number;
  maintainability: number;
  roiPotential: number;
}

program
  .name('plan-ceo-review')
  .description('Product strategy evaluation with BAT framework and 10-star methodology')
  .argument('<question>', 'strategic question to evaluate')
  .option('--framework <type>', 'analysis framework: bat, 10star, both', 'both')
  .option('--build <estimate>', 'build option estimate (e.g., "6mo, 2eng")')
  .option('--buy <estimate>', 'buy option estimate (e.g., "$50k/yr")')
  .option('--timeline <weeks>', 'project timeline in weeks')
  .option('--budget <amount>', 'budget constraint')
  .option('--team-size <n>', 'available team size')
  .option('-o, --output <file>', 'output file')
  .option('-f, --format <fmt>', 'output format', 'markdown')
  .option('--telegram', 'send summary to Telegram')
  .action(async (question: string, options: CEOOptions) => {
    const spinner = ora('Analyzing strategic question...').start();

    try {
      console.log(chalk.blue('\n📋 Question:'));
      console.log(chalk.white(question));
      console.log();

      let report: any = {
        question,
        timestamp: new Date().toISOString(),
        constraints: {
          timeline: options.timeline,
          budget: options.budget,
          teamSize: options.teamSize,
          buildEstimate: options.build,
          buyEstimate: options.buy
        }
      };

      // BAT Framework Analysis
      if (options.framework === 'bat' || options.framework === 'both') {
        spinner.text = 'Running BAT analysis...';
        report.bat = analyzeBAT(question, options);
        printBATAnalysis(report.bat);
      }

      // 10-Star Analysis
      if (options.framework === '10star' || options.framework === 'both') {
        spinner.text = 'Running 10-star analysis...';
        report.tenStar = analyzeTenStar(question, options);
        printTenStarAnalysis(report.tenStar);
      }

      // Build vs Buy Analysis
      if (options.build || options.buy) {
        spinner.text = 'Comparing build vs buy...';
        report.buildVsBuy = analyzeBuildVsBuy(options);
        printBuildVsBuy(report.buildVsBuy);
      }

      // Generate recommendation
      spinner.text = 'Generating recommendation...';
      report.recommendation = generateRecommendation(report);
      printRecommendation(report.recommendation);

      spinner.succeed('Analysis complete');

      // Output to file if requested
      if (options.output) {
        const content = options.format === 'json' 
          ? JSON.stringify(report, null, 2)
          : generateMarkdownReport(report);
        await writeFile(options.output, content);
        console.log(chalk.green(`\n✓ Report saved: ${options.output}`));
      }

      // Telegram notification
      if (options.telegram) {
        await sendTelegramSummary(report);
      }

    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

// BAT Framework Analysis
function analyzeBAT(question: string, options: CEOOptions): BATScore {
  const lowerQ = question.toLowerCase();
  
  // Brand analysis keywords
  const brandBoosters = ['brand', 'differentiation', 'unique', 'premium', 'positioning', 'category'];
  const brandRisks = ['commodity', 'me-too', 'generic', 'copycat'];
  
  // Attention analysis keywords  
  const attentionBoosters = ['viral', 'engagement', 'retention', 'growth', 'network', 'share'];
  const attentionRisks = ['boring', 'maintenance', 'invisible', 'backend'];
  
  // Trust analysis keywords
  const trustBoosters = ['security', 'privacy', 'reliable', 'proven', 'certified'];
  const trustRisks = ['risky', 'untested', 'experimental', 'third-party', 'external'];

  // Calculate scores based on question content (simplified heuristic)
  let brandScore = 5;
  let attentionScore = 5;
  let trustScore = 5;

  const brandDetails: string[] = [];
  const attentionDetails: string[] = [];
  const trustDetails: string[] = [];

  // Brand scoring
  brandBoosters.forEach(kw => {
    if (lowerQ.includes(kw)) {
      brandScore += 1;
      brandDetails.push(`Contains brand-positive element: ${kw}`);
    }
  });
  brandRisks.forEach(kw => {
    if (lowerQ.includes(kw)) {
      brandScore -= 1;
      brandDetails.push(`Contains brand risk: ${kw}`);
    }
  });

  // Attention scoring
  attentionBoosters.forEach(kw => {
    if (lowerQ.includes(kw)) {
      attentionScore += 1;
      attentionDetails.push(`Contains attention driver: ${kw}`);
    }
  });
  attentionRisks.forEach(kw => {
    if (lowerQ.includes(kw)) {
      attentionScore -= 1;
      attentionDetails.push(`Attention risk: ${kw}`);
    }
  });

  // Trust scoring
  trustBoosters.forEach(kw => {
    if (lowerQ.includes(kw)) {
      trustScore += 1;
      trustDetails.push(`Contains trust element: ${kw}`);
    }
  });
  trustRisks.forEach(kw => {
    if (lowerQ.includes(kw)) {
      trustScore -= 1;
      trustDetails.push(`Trust risk: ${kw}`);
    }
  });

  // Factor in build vs buy
  if (options.build && !options.buy) {
    brandScore += 1;
    brandDetails.push('Building in-house can differentiate brand');
    trustScore += 1;
    trustDetails.push('Owning the code builds trust');
  }
  if (options.buy && !options.build) {
    brandScore -= 0.5;
    brandDetails.push('Buying may commoditize the solution');
    trustScore += 0.5;
    trustDetails.push('Vendor reliability provides trust');
  }

  return {
    brand: Math.min(10, Math.max(1, brandScore)),
    attention: Math.min(10, Math.max(1, attentionScore)),
    trust: Math.min(10, Math.max(1, trustScore)),
    details: {
      brand: brandDetails.length ? brandDetails : ['Neutral brand impact'],
      attention: attentionDetails.length ? attentionDetails : ['Moderate attention potential'],
      trust: trustDetails.length ? trustDetails : ['Standard trust profile']
    }
  };
}

function printBATAnalysis(bat: BATScore): void {
  console.log(chalk.bold('\n🏢 BAT Framework Analysis\n'));
  
  const printScore = (label: string, score: number, details: string[]) => {
    const color = score >= 7 ? chalk.green : score >= 4 ? chalk.yellow : chalk.red;
    const bar = '█'.repeat(Math.round(score)) + '░'.repeat(10 - Math.round(score));
    console.log(`${label}: ${color(score.toFixed(1))}/10 ${color(bar)}`);
    details.forEach(d => console.log(chalk.gray(`  • ${d}`)));
    console.log();
  };

  printScore('Brand       ', bat.brand, bat.details.brand);
  printScore('Attention   ', bat.attention, bat.details.attention);
  printScore('Trust       ', bat.trust, bat.details.trust);

  const avg = (bat.brand + bat.attention + bat.trust) / 3;
  console.log(chalk.bold(`BAT Average: ${avg >= 7 ? chalk.green(avg.toFixed(1)) : avg >= 4 ? chalk.yellow(avg.toFixed(1)) : chalk.red(avg.toFixed(1))}/10\n`));
}

// 10-Star Analysis
function analyzeTenStar(question: string, options: CEOOptions): TenStarScore {
  const lowerQ = question.toLowerCase();
  
  // Heuristic scoring based on keywords and options
  const scoreFactors: Record<string, { boost: string[]; risk: string[] }> = {
    userImpact: { 
      boost: ['user', 'customer', 'experience', 'ux', 'solve'], 
      risk: ['internal', 'admin', 'tool', 'infrastructure'] 
    },
    strategicAlignment: { 
      boost: ['mission', 'vision', 'core', 'strategic'], 
      risk: ['side', 'temporary', 'experiment'] 
    },
    technicalFeasibility: { 
      boost: ['simple', 'proven', 'standard'], 
      risk: ['complex', 'bleeding-edge', 'unproven'] 
    },
    timeToMarket: { 
      boost: ['quick', 'fast', 'mvp'], 
      risk: ['long', 'research', 'foundation'] 
    },
    resourceRequirements: { 
      boost: ['small', 'efficient', 'automated'], 
      risk: ['large', 'team', 'hiring'] 
    },
    competitiveAdvantage: { 
      boost: ['differentiation', 'unique', 'moat', 'exclusive'], 
      risk: ['commodity', 'table-stakes', 'standard'] 
    },
    riskLevel: { 
      boost: ['proven', 'safe', 'gradual'], 
      risk: ['risky', 'bold', 'pivot', 'experimental'] 
    },
    scalability: { 
      boost: ['scale', 'platform', 'infrastructure'], 
      risk: ['manual', 'custom', 'one-off'] 
    },
    maintainability: { 
      boost: ['simple', 'clean', 'documented'], 
      risk: ['complex', 'legacy', 'technical-debt'] 
    },
    roiPotential: { 
      boost: ['revenue', 'growth', 'efficiency', 'cost-saving'], 
      risk: ['cost', 'investment', 'expense'] 
    }
  };

  const scores: any = {};
  
  for (const [key, factors] of Object.entries(scoreFactors)) {
    let score = 5;
    factors.boost.forEach(kw => { if (lowerQ.includes(kw)) score += 0.5; });
    factors.risk.forEach(kw => { if (lowerQ.includes(kw)) score -= 0.5; });
    
    // Adjust based on constraints
    if (key === 'timeToMarket' && options.timeline) {
      const weeks = parseInt(options.timeline);
      if (weeks < 4) score += 2;
      else if (weeks > 12) score -= 1;
    }
    
    if (key === 'resourceRequirements' && options.teamSize) {
      const size = parseInt(options.teamSize);
      if (size <= 2) score += 1;
      else if (size >= 5) score -= 1;
    }
    
    if (key === 'technicalFeasibility' && options.build) {
      score += 0.5; // Building = more feasible technically
    }
    
    scores[key] = Math.min(10, Math.max(1, score));
  }

  return scores as TenStarScore;
}

function printTenStarAnalysis(star: TenStarScore): void {
  console.log(chalk.bold('\n⭐ 10-Star Methodology\n'));
  
  const categories = [
    ['User Impact', star.userImpact],
    ['Strategic Alignment', star.strategicAlignment],
    ['Technical Feasibility', star.technicalFeasibility],
    ['Time to Market', star.timeToMarket],
    ['Resource Requirements', star.resourceRequirements],
    ['Competitive Advantage', star.competitiveAdvantage],
    ['Risk Level', star.riskLevel],
    ['Scalability', star.scalability],
    ['Maintainability', star.maintainability],
    ['ROI Potential', star.roiPotential]
  ];

  categories.forEach(([name, score]) => {
    const color = score >= 7 ? chalk.green : score >= 4 ? chalk.yellow : chalk.red;
    const bar = '█'.repeat(Math.round(score)) + '░'.repeat(10 - Math.round(score));
    console.log(`${(name as string).padEnd(22)} ${color((score as number).toFixed(1))}/10 ${color(bar)}`);
  });

  const avg = Object.values(star).reduce((a, b) => a + b, 0) / 10;
  console.log(chalk.bold(`\nOverall Score: ${avg >= 7 ? chalk.green(avg.toFixed(1)) : avg >= 4 ? chalk.yellow(avg.toFixed(1)) : chalk.red(avg.toFixed(1))}/10\n`));
}

// Build vs Buy Analysis
function analyzeBuildVsBuy(options: CEOOptions): any {
  const buildScore = options.build ? calculateEstimateScore(options.build) : null;
  const buyScore = options.buy ? calculateEstimateScore(options.buy) : null;
  
  return {
    build: {
      estimate: options.build,
      score: buildScore,
      pros: ['Full control', 'Custom fit', 'IP ownership', 'No vendor lock-in'],
      cons: ['Time to build', 'Maintenance burden', 'Resource intensive', 'Risk of delays']
    },
    buy: {
      estimate: options.buy,
      score: buyScore,
      pros: ['Fast deployment', 'Proven solution', 'Support included', 'Predictable cost'],
      cons: ['Vendor dependency', 'Limited customization', 'Ongoing costs', 'Integration complexity']
    },
    recommendation: buildScore && buyScore 
      ? (buildScore > buyScore ? 'build' : 'buy')
      : buildScore ? 'build' : buyScore ? 'buy' : 'undetermined'
  };
}

function calculateEstimateScore(estimate: string): number {
  // Simple scoring based on estimate string
  let score = 5;
  
  // Parse time
  const months = estimate.match(/(\d+)\s*mo/i);
  if (months) {
    const m = parseInt(months[1]);
    if (m <= 1) score += 3;
    else if (m <= 3) score += 1;
    else if (m <= 6) score -= 1;
    else score -= 3;
  }
  
  // Parse engineers
  const engineers = estimate.match(/(\d+)\s*eng/i);
  if (engineers) {
    const e = parseInt(engineers[1]);
    if (e <= 1) score += 2;
    else if (e <= 2) score += 0;
    else score -= 2;
  }
  
  // Parse cost
  const cost = estimate.match(/\$(\d+)k/i);
  if (cost) {
    const k = parseInt(cost[1]);
    if (k <= 10) score += 2;
    else if (k <= 50) score += 0;
    else score -= 2;
  }
  
  return Math.min(10, Math.max(1, score));
}

function printBuildVsBuy(analysis: any): void {
  console.log(chalk.bold('\n🔨 Build vs Buy Analysis\n'));
  
  if (analysis.build.estimate) {
    console.log(chalk.cyan('Build Option:'));
    console.log(`  Estimate: ${analysis.build.estimate}`);
    console.log(`  Score: ${analysis.build.score}/10`);
    console.log(chalk.green('  Pros:') + ` ${analysis.build.pros.join(', ')}`);
    console.log(chalk.red('  Cons:') + ` ${analysis.build.cons.join(', ')}`);
    console.log();
  }
  
  if (analysis.buy.estimate) {
    console.log(chalk.cyan('Buy Option:'));
    console.log(`  Estimate: ${analysis.buy.estimate}`);
    console.log(`  Score: ${analysis.buy.score}/10`);
    console.log(chalk.green('  Pros:') + ` ${analysis.buy.pros.join(', ')}`);
    console.log(chalk.red('  Cons:') + ` ${analysis.buy.cons.join(', ')}`);
    console.log();
  }
  
  const rec = analysis.recommendation;
  console.log(chalk.bold(`Recommendation: ${rec === 'build' ? chalk.green('BUILD') : rec === 'buy' ? chalk.blue('BUY') : chalk.yellow('UNDETERMINED')}\n`));
}

// Generate final recommendation
function generateRecommendation(report: any): any {
  const factors: string[] = [];
  let confidence = 'medium';
  let verdict = 'proceed';
  
  // Factor in BAT scores
  if (report.bat) {
    const batAvg = (report.bat.brand + report.bat.attention + report.bat.trust) / 3;
    if (batAvg >= 7) {
      factors.push('Strong BAT scores indicate strategic value');
      verdict = 'proceed';
    } else if (batAvg <= 4) {
      factors.push('Low BAT scores suggest reconsidering');
      verdict = 'reconsider';
    }
  }
  
  // Factor in 10-star
  if (report.tenStar) {
    const starAvg = Object.values(report.tenStar).reduce((a: number, b: number) => a + b, 0) / 10;
    if (starAvg >= 8) {
      factors.push('Excellent 10-star rating');
      confidence = 'high';
    } else if (starAvg <= 4) {
      factors.push('Poor 10-star rating - high risk');
      verdict = 'reconsider';
      confidence = 'high';
    }
  }
  
  // Factor in build vs buy
  if (report.buildVsBuy) {
    factors.push(`Build vs Buy analysis favors: ${report.buildVsBuy.recommendation}`);
  }
  
  // Factor in constraints
  if (report.constraints.timeline) {
    const weeks = parseInt(report.constraints.timeline);
    if (weeks < 4) {
      factors.push('Aggressive timeline - consider MVP approach');
    }
  }
  
  return {
    verdict,
    confidence,
    factors,
    nextSteps: generateNextSteps(verdict, report)
  };
}

function generateNextSteps(verdict: string, report: any): string[] {
  const steps: string[] = [];
  
  if (verdict === 'proceed') {
    steps.push('Draft detailed project proposal');
    steps.push('Identify key stakeholders');
    steps.push('Create timeline and milestones');
    if (report.buildVsBuy?.recommendation === 'build') {
      steps.push('Prepare technical design document');
    } else if (report.buildVsBuy?.recommendation === 'buy') {
      steps.push('Research and evaluate vendors');
    }
  } else if (verdict === 'reconsider') {
    steps.push('Revisit assumptions and constraints');
    steps.push('Consider alternative approaches');
    steps.push('Gather more data on user needs');
  }
  
  return steps;
}

function printRecommendation(rec: any): void {
  console.log(chalk.bold('\n📊 Final Recommendation\n'));
  
  const verdictColor = rec.verdict === 'proceed' ? chalk.green : rec.verdict === 'reconsider' ? chalk.red : chalk.yellow;
  console.log(`Verdict: ${verdictColor(rec.verdict.toUpperCase())}`);
  console.log(`Confidence: ${rec.confidence}`);
  
  console.log(chalk.bold('\nKey Factors:'));
  rec.factors.forEach((f: string) => console.log(`  • ${f}`));
  
  console.log(chalk.bold('\nNext Steps:'));
  rec.nextSteps.forEach((s: string) => console.log(`  → ${s}`));
  console.log();
}

// Generate markdown report
function generateMarkdownReport(report: any): string {
  return `# Strategic Review: ${report.question}

**Date:** ${new Date(report.timestamp).toLocaleDateString()}  
**Frameworks:** BAT + 10-Star Methodology

## Summary

**Verdict:** ${report.recommendation.verdict.toUpperCase()}  
**Confidence:** ${report.recommendation.confidence}

## BAT Analysis

| Dimension | Score | Details |
|-----------|-------|---------|
| Brand | ${report.bat?.brand}/10 | ${report.bat?.details.brand.join(', ')} |
| Attention | ${report.bat?.attention}/10 | ${report.bat?.details.attention.join(', ')} |
| Trust | ${report.bat?.trust}/10 | ${report.bat?.details.trust.join(', ')} |

## 10-Star Rating

| Category | Score |
|----------|-------|
${Object.entries(report.tenStar || {}).map(([k, v]) => `| ${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} | ${v}/10 |`).join('\n')}

## Next Steps

${report.recommendation.nextSteps.map((s: string) => `- ${s}`).join('\n')}

---
*Generated by OpenClaw plan-ceo-review*
`;
}

// Send Telegram summary
async function sendTelegramSummary(report: any): Promise<void> {
  try {
    const batAvg = report.bat ? ((report.bat.brand + report.bat.attention + report.bat.trust) / 3).toFixed(1) : 'N/A';
    const starAvg = report.tenStar ? (Object.values(report.tenStar).reduce((a: number, b: number) => a + b, 0) / 10).toFixed(1) : 'N/A';
    
    const message = `
📊 Strategic Review: ${report.recommendation.verdict.toUpperCase()}

Q: ${report.question.slice(0, 100)}${report.question.length > 100 ? '...' : ''}

🏢 BAT: ${batAvg}/10
⭐ 10-Star: ${starAvg}/10

${report.recommendation.factors[0] || ''}
    `.trim();

    execSync(`openclaw message send --channel telegram --message "${message}"`, {
      stdio: 'pipe'
    });
  } catch (error) {
    console.log(chalk.yellow('Failed to send Telegram notification'));
  }
}

program.parse();
