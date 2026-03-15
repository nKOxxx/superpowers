"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const chalk_1 = __importDefault(require("chalk"));
function renderStars(score) {
    const fullStars = Math.floor(score);
    const emptyStars = 5 - fullStars;
    return '⭐'.repeat(fullStars) + '○'.repeat(emptyStars);
}
function autoScoreBrand(feature) {
    const feature_lower = feature.toLowerCase();
    // Revolutionary/category defining
    if (/revolutionary|breakthrough|ai|machine learning|automation/i.test(feature_lower))
        return 5;
    // Strong differentiation
    if (/api|integration|platform|ecosystem/i.test(feature_lower))
        return 4;
    // Good incremental
    if (/improvement|enhancement|optimization/i.test(feature_lower))
        return 3;
    // Table stakes
    if (/login|auth|settings|profile/i.test(feature_lower))
        return 2;
    return 3; // Default
}
function autoScoreAttention(feature) {
    const feature_lower = feature.toLowerCase();
    // Daily use, core workflow
    if (/dashboard|feed|inbox|notification|message/i.test(feature_lower))
        return 5;
    // Weekly use, important
    if (/report|analytics|export|import/i.test(feature_lower))
        return 4;
    // Monthly, nice to have
    if (/settings|preferences|backup/i.test(feature_lower))
        return 3;
    // Rare use
    if (/admin|config|advanced/i.test(feature_lower))
        return 2;
    return 3; // Default
}
function autoScoreTrust(feature) {
    const feature_lower = feature.toLowerCase();
    // Security critical
    if (/security|encryption|privacy|auth|2fa|sso/i.test(feature_lower))
        return 5;
    // Reliability critical
    if (/backup|recovery|uptime|monitoring/i.test(feature_lower))
        return 4;
    // Transparency
    if (/logs|audit|transparency|export data/i.test(feature_lower))
        return 3;
    // Error handling
    if (/validation|error|feedback/i.test(feature_lower))
        return 2;
    return 3; // Default
}
function getRecommendation(total) {
    if (total >= 12) {
        return { text: 'BUILD', icon: '✅', color: 'green' };
    }
    else if (total >= 10) {
        return { text: 'BUILD', icon: '✓', color: 'green' };
    }
    else if (total >= 8) {
        return { text: 'CONSIDER', icon: '⚠️', color: 'yellow' };
    }
    else {
        return { text: "DON'T BUILD", icon: '❌', color: 'red' };
    }
}
function generateNextSteps(scores, total) {
    const steps = [];
    if (total >= 12) {
        steps.push('Define success metrics (DAU, engagement time)');
        steps.push('Coordinate with marketing for launch narrative');
        steps.push('Set 30-day post-launch review date');
        if (scores.attention < 5)
            steps.push('Identify hooks to increase usage frequency');
        if (scores.trust < 4)
            steps.push('Add trust signals (testimonials, security badges)');
    }
    else if (total >= 10) {
        steps.push('Validate assumptions with user interviews (n=5-10)');
        steps.push('Build minimal version for testing');
        steps.push('Set clear success criteria before full build');
    }
    else if (total >= 8) {
        steps.push('Gather more data on user demand');
        steps.push('Analyze competitor approaches');
        steps.push('Consider if this fits a future strategy pivot');
        steps.push('Revisit in 3 months if priorities shift');
    }
    else {
        steps.push('Focus on higher-scoring initiatives');
        steps.push('Archive idea with reasoning');
        steps.push('Revisit only if market conditions change');
    }
    return steps;
}
async function run(options) {
    console.log(chalk_1.default.cyan('══════════════════════════════════════════════════'));
    console.log(chalk_1.default.cyan(options.feature));
    console.log(chalk_1.default.cyan('══════════════════════════════════════════════════\n'));
    if (options.goal) {
        console.log(chalk_1.default.gray(`Goal: ${options.goal}`));
    }
    if (options.audience) {
        console.log(chalk_1.default.gray(`Audience: ${options.audience}\n`));
    }
    // Calculate scores
    const scores = {
        brand: options.brand ?? autoScoreBrand(options.feature),
        attention: options.attention ?? autoScoreAttention(options.feature),
        trust: options.trust ?? autoScoreTrust(options.feature)
    };
    const total = scores.brand + scores.attention + scores.trust;
    const recommendation = getRecommendation(total);
    // Display scores
    console.log(`Brand:     ${renderStars(scores.brand)} (${scores.brand}/5)`);
    console.log(`Attention: ${renderStars(scores.attention)} (${scores.attention}/5)`);
    console.log(`Trust:     ${renderStars(scores.trust)} (${scores.trust}/5)`);
    console.log(chalk_1.default.cyan('\n──────────────────────────────────────────────────'));
    console.log(chalk_1.default.bold(`Total: ${total}/15 ⭐`));
    console.log(chalk_1.default.cyan('──────────────────────────────────────────────────\n'));
    // Display recommendation
    const recColor = recommendation.color;
    console.log(chalk_1.default.bold('Recommendation:'), chalk_1.default[recColor](`${recommendation.icon} ${recommendation.text}`));
    // Generate rationale
    console.log(chalk_1.default.gray('\nRationale:'));
    if (scores.brand >= 4) {
        console.log(chalk_1.default.gray('  • Strong brand differentiation potential'));
    }
    else if (scores.brand <= 2) {
        console.log(chalk_1.default.gray('  • Limited brand impact - table stakes feature'));
    }
    if (scores.attention >= 4) {
        console.log(chalk_1.default.gray('  • High user engagement potential'));
    }
    else if (scores.attention <= 2) {
        console.log(chalk_1.default.gray('  • Low usage frequency - consider if worth building'));
    }
    if (scores.trust >= 4) {
        console.log(chalk_1.default.gray('  • Strong trust-building opportunity'));
    }
    else if (scores.trust <= 2) {
        console.log(chalk_1.default.gray('  • Consider trust implications before launch'));
    }
    if (total >= 10) {
        console.log(chalk_1.default.gray('  • Meets 10-star threshold for building'));
    }
    // Next steps
    console.log(chalk_1.default.gray('\nNext Steps:'));
    const steps = generateNextSteps(scores, total);
    steps.forEach((step, i) => {
        console.log(chalk_1.default.gray(`  ${i + 1}. ${step}`));
    });
    console.log(chalk_1.default.cyan('\n══════════════════════════════════════════════════'));
}
//# sourceMappingURL=index.js.map