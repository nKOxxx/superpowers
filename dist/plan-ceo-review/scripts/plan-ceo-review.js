#!/usr/bin/env node
/**
 * /plan-ceo-review - Product Strategy Skill
 * BAT framework + 10-star methodology for build decisions
 */
import { loadConfig } from './lib/config.js';
import { evaluateBAT } from './lib/bat-scoring.js';
import { analyzeMarket } from './lib/market-analysis.js';
import { generateRecommendation } from './lib/recommendation.js';
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printHelp();
        process.exit(0);
    }
    const options = parseCEOArgs(args);
    const config = await loadConfig();
    console.log('👔 CEO Review');
    console.log('='.repeat(50));
    try {
        const report = await runCEOReview(options, config);
        printReport(report);
    }
    catch (error) {
        console.error('❌ CEO review failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
function parseCEOArgs(args) {
    const options = {};
    // First positional arg is feature description
    if (args[0] && !args[0].startsWith('--')) {
        options.description = args[0];
    }
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--feature' || arg === '-f') {
            options.feature = args[++i];
        }
        else if (arg === '--goal' || arg === '-g') {
            options.goal = args[++i];
        }
        else if (arg === '--market' || arg === '-m') {
            options.market = args[++i];
        }
    }
    // If no explicit feature name, use description
    if (!options.feature && options.description) {
        // Extract feature name from description (first few words)
        options.feature = options.description.split(' ').slice(0, 5).join(' ');
    }
    if (!options.feature) {
        console.error('Error: Feature name or description required');
        printHelp();
        process.exit(1);
    }
    return options;
}
async function runCEOReview(options, config) {
    console.log(`Feature: ${options.feature}`);
    if (options.goal)
        console.log(`Goal: ${options.goal}`);
    if (options.market)
        console.log(`Market: ${options.market}`);
    console.log();
    // BAT Evaluation
    console.log('🎯 Evaluating BAT Framework...');
    const bat = await evaluateBAT(options);
    // Market Analysis (if enabled)
    let marketAnalysis;
    if (config?.ceoReview?.marketAnalysis !== false) {
        console.log('📊 Analyzing market...');
        marketAnalysis = await analyzeMarket(options);
    }
    // Generate recommendation
    const recommendation = generateRecommendation(bat, marketAnalysis, config);
    return {
        feature: options.feature || '',
        goal: options.goal,
        market: options.market,
        bat,
        marketAnalysis,
        recommendation,
        timestamp: new Date().toISOString()
    };
}
function printReport(report) {
    console.log('\n📋 CEO Review Report');
    console.log('='.repeat(50));
    console.log();
    console.log(`Feature: ${report.feature}`);
    if (report.goal)
        console.log(`Goal: ${report.goal}`);
    if (report.market)
        console.log(`Market: ${report.market}`);
    console.log();
    // BAT Scores
    console.log('BAT Evaluation:');
    console.log('-'.repeat(30));
    console.log(`Brand:    ${renderStars(report.bat.brand)} (${report.bat.brand}/5)`);
    console.log(`Attention: ${renderStars(report.bat.attention)} (${report.bat.attention}/5)`);
    console.log(`Trust:    ${renderStars(report.bat.trust)} (${report.bat.trust}/5)`);
    console.log();
    const total = report.bat.brand + report.bat.attention + report.bat.trust;
    console.log(`Total: ${total}/15 ⭐`);
    console.log();
    // Rationale
    console.log('Rationale:');
    console.log('-'.repeat(30));
    console.log(`Brand:    ${report.bat.rationale.brand}`);
    console.log(`Attention: ${report.bat.rationale.attention}`);
    console.log(`Trust:    ${report.bat.rationale.trust}`);
    console.log();
    // Market Analysis
    if (report.marketAnalysis) {
        console.log('Market Analysis:');
        console.log('-'.repeat(30));
        console.log(`Competitors: ${report.marketAnalysis.competitors.join(', ')}`);
        console.log(`Trend: ${report.marketAnalysis.trend}`);
        console.log(`Risk Level: ${report.marketAnalysis.riskLevel}`);
        console.log();
    }
    // Recommendation
    const rec = report.recommendation;
    const decision = rec.build ? '✅ BUILD' : '❌ DON\'T BUILD';
    console.log(`Recommendation: ${decision}`);
    console.log(`Confidence: ${rec.confidence}%`);
    console.log();
    if (rec.reasoning) {
        console.log('Reasoning:');
        rec.reasoning.forEach(r => console.log(`  • ${r}`));
        console.log();
    }
    if (rec.nextSteps && rec.nextSteps.length > 0) {
        console.log('Next Steps:');
        rec.nextSteps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
    }
}
function renderStars(count) {
    return '⭐'.repeat(count) + '○'.repeat(5 - count);
}
function printHelp() {
    console.log(`
/plan-ceo-review - Product Strategy Review

Usage:
  plan-ceo-review "<feature description>" [options]
  plan-ceo-review --feature="<name>" --goal="<goal>" [options]

Options:
  --feature, -f    Feature name
  --goal, -g       Business goal this feature serves
  --market, -m     Target market segment
  --help           Show this help

BAT Framework (2/3 minimum to build):
  • Brand - Does this strengthen our brand? (0-5 stars)
  • Attention - Will users use this? (0-5 stars)
  • Trust - Does this build user trust? (0-5 stars)

Examples:
  plan-ceo-review "Should we add Telegram notifications?"
  plan-ceo-review --feature="mobile app" --goal="increase engagement 50%"
  plan-ceo-review --feature="AI chat" --market="SaaS tools"
`);
}
main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
//# sourceMappingURL=plan-ceo-review.js.map