import pc from 'picocolors';
import { loadConfig, mergeWithDefaults } from '../lib/config.js';
export function ceoReviewCommand(program) {
    program
        .command('ceo-review')
        .description('Product strategy review using BAT framework')
        .requiredOption('-f, --feature <name>', 'Feature name')
        .option('-g, --goal <text>', 'Business goal')
        .option('-a, --audience <text>', 'Target audience')
        .option('-c, --competition <text>', 'Competitors')
        .option('-t, --trust <text>', 'Trust assets you have')
        .option('--brand-score <0-5>', 'Brand score (0-5)', '0')
        .option('--attention-score <0-5>', 'Attention score (0-5)', '0')
        .option('--trust-score <0-5>', 'Trust score (0-5)', '0')
        .action(async (options) => {
        try {
            await runCEOReview(options);
        }
        catch (error) {
            console.error(pc.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    });
}
async function runCEOReview(options) {
    const config = mergeWithDefaults(loadConfig());
    console.log(pc.cyan('══════════════════════════════════════════════════'));
    console.log(pc.cyan('BAT Framework - Product Strategy Review'));
    console.log(pc.cyan('══════════════════════════════════════════════════'));
    console.log();
    // Parse scores from options or prompt
    const scores = {
        brand: parseInt(options.brandScore || '0') || 0,
        attention: parseInt(options.attentionScore || '0') || 0,
        trust: parseInt(options.trustScore || '0') || 0,
    };
    // If any scores are 0, we need to calculate them based on context
    if (scores.brand === 0 || scores.attention === 0 || scores.trust === 0) {
        const calculatedScores = calculateScores(options);
        scores.brand = scores.brand || calculatedScores.brand;
        scores.attention = scores.attention || calculatedScores.attention;
        scores.trust = scores.trust || calculatedScores.trust;
    }
    // Generate result
    const result = generateReview(options, scores, config.ceoReview);
    // Display results
    displayResults(result);
}
function calculateScores(options) {
    const scores = { brand: 3, attention: 3, trust: 3 };
    const feature = options.feature.toLowerCase();
    const goal = (options.goal || '').toLowerCase();
    const audience = (options.audience || '').toLowerCase();
    // Brand scoring
    if (feature.includes('ai') || feature.includes('ml'))
        scores.brand += 1;
    if (goal.includes('differentiate') || goal.includes('innovation'))
        scores.brand += 1;
    if (feature.includes('unique') || feature.includes('first'))
        scores.brand += 1;
    if (feature.includes('basic') || feature.includes('simple'))
        scores.brand -= 1;
    if (feature.includes('me too') || feature.includes('copy'))
        scores.brand -= 2;
    // Attention scoring
    if (goal.includes('daily') || goal.includes('core'))
        scores.attention += 1;
    if (audience.includes('all') || audience.includes('everyone'))
        scores.attention += 1;
    if (goal.includes('engagement') || goal.includes('retention'))
        scores.attention += 1;
    if (feature.includes('admin') || feature.includes('settings'))
        scores.attention -= 1;
    if (goal.includes('rarely') || goal.includes('occasionally'))
        scores.attention -= 1;
    // Trust scoring
    if (feature.includes('security') || feature.includes('privacy'))
        scores.trust += 2;
    if (feature.includes('backup') || feature.includes('export'))
        scores.trust += 1;
    if (options.trust?.includes('certified') || options.trust?.includes('audited'))
        scores.trust += 1;
    if (feature.includes('beta') || feature.includes('experimental'))
        scores.trust -= 1;
    // Clamp to 0-5 range
    scores.brand = Math.max(0, Math.min(5, scores.brand));
    scores.attention = Math.max(0, Math.min(5, scores.attention));
    scores.trust = Math.max(0, Math.min(5, scores.trust));
    return scores;
}
function generateReview(options, scores, config) {
    const total = scores.brand + scores.attention + scores.trust;
    const maxScore = 15;
    // Determine recommendation
    let recommendation;
    if (total >= 12) {
        recommendation = 'BUILD';
    }
    else if (total >= 10) {
        recommendation = 'BUILD';
    }
    else if (total >= 8) {
        recommendation = 'CONSIDER';
    }
    else {
        recommendation = "DON'T BUILD";
    }
    // Generate rationale
    const rationale = [];
    if (scores.brand >= 4) {
        rationale.push('Strong brand differentiation potential');
    }
    else if (scores.brand <= 2) {
        rationale.push('Limited brand impact - consider if this is table stakes');
    }
    if (scores.attention >= 4) {
        rationale.push('High user engagement potential');
    }
    else if (scores.attention <= 2) {
        rationale.push('Low usage frequency - ensure cost/benefit makes sense');
    }
    if (scores.trust >= 4) {
        rationale.push('Builds significant user trust');
    }
    else if (scores.trust <= 2 && config.requireAllBAT) {
        rationale.push('Trust concerns should be addressed');
    }
    if (options.goal?.includes('revenue')) {
        rationale.push('Direct revenue impact - validate with financial model');
    }
    if (rationale.length === 0) {
        rationale.push('Average scores across all dimensions - validate assumptions before building');
    }
    // Generate next steps
    const nextSteps = [];
    if (total >= 12) {
        nextSteps.push('Define success metrics (adoption, engagement, revenue)');
        nextSteps.push('Create detailed product spec and timeline');
        nextSteps.push('Coordinate with marketing for launch narrative');
    }
    else if (total >= 10) {
        nextSteps.push('Validate key assumptions with user research');
        nextSteps.push('Build prototype to test engagement');
        nextSteps.push('Set success criteria for full build decision');
    }
    else if (total >= 8) {
        nextSteps.push('Gather more data on user demand');
        nextSteps.push('Analyze competitor implementations');
        nextSteps.push('Revisit if strategic context changes');
    }
    else {
        nextSteps.push('Deprioritize - focus on higher-scoring initiatives');
        nextSteps.push('Document rationale for future reference');
    }
    if (config.autoGenerateNextSteps) {
        nextSteps.push('Set 30-day post-decision review date');
    }
    return {
        feature: options.feature,
        scores,
        total,
        recommendation,
        rationale,
        nextSteps,
    };
}
function displayResults(result) {
    console.log(pc.bold(pc.white(result.feature)));
    console.log();
    // Scores
    console.log(`Brand:     ${renderStars(result.scores.brand)} (${result.scores.brand}/5)`);
    console.log(`Attention: ${renderStars(result.scores.attention)} (${result.scores.attention}/5)`);
    console.log(`Trust:     ${renderStars(result.scores.trust)} (${result.scores.trust}/5)`);
    console.log();
    // Total
    const totalColor = result.total >= 12 ? 'green' : result.total >= 10 ? 'yellow' : 'red';
    console.log(pc[totalColor](`Total: ${result.total}/15 ⭐`));
    console.log();
    // Recommendation
    const recColor = result.recommendation === 'BUILD' ? 'green' : result.recommendation === 'CONSIDER' ? 'yellow' : 'red';
    const recIcon = result.recommendation === 'BUILD' ? '✅' : result.recommendation === 'CONSIDER' ? '⚠️' : '❌';
    console.log(pc.bold('Recommendation:'), pc[recColor](`${result.recommendation} ${recIcon}`));
    console.log();
    // Rationale
    console.log(pc.cyan('Rationale:'));
    result.rationale.forEach(r => console.log(`  • ${r}`));
    console.log();
    // Next steps
    console.log(pc.cyan('Next Steps:'));
    result.nextSteps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
    console.log();
    console.log(pc.cyan('══════════════════════════════════════════════════'));
}
function renderStars(score) {
    const filled = '⭐';
    const empty = '○';
    return filled.repeat(score) + empty.repeat(5 - score);
}
