#!/usr/bin/env node
import { planCEOReview } from './dist/index.js';
import { writeFileSync } from 'fs';

function formatOutput(result, format) {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2);
    
    case 'text':
      return `
BAT CEO REVIEW
==============

Question: ${result.question}

OVERALL SCORE: ${result.bat.overall}/100
VERDICT: ${result.verdict.toUpperCase()}

BRAND: ${result.bat.brand}/100
ATTENTION: ${result.bat.attention}/100
TRUST: ${result.bat.trust}/100

SUMMARY:
${result.summary}

NEXT STEPS:
${result.nextSteps.map(s => `  • ${s}`).join('\n')}
`;
    
    case 'markdown':
    default:
      return `
# BAT CEO Review

## Question
${result.question}

## Executive Summary

**Overall Score:** ${result.bat.overall}/100  
**Verdict:** ${result.verdict === 'proceed' ? '✅ PROCEED' : result.verdict === 'caution' ? '⚠️ CAUTION' : '❌ RECONSIDER'}

${result.summary}

## BAT Scorecard

| Dimension | Score | Weight |
|-----------|-------|--------|
| 🎯 Brand | ${result.bat.brand}/100 | 35% |
| 👁️ Attention | ${result.bat.attention}/100 | 35% |
| 🤝 Trust | ${result.bat.trust}/100 | 30% |
| **Overall** | **${result.bat.overall}/100** | 100% |

## Brand Analysis
${result.brand.recommendations.map(r => `- ${r}`).join('\n')}

## Attention Analysis
${result.attention.recommendations.map(r => `- ${r}`).join('\n')}

## Trust Analysis
${result.trust.recommendations.map(r => `- ${r}`).join('\n')}

## Next Steps
${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;
  }
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0].startsWith('-')) {
  console.error('Usage: plan-ceo-review "Your product decision question" [options]');
  console.error('');
  console.error('Options:');
  console.error('  -a, --auto         Auto-generate BAT analysis');
  console.error('  -f, --format       Output format: markdown, json, text (default: markdown)');
  console.error('  -s, --save <file>  Save output to file');
  process.exit(1);
}

const question = args[0];
const options = { 
  question,
  format: 'markdown',
  auto: false
};

for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--auto':
    case '-a':
      options.auto = true;
      break;
    case '--format':
    case '-f':
      options.format = args[++i];
      break;
    case '--save':
    case '-s':
      options.save = args[++i];
      break;
  }
}

planCEOReview(options)
  .then(result => {
    const output = formatOutput(result, options.format);
    console.log(output);
    
    if (options.save) {
      writeFileSync(options.save, output);
      console.log(`\n💾 Saved to ${options.save}`);
    }
    
    process.exit(result.verdict === 'reconsider' ? 1 : 0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
