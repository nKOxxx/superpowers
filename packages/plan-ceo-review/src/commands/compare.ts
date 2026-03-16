import chalk from 'chalk';
import { review } from './review.js';

interface CompareOptions {
  audience?: string;
}

export async function compare(feature1: string, feature2: string, options: CompareOptions): Promise<void> {
  console.log(chalk.blue('\n⚖️  Feature Comparison\n'));
  
  // Capture output for both features
  let f1Output = '';
  let f2Output = '';
  
  const originalLog = console.log;
  
  console.log = (...args) => { f1Output += args.join(' ') + '\n'; };
  await review(feature1, { format: 'json', audience: options.audience });
  const f1Data = JSON.parse(f1Output);
  
  console.log = (...args) => { f2Output += args.join(' ') + '\n'; };
  await review(feature2, { format: 'json', audience: options.audience });
  const f2Data = JSON.parse(f2Output);
  
  console.log = originalLog;
  
  // Display comparison
  const f1Bat = f1Data.bat.total;
  const f2Bat = f2Data.bat.total;
  const f1Stars = f1Data.stars.overall;
  const f2Stars = f2Data.stars.overall;
  
  const f1Rec = f1Bat >= 12 ? 'BUILD' : f1Bat >= 10 ? 'BUILD' : f1Bat >= 8 ? 'CONSIDER' : "DON'T BUILD";
  const f2Rec = f2Bat >= 12 ? 'BUILD' : f2Bat >= 10 ? 'BUILD' : f2Bat >= 8 ? 'CONSIDER' : "DON'T BUILD";
  
  console.log(chalk.bold('Feature 1:'), feature1);
  console.log(`  BAT: ${f1Bat}/15 | Stars: ${f1Stars}/10 | ${f1Rec}`);
  console.log();
  
  console.log(chalk.bold('Feature 2:'), feature2);
  console.log(`  BAT: ${f2Bat}/15 | Stars: ${f2Stars}/10 | ${f2Rec}`);
  console.log();
  
  // Determine winner
  let winner: string;
  const f1Score = f1Bat + f1Stars;
  const f2Score = f2Bat + f2Stars;
  
  if (f1Score > f2Score) {
    winner = feature1;
  } else if (f2Score > f1Score) {
    winner = feature2;
  } else {
    winner = 'Tie';
  }
  
  const winnerColor = winner === feature1 ? chalk.cyan : winner === feature2 ? chalk.green : chalk.yellow;
  console.log(chalk.bold('🏆 Winner:'), winnerColor(winner));
  
  if (winner !== 'Tie') {
    const winData = winner === feature1 ? f1Data : f2Data;
    console.log(chalk.gray(`\n  Recommendation: ${winData.bat.recommendation}`));
    console.log(chalk.gray(`  Combined score: ${winner === feature1 ? f1Score : f2Score}/25`));
  }
}
