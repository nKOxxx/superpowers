import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'fs';

interface ReviewInput { feature: string; goal: string; marketSize?: string; urgency?: string; resources?: string; }

function calcBAT(input: ReviewInput) {
  let brand = 3, attention = 3, trust = 3;
  if (input.urgency === 'high') attention += 1;
  if (input.resources === 'abundant') { brand += 1; trust += 1; }
  if (input.marketSize === 'large') attention += 1;
  else if (input.marketSize === 'small') attention -= 1;
  return { brand: Math.max(0, Math.min(5, brand)), attention: Math.max(0, Math.min(5, attention)), trust: Math.max(0, Math.min(5, trust)) };
}

function calcTenStar(input: ReviewInput) {
  const ratings = {
    problemClarity: input.goal.length > 20 ? 7 : 5, solutionFit: 6,
    marketSize: input.marketSize === 'large' ? 8 : input.marketSize === 'medium' ? 6 : 4,
    timing: input.urgency === 'high' ? 8 : input.urgency === 'medium' ? 6 : 4,
    teamFit: input.resources === 'abundant' ? 8 : input.resources === 'moderate' ? 6 : 4,
    monetization: 5, competition: 5, distribution: 5, sustainability: 6, vision: 7
  };
  const values = Object.values(ratings);
  const total = values.reduce((a, b) => a + b, 0);
  return { ...ratings, total, average: total / values.length };
}

function recommend(bat: any, ten: any) {
  if (bat.brand + bat.attention + bat.trust >= 12 && ten.average >= 7) return 'build';
  if (bat.brand + bat.attention + bat.trust >= 8 && ten.average >= 5) return 'consider';
  return 'dont-build';
}

function renderScore(score: number, max: number): string {
  const filled = Math.round((score / max) * 5);
  return chalk.gray('[') + '█'.repeat(filled) + '░'.repeat(5 - filled) + chalk.gray(']');
}

async function review(input: ReviewInput, json: boolean, output?: string) {
  const spinner = ora('Analyzing...').start();
  const bat = calcBAT(input);
  const ten = calcTenStar(input);
  const rec = recommend(bat, ten);
  spinner.succeed('Done');
  const result = { feature: input.feature, goal: input.goal, bat, tenStar: ten, recommendation: rec };
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    if (output) writeFileSync(output, JSON.stringify(result, null, 2));
    return;
  }
  console.log('\n' + chalk.cyan('═'.repeat(60)));
  console.log(chalk.bold('  CEO REVIEW: ' + input.feature));
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(`\n  BAT Scores:`);
  console.log(`    Brand:     ${renderScore(bat.brand, 5)} ${bat.brand}/5`);
  console.log(`    Attention: ${renderScore(bat.attention, 5)} ${bat.attention}/5`);
  console.log(`    Trust:     ${renderScore(bat.trust, 5)} ${bat.trust}/5`);
  console.log(`\n  10-Star Average: ${ten.average.toFixed(1)}/10`);
  const recColor = rec === 'build' ? 'green' : rec === 'consider' ? 'yellow' : 'red';
  console.log(`\n  Recommendation: ${(chalk as any)[recColor].bold(rec.toUpperCase())}`);
  console.log(chalk.cyan('═'.repeat(60)) + '\n');
  if (output) writeFileSync(output, JSON.stringify(result, null, 2));
}

export const ceoReviewCommand = new Command('plan-ceo-review')
  .description('Product strategy review')
  .argument('<feature>', 'Feature name')
  .argument('<goal>', 'Feature goal')
  .option('-m, --market-size <size>', 'Market size', 'medium')
  .option('-u, --urgency <level>', 'Urgency', 'medium')
  .option('-r, --resources <level>', 'Resources', 'moderate')
  .option('--json', 'JSON output')
  .option('-o, --output <path>', 'Save to file')
  .action((feature, goal, opts) => review({ 
    feature, 
    goal, 
    marketSize: opts.marketSize, 
    urgency: opts.urgency, 
    resources: opts.resources 
  }, opts.json, opts.output));
