"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ceoReviewCommand = ceoReviewCommand;
const picocolors_1 = __importDefault(require("picocolors"));
async function ceoReviewCommand(options) {
    console.log();
    console.log(picocolors_1.default.blue('══════════════════════════════════════════════════'));
    console.log(picocolors_1.default.bold(options.feature));
    console.log(picocolors_1.default.blue('══════════════════════════════════════════════════'));
    if (options.goal) {
        console.log(picocolors_1.default.gray(`Goal: ${options.goal}`));
    }
    if (options.audience) {
        console.log(picocolors_1.default.gray(`Audience: ${options.audience}`));
    }
    console.log();
    // Calculate BAT scores based on context
    const scores = calculateBATScores(options);
    // Display scores
    displayScores(scores);
    // Get recommendation
    const recommendation = getRecommendation(scores);
    // Display recommendation
    console.log();
    console.log(`Recommendation: ${picocolors_1.default.bold(recommendation.decision)} ${recommendation.emoji}`);
    console.log(picocolors_1.default.gray(`Threshold: ${recommendation.threshold}`));
    console.log();
    // Display rationale
    displayRationale(scores, options);
    // Display next steps
    displayNextSteps(recommendation, scores, options);
    console.log(picocolors_1.default.blue('══════════════════════════════════════════════════'));
    console.log();
}
function calculateBATScores(options) {
    const scores = {
        brand: 3, // Default: good fit
        attention: 3, // Default: nice-to-have
        trust: 3 // Default: some trust impact
    };
    // Brand scoring
    if (options.feature.toLowerCase().includes('ai') ||
        options.feature.toLowerCase().includes('automation')) {
        scores.brand = Math.min(5, scores.brand + 1);
    }
    if (options.feature.toLowerCase().includes('mobile')) {
        scores.brand = Math.min(5, scores.brand + 1);
    }
    if (options.competition) {
        // If lots of competition, less brand differentiation
        scores.brand = Math.max(1, scores.brand - 1);
    }
    // Attention scoring
    if (options.audience) {
        const audienceLower = options.audience.toLowerCase();
        if (audienceLower.includes('daily') ||
            audienceLower.includes('core') ||
            audienceLower.includes('everyone')) {
            scores.attention = Math.min(5, scores.attention + 2);
        }
        else if (audienceLower.includes('weekly') ||
            audienceLower.includes('active')) {
            scores.attention = Math.min(5, scores.attention + 1);
        }
    }
    if (options.goal) {
        const goalLower = options.goal.toLowerCase();
        if (goalLower.includes('revenue') ||
            goalLower.includes('engagement') ||
            goalLower.includes('retention')) {
            scores.attention = Math.min(5, scores.attention + 1);
        }
    }
    // Trust scoring
    if (options.trust) {
        const trustLower = options.trust.toLowerCase();
        if (trustLower.includes('security') ||
            trustLower.includes('privacy') ||
            trustLower.includes('data')) {
            scores.trust = 5;
        }
        else if (trustLower.includes('verified') ||
            trustLower.includes('certified')) {
            scores.trust = Math.min(5, scores.trust + 1);
        }
    }
    if (options.feature.toLowerCase().includes('security') ||
        options.feature.toLowerCase().includes('auth')) {
        scores.trust = Math.min(5, scores.trust + 1);
    }
    return scores;
}
function displayScores(scores) {
    const total = scores.brand + scores.attention + scores.trust;
    console.log(`${picocolors_1.default.cyan('Brand:')}     ${renderStars(scores.brand)} (${scores.brand}/5)`);
    console.log(`${picocolors_1.default.cyan('Attention:')} ${renderStars(scores.attention)} (${scores.attention}/5)`);
    console.log(`${picocolors_1.default.cyan('Trust:')}     ${renderStars(scores.trust)} (${scores.trust}/5)`);
    console.log();
    console.log(picocolors_1.default.bold(`Total: ${total}/15 ⭐`));
}
function renderStars(score) {
    const filled = '⭐'.repeat(score);
    const empty = '○'.repeat(5 - score);
    return filled + empty;
}
function getRecommendation(scores) {
    const total = scores.brand + scores.attention + scores.trust;
    if (total >= 12) {
        return { decision: 'BUILD', emoji: '✅', threshold: '12-15 stars: Strong signal' };
    }
    else if (total >= 10) {
        return { decision: 'BUILD', emoji: '✅', threshold: '10-11 stars: Good signal, validate' };
    }
    else if (total >= 8) {
        return { decision: 'CONSIDER', emoji: '🤔', threshold: '8-9 stars: Mixed signal' };
    }
    else {
        return { decision: 'DON\'T BUILD', emoji: '❌', threshold: '0-7 stars: Weak signal' };
    }
}
function displayRationale(scores, options) {
    console.log(picocolors_1.default.cyan('Rationale:'));
    const points = [];
    if (scores.brand >= 4) {
        points.push('Strong brand differentiation potential');
    }
    else if (scores.brand <= 2) {
        points.push('Limited brand differentiation');
    }
    if (scores.attention >= 4) {
        points.push('High user engagement potential');
    }
    else if (scores.attention <= 2) {
        points.push('May struggle to capture user attention');
    }
    if (scores.trust >= 4) {
        points.push('Significant trust/reliability impact');
    }
    else if (scores.trust <= 2) {
        points.push('Limited trust implications');
    }
    if (options.competition) {
        points.push(`Competitive landscape: ${options.competition}`);
    }
    if (options.goal) {
        if (options.goal.toLowerCase().includes('revenue')) {
            points.push('Direct revenue impact should be modeled');
        }
        else if (options.goal.toLowerCase().includes('engagement')) {
            points.push('Engagement metrics should be defined upfront');
        }
    }
    if (points.length === 0) {
        points.push('Standard feature with moderate impact across all dimensions');
    }
    for (const point of points) {
        console.log(`  • ${point}`);
    }
}
function displayNextSteps(recommendation, scores, options) {
    console.log();
    console.log(picocolors_1.default.cyan('Next Steps:'));
    const steps = [];
    if (recommendation.decision === 'BUILD') {
        steps.push('Define success metrics (DAU, engagement, revenue)');
        steps.push('Coordinate with team for technical feasibility');
        if (scores.brand >= 4) {
            steps.push('Coordinate with marketing for launch narrative');
        }
        steps.push('Set 30-day post-launch review date');
    }
    else if (recommendation.decision === 'CONSIDER') {
        steps.push('Gather more data on user demand');
        steps.push('Validate technical approach with spike');
        steps.push('Re-evaluate after user research');
        if (scores.attention <= 3) {
            steps.push('Consider if this should be deprioritized');
        }
    }
    else {
        steps.push('Focus resources on higher-impact features');
        steps.push('Revisit if market conditions change');
        steps.push('Consider if a simpler solution exists');
    }
    for (let i = 0; i < steps.length; i++) {
        console.log(`  ${i + 1}. ${steps[i]}`);
    }
}
//# sourceMappingURL=index.js.map