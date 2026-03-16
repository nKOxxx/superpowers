import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs/promises';

interface RiskFactor {
  name: string;
  impact: number;
}

export async function analyze(): Promise<void> {
  console.log(chalk.blue('🔍 Analyzing code changes...\n'));
  
  let changedFiles: string[] = [];
  let testFiles: string[] = [];
  
  try {
    changedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f.trim() && !f.includes('node_modules'));
    
    testFiles = changedFiles.filter(f => 
      f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__')
    );
  } catch (error) {
    console.log(chalk.yellow('Could not get git diff, assuming all files changed'));
  }
  
  const codeFiles = changedFiles.filter(f => 
    !f.includes('.test.') && !f.includes('.spec.') && !f.includes('__tests__')
  );
  
  // Calculate risk score
  let riskScore = 0;
  const riskFactors: RiskFactor[] = [];
  
  // Number of files changed
  const fileCountImpact = Math.min(codeFiles.length * 5, 30);
  if (fileCountImpact > 0) {
    riskScore += fileCountImpact;
    riskFactors.push({ name: `${codeFiles.length} files changed`, impact: fileCountImpact });
  }
  
  // Core/shared files
  const coreFiles = codeFiles.filter(f => 
    f.includes('/core/') || 
    f.includes('/shared/') || 
    f.includes('/utils/') ||
    f.includes('index.ts') ||
    f.includes('index.js')
  );
  if (coreFiles.length > 0) {
    riskScore += 20;
    riskFactors.push({ name: 'Core/shared files modified', impact: 20 });
  }
  
  // Files without tests
  const filesWithoutTests = codeFiles.filter(f => {
    const base = f.replace(/\.[^/.]+$/, '');
    return !changedFiles.some(t => t.includes(base) && (t.includes('.test.') || t.includes('.spec.')));
  });
  if (filesWithoutTests.length > 0) {
    riskScore += 15;
    riskFactors.push({ name: 'Files changed without test updates', impact: 15 });
  }
  
  // Cap at 100
  riskScore = Math.min(riskScore, 100);
  
  // Determine recommendation
  let recommendation: string;
  let command: string;
  
  if (riskScore <= 30) {
    recommendation = '🟢 Low Risk - targeted tests recommended';
    command = 'qa run --mode=targeted';
  } else if (riskScore <= 60) {
    recommendation = '🟡 Medium Risk - smoke tests recommended';
    command = 'qa run --mode=smoke';
  } else {
    recommendation = '🔴 High Risk - full test suite recommended';
    command = 'qa run --mode=full';
  }
  
  // Output
  console.log(chalk.bold('Risk Assessment:'));
  const color = riskScore <= 30 ? chalk.green : riskScore <= 60 ? chalk.yellow : chalk.red;
  console.log(color(`  Score: ${riskScore}/100\n`));
  
  if (riskFactors.length > 0) {
    console.log(chalk.bold('Risk Factors:'));
    for (const factor of riskFactors) {
      console.log(chalk.gray(`  • ${factor.name} (+${factor.impact})`));
    }
    console.log();
  }
  
  if (codeFiles.length > 0) {
    console.log(chalk.bold('Changed Files:'));
    for (const file of codeFiles.slice(0, 10)) {
      console.log(chalk.gray(`  • ${file}`));
    }
    if (codeFiles.length > 10) {
      console.log(chalk.gray(`  ... and ${codeFiles.length - 10} more`));
    }
    console.log();
  }
  
  if (testFiles.length > 0) {
    console.log(chalk.bold('Test Files:'));
    for (const file of testFiles) {
      console.log(chalk.green(`  ✓ ${file}`));
    }
    console.log();
  }
  
  console.log(chalk.bold('Recommendation:'));
  console.log(`  ${recommendation}`);
  console.log(chalk.cyan(`  Run: ${command}`));
}
