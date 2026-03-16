#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { PlanCEOOptions } from '../shared/types.js';
import { loadConfig, Logger, ensureDir, slugify, parseArgs } from '../shared/utils.js';

const logger = new Logger();

interface BATScore {
  brand: number;
  attention: number;
  trust: number;
  overall: number;
  reasoning: {
    brand: string;
    attention: string;
    trust: string;
  };
}

interface TenStarScore {
  problemClarity: number;
  userDesire: number;
  effortEfficiency: number;
  strategicFit: number;
  competitiveMoat: number;
  total: number;
}

interface Alternative {
  name: string;
  effort: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  batScore: number;
  description: string;
}

interface Risk {
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

interface CEOReviewResult {
  question: string;
  feature: string;
  recommendation: 'BUILD' | 'PIVOT' | 'DONT_BUILD';
  confidence: number;
  problem: {
    stated: string;
    root: string;
    realNeed: string;
  };
  batScore: BATScore;
  tenStarScore: TenStarScore;
  alternatives: Alternative[];
  mvp: {
    description: string;
    effort: string;
    value: string;
  };
  risks: Risk[];
  successMetrics: string[];
  nextSteps: string[];
}

async function runCEOReview(options: PlanCEOOptions): Promise<CEOReviewResult> {
  const config = await loadConfig();
  
  const question = options.question || '';
  const feature = options.feature || extractFeatureName(question);
  const goal = options.goal || '';
  const problem = options.problem || '';
  const solution = options.solution || '';
  
  logger.section('CEO Review');
  logger.log(`Evaluating: ${chalk.cyan(feature || question)}\n`);
  
  // 1. Problem Analysis
  logger.section('Problem Analysis');
  const problemAnalysis = analyzeProblem(question, problem, goal);
  logger.log(`Stated: ${problemAnalysis.stated}`);
  logger.log(`Root: ${problemAnalysis.root}`);
  logger.log(`Real need: ${problemAnalysis.realNeed}`);
  
  // 2. BAT Score
  logger.section('BAT Framework');
  const batScore = calculateBATScore(question, feature, goal, problem);
  logger.log(`Brand: ${batScore.brand}/10 - ${batScore.reasoning.brand.substring(0, 60)}...`);
  logger.log(`Attention: ${batScore.attention}/10 - ${batScore.reasoning.attention.substring(0, 60)}...`);
  logger.log(`Trust: ${batScore.trust}/10 - ${batScore.reasoning.trust.substring(0, 60)}...`);
  logger.log(chalk.bold(`Overall BAT: ${batScore.overall}/10`));
  
  // 3. 10-Star Score
  logger.section('10-Star Product Score');
  const tenStarScore = calculateTenStarScore(question, feature, goal, problem, solution);
  logger.log(`Problem Clarity: ${tenStarScore.problemClarity}/10`);
  logger.log(`User Desire: ${tenStarScore.userDesire}/10`);
  logger.log(`Effort Efficiency: ${tenStarScore.effortEfficiency}/10`);
  logger.log(`Strategic Fit: ${tenStarScore.strategicFit}/10`);
  logger.log(`Competitive Moat: ${tenStarScore.competitiveMoat}/10`);
  logger.log(chalk.bold(`Total: ${tenStarScore.total}/50`));
  
  // 4. Generate alternatives
  const alternatives = generateAlternatives(question, feature, solution);
  
  // 5. Determine recommendation
  const { recommendation, confidence } = determineRecommendation(batScore, tenStarScore);
  
  // 6. Generate MVP proposal
  const mvp = generateMVP(feature, question, solution);
  
  // 7. Identify risks
  const risks = identifyRisks(feature, question, batScore, tenStarScore);
  
  // 8. Define success metrics
  const successMetrics = defineSuccessMetrics(feature, goal);
  
  // 9. Define next steps
  const nextSteps = defineNextSteps(recommendation, feature);
  
  const result: CEOReviewResult = {
    question,
    feature: feature || 'Unnamed Feature',
    recommendation,
    confidence,
    problem: problemAnalysis,
    batScore,
    tenStarScore,
    alternatives,
    mvp,
    risks,
    successMetrics,
    nextSteps,
  };
  
  // Save to memory if requested
  if (options.save !== false) {
    await saveReview(result);
  }
  
  return result;
}

function extractFeatureName(question: string): string {
  // Extract feature name from question like "Should we build X?"
  const match = question.match(/(?:build|add|create|implement)\s+(.+?)(?:\?|$)/i);
  return match ? match[1].trim() : 'Unnamed Feature';
}

function analyzeProblem(question: string, statedProblem: string, goal: string): { stated: string; root: string; realNeed: string } {
  const stated = statedProblem || question || 'Not clearly stated';
  
  // Analyze for root cause
  let root = stated;
  if (stated.includes('notification') || stated.includes('alert')) {
    root = 'Users need timely information without manual checking';
  } else if (stated.includes('mobile') || stated.includes('app')) {
    root = 'Users need access on-the-go where desktop is impractical';
  } else if (stated.includes('API') || stated.includes('integration')) {
    root = 'Users want to connect this with their existing workflows';
  } else if (stated.includes('dashboard') || stated.includes('analytics')) {
    root = 'Users need visibility into their data to make decisions';
  } else {
    root = 'Users need a more efficient way to achieve their goals';
  }
  
  // Real need is usually emotional/practical
  let realNeed = root;
  if (root.includes('without manual checking')) {
    realNeed = 'Confidence in timely information delivery (peace of mind)';
  } else if (root.includes('on-the-go')) {
    realNeed = 'Flexibility and control regardless of location';
  } else if (root.includes('workflows')) {
    realNeed = 'Reduced friction and automation of repetitive tasks';
  } else if (root.includes('visibility')) {
    realNeed = 'Sense of control and ability to demonstrate value';
  }
  
  return { stated, root, realNeed };
}

function calculateBATScore(question: string, feature: string, goal: string, problem: string): BATScore {
  const text = `${question} ${feature} ${goal} ${problem}`.toLowerCase();
  
  // Brand alignment
  let brand = 7;
  let brandReasoning = 'Moderate alignment with core mission';
  
  if (text.includes('security') || text.includes('privacy') || text.includes('trust')) {
    brand = 9;
    brandReasoning = 'Strong brand alignment - builds on trust core value';
  } else if (text.includes('ai') || text.includes('automation') || text.includes('intelligent')) {
    brand = 8;
    brandReasoning = 'Good alignment with innovation focus';
  } else if (text.includes('ads') || text.includes('tracking') || text.includes('data sell')) {
    brand = 3;
    brandReasoning = 'Poor alignment - conflicts with privacy-first values';
  }
  
  // Attention
  let attention = 7;
  let attentionReasoning = 'Moderate user engagement expected';
  
  if (text.includes('notification') || text.includes('alert') || text.includes('email')) {
    attention = 8;
    attentionReasoning = 'High attention potential - pushes to user';
  } else if (text.includes('api') || text.includes('integration')) {
    attention = 6;
    attentionReasoning = 'Lower direct attention but high utility for power users';
  } else if (text.includes('mobile') || text.includes('app')) {
    attention = 9;
    attentionReasoning = 'Very high attention - users check mobile frequently';
  }
  
  // Trust
  let trust = 7;
  let trustReasoning = 'Neutral impact on trust';
  
  if (text.includes('encryption') || text.includes('secure') || text.includes('verify')) {
    trust = 9;
    trustReasoning = 'Builds trust through security focus';
  } else if (text.includes('notification') && text.includes('spam')) {
    trust = 4;
    trustReasoning = 'Risk of notification fatigue eroding trust';
  } else if (text.includes('ai') && text.includes('decision')) {
    trust = 6;
    trustReasoning = 'Some risk if AI makes wrong decisions for users';
  }
  
  return {
    brand,
    attention,
    trust,
    overall: Math.round((brand + attention + trust) / 3),
    reasoning: {
      brand: brandReasoning,
      attention: attentionReasoning,
      trust: trustReasoning,
    },
  };
}

function calculateTenStarScore(question: string, feature: string, goal: string, problem: string, solution: string): TenStarScore {
  const text = `${question} ${feature} ${goal} ${problem} ${solution}`.toLowerCase();
  
  // Problem Clarity (how well defined is the problem?)
  let problemClarity = 7;
  if (problem && problem.length > 20) problemClarity = 8;
  if (goal && goal.length > 10) problemClarity = 9;
  if (!problem && !question) problemClarity = 4;
  
  // User Desire (do users actually want this?)
  let userDesire = 7;
  if (text.includes('requested') || text.includes('asked') || text.includes('feedback')) userDesire = 9;
  if (text.includes('mobile') || text.includes('app')) userDesire = 9;
  if (text.includes('api')) userDesire = 6; // Only power users want APIs
  if (text.includes('assume') || text.includes('think')) userDesire = 5;
  
  // Effort Efficiency (value per engineering hour)
  let effortEfficiency = 7;
  if (text.includes('simple') || text.includes('easy') || text.includes('quick')) effortEfficiency = 9;
  if (text.includes('complex') || text.includes('platform') || text.includes('rewrite')) effortEfficiency = 4;
  if (text.includes('integration') && text.includes('existing')) effortEfficiency = 8;
  
  // Strategic Fit
  let strategicFit = 7;
  if (text.includes('core') || text.includes('main') || text.includes('primary')) strategicFit = 9;
  if (text.includes('experiment') || text.includes('test')) strategicFit = 6;
  if (text.includes('side') || text.includes('nice to have')) strategicFit = 4;
  
  // Competitive Moat (hard to copy?)
  let competitiveMoat = 5;
  if (text.includes('data') || text.includes('network') || text.includes('community')) competitiveMoat = 8;
  if (text.includes('algorithm') || text.includes('ai') || text.includes('ml')) competitiveMoat = 7;
  if (text.includes('ui') || text.includes('design') || text.includes('notification')) competitiveMoat = 3;
  
  return {
    problemClarity,
    userDesire,
    effortEfficiency,
    strategicFit,
    competitiveMoat,
    total: problemClarity + userDesire + effortEfficiency + strategicFit + competitiveMoat,
  };
}

function generateAlternatives(question: string, feature: string, solution: string): Alternative[] {
  const alternatives: Alternative[] = [];
  const text = `${question} ${feature} ${solution}`.toLowerCase();
  
  // Generate contextually relevant alternatives
  if (text.includes('notification') || text.includes('alert')) {
    alternatives.push(
      { name: 'Email notifications', effort: 'Low', impact: 'Medium', batScore: 6, description: 'Lower engagement but broader reach' },
      { name: 'In-app notifications only', effort: 'Low', impact: 'Low', batScore: 5, description: 'Simple but requires user to open app' },
      { name: 'Digest emails (weekly)', effort: 'Medium', impact: 'Medium', batScore: 7, description: 'Batch notifications to reduce fatigue' },
    );
  } else if (text.includes('mobile') || text.includes('app')) {
    alternatives.push(
      { name: 'Progressive Web App', effort: 'Low', impact: 'High', batScore: 8, description: 'Mobile experience without app store' },
      { name: 'Responsive web improvements', effort: 'Low', impact: 'Medium', batScore: 6, description: 'Improve mobile web experience first' },
      { name: 'Mobile-optimized emails', effort: 'Low', impact: 'Low', batScore: 5, description: 'Quick win for mobile users' },
    );
  } else if (text.includes('api') || text.includes('integration')) {
    alternatives.push(
      { name: 'Webhook support', effort: 'Medium', impact: 'High', batScore: 8, description: 'Let users build their own integrations' },
      { name: 'Zapier integration', effort: 'Low', impact: 'Medium', batScore: 7, description: 'Connect to 5000+ apps without API work' },
      { name: 'Export functionality', effort: 'Low', impact: 'Low', batScore: 5, description: 'Manual data export as first step' },
    );
  } else {
    // Generic alternatives
    alternatives.push(
      { name: 'Manual process', effort: 'Low', impact: 'Low', batScore: 4, description: 'Do it manually to validate need first' },
      { name: 'Third-party tool', effort: 'Low', impact: 'Medium', batScore: 6, description: 'Use existing solution, integrate later' },
      { name: 'MVP version', effort: 'Low', impact: 'High', batScore: 8, description: 'Build core value in 1-2 days' },
    );
  }
  
  return alternatives;
}

function determineRecommendation(batScore: BATScore, tenStarScore: TenStarScore): { recommendation: 'BUILD' | 'PIVOT' | 'DONT_BUILD'; confidence: number } {
  const bat = batScore.overall;
  const stars = tenStarScore.total;
  
  if (stars >= 40 && bat >= 7) {
    return { recommendation: 'BUILD', confidence: 85 };
  } else if (stars >= 35 && bat >= 6) {
    return { recommendation: 'PIVOT', confidence: 70 };
  } else if (stars >= 30 && bat >= 5) {
    return { recommendation: 'PIVOT', confidence: 60 };
  } else {
    return { recommendation: 'DONT_BUILD', confidence: 75 };
  }
}

function generateMVP(feature: string, question: string, solution: string): { description: string; effort: string; value: string } {
  const text = `${feature} ${question} ${solution}`.toLowerCase();
  
  let description = 'Start with core functionality for a single use case';
  let effort = '1-2 days';
  let value = '70-80%';
  
  if (text.includes('notification')) {
    description = 'Start with critical alerts only (errors, security) - skip marketing/updates';
    effort = '1 day';
    value = '80%';
  } else if (text.includes('mobile')) {
    description = 'Build PWA with core read-only features first';
    effort = '2-3 days';
    value = '70%';
  } else if (text.includes('api')) {
    description = 'Start with read-only endpoints for most-requested data';
    effort = '2 days';
    value = '75%';
  } else if (text.includes('dashboard')) {
    description = 'Single most important metric with date range selector';
    effort = '1-2 days';
    value = '70%';
  }
  
  return { description, effort, value };
}

function identifyRisks(feature: string, question: string, batScore: BATScore, tenStarScore: TenStarScore): Risk[] {
  const risks: Risk[] = [];
  const text = `${feature} ${question}`.toLowerCase();
  
  if (text.includes('notification')) {
    risks.push({
      description: 'Notification fatigue leading to churn',
      severity: 'Medium',
      mitigation: 'Smart batching, user preferences, frequency caps',
    });
  }
  
  if (text.includes('mobile') || text.includes('app')) {
    risks.push({
      description: 'High maintenance burden (iOS + Android + updates)',
      severity: 'High',
      mitigation: 'Start with PWA, use React Native if native needed',
    });
  }
  
  if (tenStarScore.competitiveMoat < 5) {
    risks.push({
      description: 'Easy for competitors to copy',
      severity: 'Medium',
      mitigation: 'Build data/network effects or move upmarket',
    });
  }
  
  if (batScore.trust < 6) {
    risks.push({
      description: 'Could erode user trust',
      severity: 'High',
      mitigation: 'Extensive user testing, clear value proposition',
    });
  }
  
  if (risks.length === 0) {
    risks.push({
      description: 'Scope creep during implementation',
      severity: 'Medium',
      mitigation: 'Strict MVP definition, timebox development',
    });
  }
  
  return risks;
}

function defineSuccessMetrics(feature: string, goal: string): string[] {
  const metrics: string[] = [];
  const text = `${feature} ${goal}`.toLowerCase();
  
  if (text.includes('notification') || text.includes('alert')) {
    metrics.push('50% opt-in rate within 2 weeks');
    metrics.push('<5% unsubscribe rate');
    metrics.push('User satisfaction >4/5');
  } else if (text.includes('mobile') || text.includes('app')) {
    metrics.push('30% of sessions from mobile within 1 month');
    metrics.push('App store rating >4.0');
    metrics.push('Mobile retention within 10% of desktop');
  } else if (text.includes('api')) {
    metrics.push('10+ integrations built by users within 1 month');
    metrics.push('<1% error rate on API calls');
    metrics.push('Documentation NPS >7');
  } else {
    metrics.push('Adoption by 50% of target users within 2 weeks');
    metrics.push('Positive feedback from 5+ beta users');
    metrics.push('No increase in support tickets');
  }
  
  return metrics;
}

function defineNextSteps(recommendation: 'BUILD' | 'PIVOT' | 'DONT_BUILD', feature: string): string[] {
  if (recommendation === 'BUILD') {
    return [
      `1. Build MVP with simplified scope`,
      `2. Deploy to 10-20 beta users`,
      `3. Gather feedback for 1 week`,
      `4. Iterate based on feedback`,
      `5. Full rollout if metrics met`,
    ];
  } else if (recommendation === 'PIVOT') {
    return [
      `1. Consider the alternative with higher BAT score`,
      `2. Validate the simplified approach with 3-5 users`,
      `3. Re-run CEO review with updated proposal`,
    ];
  } else {
    return [
      `1. Do not build this feature`,
      `2. Document the decision and reasoning`,
      `3. Monitor for changing circumstances`,
      `4. Focus resources on higher-priority items`,
    ];
  }
}

async function saveReview(result: CEOReviewResult): Promise<void> {
  const memoryDir = path.join(process.cwd(), 'memory', 'ceo-reviews');
  ensureDir(memoryDir);
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${slugify(result.feature)}.md`;
  const filepath = path.join(memoryDir, filename);
  
  const content = generateMarkdownReport(result);
  
  await fs.writeFile(filepath, content);
  logger.success(`\n💾 Saved to ${filepath}`);
}

function generateMarkdownReport(result: CEOReviewResult): string {
  return `# CEO Review: ${result.feature}

**Date:** ${new Date().toISOString().split('T')[0]}  
**Question:** ${result.question || 'N/A'}

## Recommendation: ${result.recommendation}

**Confidence:** ${result.confidence}%

---

## Problem Analysis

| Level | Description |
|-------|-------------|
| **Stated** | ${result.problem.stated} |
| **Root Cause** | ${result.problem.root} |
| **Real Need** | ${result.problem.realNeed} |

---

## BAT Framework Score: ${result.batScore.overall}/10

| Factor | Score | Reasoning |
|--------|-------|-----------|
| Brand | ${result.batScore.brand}/10 | ${result.batScore.reasoning.brand} |
| Attention | ${result.batScore.attention}/10 | ${result.batScore.reasoning.attention} |
| Trust | ${result.batScore.trust}/10 | ${result.batScore.reasoning.trust} |

---

## 10-Star Product Score: ${result.tenStarScore.total}/50

| Factor | Score |
|--------|-------|
| Problem Clarity | ${result.tenStarScore.problemClarity}/10 |
| User Desire | ${result.tenStarScore.userDesire}/10 |
| Effort Efficiency | ${result.tenStarScore.effortEfficiency}/10 |
| Strategic Fit | ${result.tenStarScore.strategicFit}/10 |
| Competitive Moat | ${result.tenStarScore.competitiveMoat}/10 |
| **Total** | **${result.tenStarScore.total}/50** |

---

## Alternatives Considered

${result.alternatives.map(alt => `- **${alt.name}** (${alt.effort} effort, ${alt.impact} impact) BAT: ${alt.batScore}/10\n  ${alt.description}`).join('\n\n')}

---

## Simplified MVP

${result.mvp.description}

- **Effort:** ${result.mvp.effort}
- **Value:** ${result.mvp.value} of full solution

---

## Key Risks

${result.risks.map(risk => `- **${risk.description}** (${risk.severity} severity)\n  - Mitigation: ${risk.mitigation}`).join('\n\n')}

---

## Success Metrics

${result.successMetrics.map(m => `- ${m}`).join('\n')}

---

## Next Steps

${result.nextSteps.join('\n')}
`;
}

function generateConsoleReport(result: CEOReviewResult): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold(`\n👔 CEO Review: "${result.feature}"\n`));
  
  // Recommendation
  const recColor = result.recommendation === 'BUILD' ? chalk.green : 
                   result.recommendation === 'PIVOT' ? chalk.yellow : chalk.red;
  lines.push(recColor.bold(`${result.recommendation}`));
  lines.push(`   Confidence: ${result.confidence}%\n`);
  
  // Problem
  lines.push(chalk.bold('🎯 Problem Analysis:'));
  lines.push(`   Stated: ${result.problem.stated}`);
  lines.push(`   Root: ${result.problem.root}`);
  lines.push(`   Real need: ${result.problem.realNeed}\n`);
  
  // BAT
  lines.push(chalk.bold('📊 BAT Framework:'));
  lines.push(`   Brand: ${result.batScore.brand}/10 - ${result.batScore.reasoning.brand}`);
  lines.push(`   Attention: ${result.batScore.attention}/10 - ${result.batScore.reasoning.attention}`);
  lines.push(`   Trust: ${result.batScore.trust}/10 - ${result.batScore.reasoning.trust}`);
  lines.push(chalk.cyan(`   Overall: ${result.batScore.overall}/10\n`));
  
  // 10-Star
  lines.push(chalk.bold('⭐ 10-Star Product:'));
  lines.push(`   Problem clarity: ${result.tenStarScore.problemClarity}/10`);
  lines.push(`   User desire: ${result.tenStarScore.userDesire}/10`);
  lines.push(`   Effort efficiency: ${result.tenStarScore.effortEfficiency}/10`);
  lines.push(`   Strategic fit: ${result.tenStarScore.strategicFit}/10`);
  lines.push(`   Competitive moat: ${result.tenStarScore.competitiveMoat}/10`);
  lines.push(chalk.cyan(`   TOTAL: ${result.tenStarScore.total}/50\n`));
  
  // Alternatives
  lines.push(chalk.bold('💡 Alternatives Considered:'));
  for (const alt of result.alternatives) {
    const batColor = alt.batScore >= 7 ? chalk.green : alt.batScore >= 5 ? chalk.yellow : chalk.gray;
    lines.push(`   • ${alt.name} (${alt.effort} effort, ${alt.impact} impact) ${batColor(`BAT: ${alt.batScore}/10`)}`);
    lines.push(`     ${alt.description}`);
  }
  lines.push('');
  
  // MVP
  lines.push(chalk.bold('🚀 Simplified MVP:'));
  lines.push(`   ${result.mvp.description}`);
  lines.push(`   Effort: ${result.mvp.effort} | Value: ${result.mvp.value}\n`);
  
  // Risks
  lines.push(chalk.bold('⚠️ Key Risks:'));
  for (const risk of result.risks) {
    const sevColor = risk.severity === 'High' ? chalk.red : risk.severity === 'Medium' ? chalk.yellow : chalk.gray;
    lines.push(`   • ${risk.description} (${sevColor(risk.severity)})`);
    lines.push(`     Mitigation: ${risk.mitigation}`);
  }
  lines.push('');
  
  // Metrics
  lines.push(chalk.bold('📈 Success Metrics:'));
  for (const metric of result.successMetrics) {
    lines.push(`   • ${metric}`);
  }
  lines.push('');
  
  // Next steps
  lines.push(chalk.bold('📋 Next Steps:'));
  for (const step of result.nextSteps) {
    lines.push(`   ${step}`);
  }
  
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  const options: PlanCEOOptions = {
    question: args._ as string,
    feature: args.feature as string,
    goal: args.goal as string,
    problem: args.problem as string,
    solution: args.solution as string,
    save: args['no-save'] !== true,
    silent: args.silent === true,
  };
  
  try {
    const result = await runCEOReview(options);
    console.log(generateConsoleReport(result));
    process.exit(result.recommendation === 'DONT_BUILD' ? 0 : 0);
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  }
}

main();
