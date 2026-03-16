#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeFeature, formatReview, formatReviewMarkdown, formatReviewJson, printFramework } from './framework.js';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const program = new Command();

program
  .name('plan-ceo-review')
  .description('Product strategy evaluation using BAT framework (Brand, Attention, Trust)')
  .version('1.0.0');

program
  .command('review <feature>')
  .description('Analyze a feature using BAT framework and 10-star methodology')
  .option('-a, --audience <audience>', 'Target audience')
  .option('-m, --market <market>', 'Market segment')
  .option('-f, --format <format>', 'Output format: text, json, markdown', 'text')
  .option('-o, --output <file>', 'Save report to file')
  .action(async (feature, options) => {
    const result = analyzeFeature(feature, options.audience, options.market);
    
    let output: string;
    switch (options.format) {
      case 'json':
        output = formatReviewJson(result);
        break;
      case 'markdown':
        output = formatReviewMarkdown(result);
        break;
      default:
        output = formatReview(result);
    }
    
    console.log(output);
    
    if (options.output) {
      await writeFile(options.output, output);
      console.log(`\nSaved to: ${options.output}`);
    }
  });

program
  .command('compare <feature1> <feature2>')
  .description('Compare two features side-by-side')
  .option('-a, --audience <audience>', 'Target audience')
  .action(async (feature1, feature2, options) => {
    const result1 = analyzeFeature(feature1, options.audience);
    const result2 = analyzeFeature(feature2, options.audience);
    
    console.log('\n⚖️  Feature Comparison\n');
    console.log(`Feature 1: ${result1.feature}`);
    console.log(`  BAT: ${result1.bat.total}/15 | Stars: ${result1.stars.overall}/10 | ${result1.bat.recommendation}`);
    console.log();
    console.log(`Feature 2: ${result2.feature}`);
    console.log(`  BAT: ${result2.bat.total}/15 | Stars: ${result2.stars.overall}/10 | ${result2.bat.recommendation}`);
    console.log();
    
    const winner = result1.bat.total > result2.bat.total ? result1 : result2;
    console.log(`🏆 Winner: ${winner.feature}`);
    console.log();
  });

program
  .command('framework')
  .description('Display BAT and 10-star framework documentation')
  .action(() => {
    console.log(printFramework());
  });

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  program.parse();
}

export { program };
