"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.planCeoReviewCommand = planCeoReviewCommand;
const chalk_1 = __importDefault(require("chalk"));
const SCORE_DESCRIPTIONS = {
    brand: {
        0: 'Actively damages brand',
        1: 'No brand alignment',
        2: 'Weak brand fit',
        3: 'On-brand but not distinctive',
        4: 'Strong brand alignment',
        5: 'Iconic brand moment'
    },
    attention: {
        0: 'Nobody cares',
        1: 'Very niche appeal',
        2: 'Limited interest',
        3: 'Moderate interest',
        4: 'High demand/signal',
        5: 'Breakthrough attention'
    },
    trust: {
        0: 'Undermines trust',
        1: 'Major trust concerns',
        2: 'Some trust issues',
        3: 'Acceptable trust level',
        4: 'Builds trust',
        5: 'Trust breakthrough'
    }
};
async function planCeoReviewCommand(feature, options) {
    console.log(chalk_1.default.blue('📊 CEO Review:'), chalk_1.default.cyan(feature));
    console.log('');
    // Calculate or parse scores
    let scores;
    if (options.auto) {
        scores = autoCalculateScores(feature);
        console.log(chalk_1.default.gray('Auto-calculated scores based on feature description'));
    }
    else {
        scores = {
            brand: parseInt(options.brand || '3', 10),
            attention: parseInt(options.attention || '3', 10),
            trust: parseInt(options.trust || '3', 10)
        };
    }
    // Validate scores
    scores = validateScores(scores);
    // Calculate total and threshold
    const total = scores.brand + scores.attention + scores.trust;
    const threshold = 10; // 10-star methodology
    const passed = total >= threshold;
    // Display BAT scores
    console.log(chalk_1.default.blue('🎯 BAT Framework Scores'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    displayScore('Brand', scores.brand, SCORE_DESCRIPTIONS.brand[scores.brand]);
    displayScore('Attention', scores.attention, SCORE_DESCRIPTIONS.attention[scores.attention]);
    displayScore('Trust', scores.trust, SCORE_DESCRIPTIONS.trust[scores.trust]);
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log(`Total Score: ${passed ? chalk_1.default.green(total) : chalk_1.default.yellow(total)}/15`);
    console.log(`Threshold: ${threshold}/15 (10-star methodology)`);
    console.log(`Status: ${passed ? chalk_1.default.green('✅ PASS') : chalk_1.default.yellow('⚠️ BELOW THRESHOLD')}`);
    console.log('');
    // Generate recommendation
    const recommendation = generateRecommendation(scores, total, feature);
    // Display recommendation
    console.log(chalk_1.default.blue('📋 Recommendation'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    const decisionColor = {
        'build': chalk_1.default.green,
        'consider': chalk_1.default.yellow,
        'dont-build': chalk_1.default.red
    };
    console.log(`Decision: ${decisionColor[recommendation.decision](recommendation.decision.toUpperCase())}`);
    console.log(`Confidence: ${recommendation.confidence}%`);
    console.log('');
    console.log(chalk_1.default.cyan('Reasoning:'));
    recommendation.reasoning.forEach(reason => {
        console.log(chalk_1.default.gray(`  • ${reason}`));
    });
    console.log('');
    console.log(chalk_1.default.cyan('Next Steps:'));
    recommendation.nextSteps.forEach(step => {
        console.log(chalk_1.default.gray(`  → ${step}`));
    });
    console.log('');
    console.log(chalk_1.default.blue('💡 BAT Framework Summary'));
    console.log(chalk_1.default.gray('Build when 2/3 of:'));
    console.log(chalk_1.default.gray('  • Brand: Aligns with and enhances brand'));
    console.log(chalk_1.default.gray('  • Attention: Captures meaningful demand/signal'));
    console.log(chalk_1.default.gray('  • Trust: Builds or maintains user trust'));
}
function validateScores(scores) {
    return {
        brand: Math.max(0, Math.min(5, scores.brand)),
        attention: Math.max(0, Math.min(5, scores.attention)),
        trust: Math.max(0, Math.min(5, scores.trust))
    };
}
function displayScore(name, score, description) {
    const bar = '█'.repeat(score) + '░'.repeat(5 - score);
    const color = score >= 4 ? chalk_1.default.green : score >= 3 ? chalk_1.default.yellow : chalk_1.default.red;
    console.log(`${name.padEnd(10)} ${color(bar)} ${score}/5 - ${chalk_1.default.gray(description)}`);
}
function autoCalculateScores(feature) {
    const lower = feature.toLowerCase();
    // Brand indicators
    const brandBoosters = ['premium', 'luxury', 'exclusive', 'brand', 'signature', 'identity', 'vision'];
    const brandKillers = ['cheap', 'discount', 'sketchy', 'spam', 'annoying'];
    // Attention indicators  
    const attentionBoosters = ['viral', 'trending', 'high-demand', 'popular', 'growth', 'traction', 'buzz'];
    const attentionKillers = ['niche', 'obscure', 'boring', 'me-too', 'copycat'];
    // Trust indicators
    const trustBoosters = ['secure', 'verified', 'trusted', 'private', 'encrypted', 'transparent'];
    const trustKillers = ['risky', 'shady', 'unverified', 'suspicious', 'tracking'];
    let brand = 3;
    let attention = 3;
    let trust = 3;
    // Calculate brand score
    brandBoosters.forEach(word => { if (lower.includes(word))
        brand++; });
    brandKillers.forEach(word => { if (lower.includes(word))
        brand--; });
    // Calculate attention score
    attentionBoosters.forEach(word => { if (lower.includes(word))
        attention++; });
    attentionKillers.forEach(word => { if (lower.includes(word))
        attention--; });
    // Calculate trust score
    trustBoosters.forEach(word => { if (lower.includes(word))
        trust++; });
    trustKillers.forEach(word => { if (lower.includes(word))
        trust--; });
    return validateScores({ brand, attention, trust });
}
function generateRecommendation(scores, total, feature) {
    const reasoning = [];
    const nextSteps = [];
    // Analyze each dimension
    if (scores.brand >= 4) {
        reasoning.push('Strong brand alignment - reinforces brand identity');
    }
    else if (scores.brand <= 2) {
        reasoning.push('Weak brand fit - may dilute brand perception');
    }
    if (scores.attention >= 4) {
        reasoning.push('High attention potential - captures meaningful demand');
    }
    else if (scores.attention <= 2) {
        reasoning.push('Limited attention signal - may struggle to gain traction');
    }
    if (scores.trust >= 4) {
        reasoning.push('Trust-building feature - strengthens user relationships');
    }
    else if (scores.trust <= 2) {
        reasoning.push('Trust concerns - may create user skepticism');
    }
    // Determine decision
    let decision;
    let confidence;
    const highScores = [scores.brand, scores.attention, scores.trust].filter(s => s >= 4).length;
    const lowScores = [scores.brand, scores.attention, scores.trust].filter(s => s <= 2).length;
    if (total >= 12 && highScores >= 2) {
        decision = 'build';
        confidence = 85;
        nextSteps.push('Prioritize in roadmap');
        nextSteps.push('Define MVP scope');
        nextSteps.push('Assign engineering resources');
    }
    else if (total >= 10 || highScores >= 1) {
        decision = 'consider';
        confidence = 65;
        nextSteps.push('Gather more data on weak dimensions');
        nextSteps.push('Run user research or surveys');
        nextSteps.push('Revisit scoring with more insights');
        if (scores.brand < 3)
            nextSteps.push('Explore brand alignment improvements');
        if (scores.attention < 3)
            nextSteps.push('Validate market demand more deeply');
        if (scores.trust < 3)
            nextSteps.push('Address trust concerns in design');
    }
    else {
        decision = 'dont-build';
        confidence = 75;
        nextSteps.push('Deprioritize from roadmap');
        nextSteps.push('Monitor for market changes');
        nextSteps.push('Consider pivoting concept to address weak dimensions');
    }
    // Add general next steps
    if (decision === 'build' || decision === 'consider') {
        nextSteps.push('Set success metrics and review timeline');
    }
    return { decision, confidence, reasoning, nextSteps };
}
//# sourceMappingURL=index.js.map