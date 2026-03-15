import { program } from 'commander';
import chalk from 'chalk';
// Auto-analysis keywords for scoring
const BRAND_INDICATORS = {
    positive: ['brand', 'unique', 'different', 'novel', 'first', 'innovative', 'category', 'defining', 'iconic', 'premium'],
    negative: ['commodity', 'me-too', 'clone', 'copycat', 'generic', 'undifferentiated', 'boring']
};
const ATTENTION_INDICATORS = {
    positive: ['viral', 'shareable', 'network effects', 'social', 'community', 'content', 'media', 'buzz', 'trending', 'hook'],
    negative: ['quiet', 'boring', 'passive', 'invisible', 'background', 'utility', 'silent']
};
const TRUST_INDICATORS = {
    positive: ['security', 'privacy', 'verified', 'authentic', 'proven', 'tested', 'audited', 'transparent', 'open source', 'credentials'],
    negative: ['unverified', 'anonymous', 'sketchy', 'opaque', 'untested', 'risky', 'unknown']
};
function autoScore(idea) {
    const lowerIdea = idea.toLowerCase();
    let brand = 3;
    let attention = 3;
    let trust = 3;
    // Brand scoring
    for (const word of BRAND_INDICATORS.positive) {
        if (lowerIdea.includes(word))
            brand += 0.5;
    }
    for (const word of BRAND_INDICATORS.negative) {
        if (lowerIdea.includes(word))
            brand -= 0.5;
    }
    // Attention scoring
    for (const word of ATTENTION_INDICATORS.positive) {
        if (lowerIdea.includes(word))
            attention += 0.5;
    }
    for (const word of ATTENTION_INDICATORS.negative) {
        if (lowerIdea.includes(word))
            attention -= 0.5;
    }
    // Trust scoring
    for (const word of TRUST_INDICATORS.positive) {
        if (lowerIdea.includes(word))
            trust += 0.5;
    }
    for (const word of TRUST_INDICATORS.negative) {
        if (lowerIdea.includes(word))
            trust -= 0.5;
    }
    return {
        brand: Math.max(0, Math.min(5, Math.round(brand))),
        attention: Math.max(0, Math.min(5, Math.round(attention))),
        trust: Math.max(0, Math.min(5, Math.round(trust))),
        total: 0
    };
}
function calculateStars(scores) {
    const total = scores.brand + scores.attention + scores.trust;
    // Convert to 10-star scale
    return Math.round((total / 15) * 10);
}
function generateRecommendation(analysis) {
    const { scores, stars } = analysis;
    const reasoning = [];
    const nextSteps = [];
    // Brand analysis
    if (scores.brand >= 4) {
        reasoning.push(`Strong brand potential (${scores.brand}/5) - differentiates in market`);
    }
    else if (scores.brand <= 2) {
        reasoning.push(`Weak brand potential (${scores.brand}/5) - may struggle to stand out`);
        nextSteps.push('Define unique positioning and differentiation strategy');
    }
    // Attention analysis
    if (scores.attention >= 4) {
        reasoning.push(`High attention mechanics (${scores.attention}/5) - organic growth potential`);
    }
    else if (scores.attention <= 2) {
        reasoning.push(`Low attention mechanics (${scores.attention}/5) - will need paid acquisition`);
        nextSteps.push('Design viral loops or content strategy to improve attention score');
    }
    // Trust analysis
    if (scores.trust >= 4) {
        reasoning.push(`Strong trust foundation (${scores.trust}/5) - reduces friction`);
    }
    else if (scores.trust <= 2) {
        reasoning.push(`Trust challenges (${scores.trust}/5) - may face adoption resistance`);
        nextSteps.push('Invest in security audits, transparency reports, or credentials');
    }
    // Determine decision based on 10-star methodology
    let decision;
    let confidence;
    if (stars >= 8) {
        decision = 'BUILD';
        confidence = 'HIGH';
        if (reasoning.length === 0)
            reasoning.push('Exceptional BAT score - strong across all dimensions');
    }
    else if (stars >= 6) {
        decision = 'CONSIDER';
        confidence = 'MEDIUM';
        reasoning.push('Decent scores but gaps exist - refine before committing');
        nextSteps.push('Conduct deeper market validation on weak dimensions');
    }
    else if (stars >= 4) {
        decision = 'CONSIDER';
        confidence = 'LOW';
        reasoning.push('Weak BAT scores - significant concerns across dimensions');
        nextSteps.push('Major pivot or enhancement needed before proceeding');
    }
    else {
        decision = 'DONT_BUILD';
        confidence = 'HIGH';
        reasoning.push('Poor BAT scores - likely to struggle in market');
        nextSteps.push('Reconsider core concept or target different problem space');
    }
    return { decision, confidence, reasoning, nextSteps };
}
export function analyzeBAT(options) {
    console.log(chalk.blue('\n📊 BAT Framework Analysis\n'));
    console.log(chalk.gray(`Idea: ${options.idea}\n`));
    // Calculate scores
    let scores;
    if (options.auto && (!options.brand || !options.attention || !options.trust)) {
        scores = autoScore(options.idea);
        console.log(chalk.yellow('🤖 Auto-scored based on idea description\n'));
    }
    else {
        scores = {
            brand: options.brand || 3,
            attention: options.attention || 3,
            trust: options.trust || 3,
            total: 0
        };
    }
    // Override with explicit values if provided
    if (options.brand)
        scores.brand = options.brand;
    if (options.attention)
        scores.attention = options.attention;
    if (options.trust)
        scores.trust = options.trust;
    scores.total = scores.brand + scores.attention + scores.trust;
    // Calculate 10-star rating
    const stars = calculateStars(scores);
    // Generate recommendation
    const analysis = {
        idea: options.idea,
        scores,
        stars,
        recommendation: { decision: 'CONSIDER', confidence: 'MEDIUM', reasoning: [], nextSteps: [] },
        framework: 'BAT (Brand, Attention, Trust) - 10-star methodology (2/3 minimum to build)'
    };
    analysis.recommendation = generateRecommendation(analysis);
    // Output
    const outputFormat = options.output || 'table';
    if (outputFormat === 'json') {
        console.log(JSON.stringify(analysis, null, 2));
    }
    else if (outputFormat === 'text') {
        console.log(`Scores: Brand ${scores.brand}/5, Attention ${scores.attention}/5, Trust ${scores.trust}/5`);
        console.log(`Total: ${stars}/10 stars`);
        console.log(`Decision: ${analysis.recommendation.decision} (${analysis.recommendation.confidence} confidence)`);
    }
    else {
        // Table format
        console.log('┌─────────────────────────────────────────┐');
        console.log('│           BAT SCORECARD                 │');
        console.log('├─────────────────────────────────────────┤');
        console.log(`│  Brand     │  ${'★'.repeat(scores.brand)}${'☆'.repeat(5 - scores.brand)}  │  ${scores.brand}/5  │`);
        console.log(`│  Attention │  ${'★'.repeat(scores.attention)}${'☆'.repeat(5 - scores.attention)}  │  ${scores.attention}/5  │`);
        console.log(`│  Trust     │  ${'★'.repeat(scores.trust)}${'☆'.repeat(5 - scores.trust)}  │  ${scores.trust}/5  │`);
        console.log('├─────────────────────────────────────────┤');
        console.log(`│  TOTAL     │  ${'★'.repeat(Math.floor(stars / 2))}${'☆'.repeat(5 - Math.floor(stars / 2))}  │  ${stars}/10 │`);
        console.log('└─────────────────────────────────────────┘');
        console.log();
        // Recommendation
        const decisionColor = analysis.recommendation.decision === 'BUILD' ? chalk.green
            : analysis.recommendation.decision === 'DONT_BUILD' ? chalk.red
                : chalk.yellow;
        console.log(decisionColor.bold(`🎯 DECISION: ${analysis.recommendation.decision}`));
        console.log(chalk.gray(`   Confidence: ${analysis.recommendation.confidence}\n`));
        console.log(chalk.blue('Reasoning:'));
        for (const reason of analysis.recommendation.reasoning) {
            console.log(`  • ${reason}`);
        }
        if (analysis.recommendation.nextSteps.length > 0) {
            console.log(chalk.blue('\nNext Steps:'));
            for (const step of analysis.recommendation.nextSteps) {
                console.log(`  → ${step}`);
            }
        }
    }
    console.log();
    return analysis;
}
// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    program
        .name('plan-ceo-review')
        .description('Product strategy review using BAT framework')
        .version('1.0.0')
        .argument('<idea>', 'Idea or feature description (use quotes)')
        .option('-b, --brand <n>', 'Brand score (0-5)', parseFloat)
        .option('-a, --attention <n>', 'Attention score (0-5)', parseFloat)
        .option('-t, --trust <n>', 'Trust score (0-5)', parseFloat)
        .option('--auto', 'Auto-score based on idea description', false)
        .option('-o, --output <format>', 'Output: table, json, text', 'table')
        .action((idea, opts) => {
        analyzeBAT({ idea, ...opts });
    });
    program.parse();
}
export default analyzeBAT;
