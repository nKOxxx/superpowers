"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ceoReviewCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
/**
 * Calculate BAT scores from options
 * In a real implementation, this could use AI or user input
 */
function calculateBATScores(options) {
    // Default scoring based on feature characteristics
    const feature = options.feature.toLowerCase();
    // Brand scoring - features that differentiate and define category
    let brand = 3;
    if (feature.includes('ai') || feature.includes('ml'))
        brand = 4;
    if (feature.includes('unique') || feature.includes('innovative'))
        brand = 5;
    if (feature.includes('table') || feature.includes('basic'))
        brand = 2;
    // Attention scoring - features users engage with frequently
    let attention = 3;
    if (options.goal?.includes('daily') || options.audience?.includes('all'))
        attention = 5;
    if (options.goal?.includes('weekly'))
        attention = 4;
    if (feature.includes('admin') || feature.includes('settings'))
        attention = 2;
    // Trust scoring - security, reliability, transparency
    let trust = 3;
    if (feature.includes('security') || feature.includes('privacy'))
        trust = 5;
    if (feature.includes('auth') || feature.includes('backup'))
        trust = 4;
    if (options.trust)
        trust = Math.min(5, trust + 1);
    return { brand, attention, trust };
}
/**
 * Get recommendation based on total score
 */
function getRecommendation(total) {
    if (total >= 12)
        return { text: 'BUILD', color: 'green', emoji: '✅' };
    if (total >= 10)
        return { text: 'BUILD', color: 'green', emoji: '✅' };
    if (total >= 8)
        return { text: 'CONSIDER', color: 'yellow', emoji: '⚠️' };
    return { text: "DON'T BUILD", color: 'red', emoji: '❌' };
}
/**
 * Generate next steps based on scores and recommendation
 */
function generateNextSteps(scores, recommendation) {
    const steps = [];
    const total = scores.brand + scores.attention + scores.trust;
    if (recommendation === 'BUILD') {
        steps.push('Define success metrics (DAU, engagement, revenue impact)');
        steps.push('Create detailed technical specification');
        steps.push('Estimate development timeline and resources');
        steps.push('Coordinate with marketing for launch narrative');
        steps.push('Set 30-day post-launch review date');
    }
    else if (recommendation === 'CONSIDER') {
        if (scores.brand < 3) {
            steps.push('Research how to differentiate this feature from competitors');
        }
        if (scores.attention < 3) {
            steps.push('Validate user demand through surveys or interviews');
        }
        if (scores.trust < 3) {
            steps.push('Identify trust-building opportunities in the feature design');
        }
        steps.push('Revisit scoring after gathering more data');
    }
    else {
        steps.push('Focus resources on higher-priority features');
        steps.push('Revisit if market conditions change');
        steps.push('Consider if this could be a partnership/integration instead');
    }
    return steps;
}
/**
 * Render star rating
 */
function renderStars(score) {
    const filled = '⭐'.repeat(score);
    const empty = '○'.repeat(5 - score);
    return filled + empty;
}
exports.ceoReviewCommand = new commander_1.Command('ceo-review')
    .description('Product strategy review using BAT framework')
    .requiredOption('-f, --feature <name>', 'Feature name')
    .option('-g, --goal <text>', 'Business goal')
    .option('-a, --audience <text>', 'Target audience')
    .option('-c, --competition <text>', 'Competitors')
    .option('-t, --trust <text>', 'Trust assets you have')
    .action(async (options) => {
    console.log(chalk_1.default.blue('══════════════════════════════════════════════════'));
    console.log(chalk_1.default.blue(options.feature));
    console.log(chalk_1.default.blue('══════════════════════════════════════════════════\n'));
    // Calculate BAT scores
    const scores = calculateBATScores(options);
    const total = scores.brand + scores.attention + scores.trust;
    const recommendation = getRecommendation(total);
    // Display context if provided
    if (options.goal) {
        console.log(chalk_1.default.gray(`Goal: ${options.goal}`));
    }
    if (options.audience) {
        console.log(chalk_1.default.gray(`Audience: ${options.audience}`));
    }
    if (options.competition) {
        console.log(chalk_1.default.gray(`Competition: ${options.competition}`));
    }
    if (options.goal || options.audience || options.competition) {
        console.log('');
    }
    // Display BAT scores
    console.log(`Brand:     ${renderStars(scores.brand)} (${scores.brand}/5)`);
    console.log(`Attention: ${renderStars(scores.attention)} (${scores.attention}/5)`);
    console.log(`Trust:     ${renderStars(scores.trust)} (${scores.trust}/5)`);
    console.log(chalk_1.default.blue('\n──────────────────────────────────────────────────'));
    console.log(`Total: ${total}/15 ⭐`);
    console.log('');
    // Display recommendation
    const recColor = recommendation.color;
    console.log(chalk_1.default[recColor](`Recommendation: ${recommendation.text} ${recommendation.emoji}`));
    // Generate and display rationale
    console.log(chalk_1.default.blue('\nRationale:'));
    if (scores.brand >= 4) {
        console.log(chalk_1.default.gray('  • Strong brand differentiation potential'));
    }
    else if (scores.brand <= 2) {
        console.log(chalk_1.default.gray('  • May not differentiate from competitors'));
    }
    if (scores.attention >= 4) {
        console.log(chalk_1.default.gray('  • High user engagement potential'));
    }
    else if (scores.attention <= 2) {
        console.log(chalk_1.default.gray('  • Low user engagement expected'));
    }
    if (scores.trust >= 4) {
        console.log(chalk_1.default.gray('  • Significant trust-building opportunity'));
    }
    if (total >= 10) {
        console.log(chalk_1.default.gray('  • Above threshold for investment'));
    }
    // Next steps
    console.log(chalk_1.default.blue('\nNext Steps:'));
    const steps = generateNextSteps(scores, recommendation.text);
    for (let i = 0; i < steps.length; i++) {
        console.log(chalk_1.default.gray(`  ${i + 1}. ${steps[i]}`));
    }
    console.log(chalk_1.default.blue('\n══════════════════════════════════════════════════'));
});
//# sourceMappingURL=ceo-review.js.map