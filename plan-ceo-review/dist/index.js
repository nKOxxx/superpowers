import chalk from 'chalk';
const RECOMMENDATION_THRESHOLDS = {
    build: 10, // 2/3 of 15 (max score)
    consider: 7.5, // 1/2 of 15
};
export async function ceoReview(options) {
    const reviewOptions = {
        brand: options.brand,
        attention: options.attention,
        trust: options.trust,
        auto: !options.brand && !options.attention && !options.trust,
        json: false,
    };
    return reviewCommand(options.feature, reviewOptions);
}
export async function reviewCommand(description, options) {
    // Parse description
    const { name, desc } = parseDescription(description);
    // Calculate or use provided scores
    let scores;
    if (options.auto || (!options.brand && !options.attention && !options.trust)) {
        scores = autoCalculateScores(name, desc);
    }
    else {
        scores = {
            brand: clampScore(options.brand ?? 3),
            attention: clampScore(options.attention ?? 3),
            trust: clampScore(options.trust ?? 3),
        };
    }
    // Generate review
    const result = generateReview(name, desc, scores);
    // Output
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        if (options.output) {
            const { writeFileSync } = await import('fs');
            writeFileSync(options.output, JSON.stringify(result, null, 2));
            console.log(chalk.gray(`\n💾 Saved to ${options.output}`));
        }
    }
    else {
        printReview(result);
        if (options.output) {
            const { writeFileSync } = await import('fs');
            writeFileSync(options.output, JSON.stringify(result, null, 2));
            console.log(chalk.gray(`\n💾 Saved to ${options.output}`));
        }
    }
}
function parseDescription(description) {
    const parts = description.split(':');
    if (parts.length >= 2) {
        return {
            name: parts[0].trim(),
            desc: parts.slice(1).join(':').trim(),
        };
    }
    return {
        name: description,
        desc: description,
    };
}
function clampScore(score) {
    return Math.max(0, Math.min(5, score));
}
function autoCalculateScores(name, description) {
    const text = (name + ' ' + description).toLowerCase();
    // Brand indicators
    const brandIndicators = [
        'brand', 'identity', 'recognition', 'market position', 'premium',
        'reputation', 'authority', 'thought leadership', 'unique', 'ai', 'ml',
        'smart', 'intelligent', 'auto', 'predictive', 'advanced', 'custom',
    ];
    let brandScore = 3;
    for (const indicator of brandIndicators) {
        if (text.includes(indicator))
            brandScore += 0.5;
    }
    // Attention indicators
    const attentionIndicators = [
        'engagement', 'viral', 'growth', 'traffic', 'acquisition',
        'retention', 'user', 'customer', 'marketing', 'seo',
        'social', 'share', 'discover', 'notification', 'dashboard',
        'daily', 'workflow', 'core', 'main', 'home', 'mobile', 'app',
    ];
    let attentionScore = 3;
    for (const indicator of attentionIndicators) {
        if (text.includes(indicator))
            attentionScore += 0.5;
    }
    // Trust indicators
    const trustIndicators = [
        'security', 'privacy', 'reliable', 'transparent', 'verified',
        'guarantee', 'compliance', 'audit', 'safe', 'protect',
        'authentic', 'proven', 'trusted', 'expert', 'encryption',
        '2fa', 'auth', 'verify', 'backup', 'sync', 'recovery', 'uptime',
    ];
    let trustScore = 3;
    for (const indicator of trustIndicators) {
        if (text.includes(indicator))
            trustScore += 0.5;
    }
    return {
        brand: clampScore(brandScore),
        attention: clampScore(attentionScore),
        trust: clampScore(trustScore),
    };
}
function generateReview(name, description, scores) {
    const total = scores.brand + scores.attention + scores.trust;
    const threshold = RECOMMENDATION_THRESHOLDS.build;
    const passed = total >= threshold;
    let recommendation;
    if (total >= RECOMMENDATION_THRESHOLDS.build) {
        recommendation = 'build';
    }
    else if (total >= RECOMMENDATION_THRESHOLDS.consider) {
        recommendation = 'consider';
    }
    else {
        recommendation = 'dont-build';
    }
    const reasoning = generateReasoning(scores, total, recommendation);
    const nextSteps = generateNextSteps(scores, recommendation);
    return {
        description,
        name,
        scores,
        total,
        threshold,
        passed,
        recommendation,
        reasoning,
        nextSteps,
    };
}
function generateReasoning(scores, total, recommendation) {
    const parts = [];
    // Overall assessment
    if (recommendation === 'build') {
        parts.push('This feature/product scores well across the BAT framework (2/3 criteria met).');
    }
    else if (recommendation === 'consider') {
        parts.push('This feature/product shows promise but has gaps in the BAT framework (1/3 criteria met).');
    }
    else {
        parts.push('This feature/product does not meet the BAT threshold for immediate investment (0/3 criteria met).');
    }
    // Individual dimension analysis
    parts.push('\nDimension Analysis:');
    parts.push(`\n${getScoreEmoji(scores.brand)} Brand (${scores.brand}/5):`);
    if (scores.brand >= 4) {
        parts.push('Strong brand alignment. This enhances market position and differentiation.');
    }
    else if (scores.brand >= 2.5) {
        parts.push('Moderate brand impact. Consider how to strengthen unique positioning.');
    }
    else {
        parts.push('Weak brand connection. May not contribute to long-term brand equity.');
    }
    parts.push(`\n${getScoreEmoji(scores.attention)} Attention (${scores.attention}/5):`);
    if (scores.attention >= 4) {
        parts.push('High attention potential. Strong user engagement and growth opportunities.');
    }
    else if (scores.attention >= 2.5) {
        parts.push('Moderate attention capture. May need marketing amplification.');
    }
    else {
        parts.push('Low attention value. Difficult to acquire and retain users.');
    }
    parts.push(`\n${getScoreEmoji(scores.trust)} Trust (${scores.trust}/5):`);
    if (scores.trust >= 4) {
        parts.push('High trust factor. Builds user confidence and reduces friction.');
    }
    else if (scores.trust >= 2.5) {
        parts.push('Moderate trust. Address potential credibility concerns.');
    }
    else {
        parts.push('Trust concerns. Users may hesitate to adopt or engage.');
    }
    return parts.join(' ');
}
function generateNextSteps(scores, recommendation) {
    const steps = [];
    if (recommendation === 'build') {
        steps.push('Prioritize this in the roadmap');
        steps.push('Assign dedicated team/resources');
        steps.push('Define success metrics and timeline');
        steps.push('Begin detailed technical and market specification');
    }
    else if (recommendation === 'consider') {
        steps.push('Identify gaps in the weakest BAT dimension');
        steps.push('Prototype or research to validate assumptions');
        steps.push('Re-evaluate after addressing key concerns');
        steps.push('Consider as secondary priority');
    }
    else {
        steps.push('Deprioritize or reject for now');
        steps.push('Revisit if market conditions change');
        steps.push('Consider pivoting the concept to address BAT gaps');
    }
    // Dimension-specific recommendations
    if (scores.brand < 3) {
        steps.push('Workshop: How can this strengthen brand positioning?');
    }
    if (scores.attention < 3) {
        steps.push('Research: What would make this more engaging/discoverable?');
    }
    if (scores.trust < 3) {
        steps.push('Audit: Identify trust blockers and mitigation strategies');
    }
    return steps;
}
function getScoreEmoji(score) {
    if (score >= 4)
        return '🟢';
    if (score >= 2.5)
        return '🟡';
    return '🔴';
}
function printReview(result) {
    console.log(chalk.blue.bold('\n═══════════════════════════════════════════'));
    console.log(chalk.blue.bold('     BAT FRAMEWORK CEO REVIEW'));
    console.log(chalk.blue.bold('═══════════════════════════════════════════\n'));
    console.log(chalk.white.bold(`📋 ${result.name}\n`));
    console.log(chalk.gray(result.description));
    console.log();
    // Scores
    console.log(chalk.blue('📊 BAT Scores:'));
    console.log(`  ${getScoreEmoji(result.scores.brand)} Brand:     ${formatScore(result.scores.brand)}/5`);
    console.log(`  ${getScoreEmoji(result.scores.attention)} Attention: ${formatScore(result.scores.attention)}/5`);
    console.log(`  ${getScoreEmoji(result.scores.trust)} Trust:     ${formatScore(result.scores.trust)}/5`);
    console.log(chalk.gray(`  ───────────────────────`));
    console.log(`  ${chalk.bold('Total:')}     ${chalk.bold(result.total.toFixed(1))}/15`);
    console.log(chalk.gray(`  Threshold: ${result.threshold}/15 (2/3 criteria)`));
    console.log();
    // Recommendation
    const recColor = result.recommendation === 'build' ? 'green' :
        result.recommendation === 'consider' ? 'yellow' : 'red';
    const recEmoji = result.recommendation === 'build' ? '✅' :
        result.recommendation === 'consider' ? '⚠️' : '❌';
    console.log(chalk[recColor].bold(`${recEmoji} RECOMMENDATION: ${result.recommendation.toUpperCase().replace('-', ' ')}\n`));
    // Reasoning
    console.log(chalk.blue('🤔 Reasoning:'));
    console.log(result.reasoning);
    console.log();
    // Next Steps
    console.log(chalk.blue('📋 Next Steps:'));
    result.nextSteps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
    });
    console.log(chalk.blue.bold('\n═══════════════════════════════════════════\n'));
}
function formatScore(score) {
    return score.toFixed(1).replace('.0', '');
}
export function printFrameworkExplanation() {
    console.log(chalk.cyan(`
╔════════════════════════════════════════════════════════════════╗
║                 THE BAT FRAMEWORK                              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Three dimensions scored 0-5 stars each:                       ║
║                                                                ║
║  BRAND (0-5)                                                   ║
║  • 5: Revolutionary, defines category, press-worthy            ║
║  • 4: Strong differentiation, innovative                       ║
║  • 3: Good fit, incremental improvement                        ║
║  • 2: Table stakes, me-too feature                             ║
║  • 1: Off-brand, confusing                                     ║
║                                                                ║
║  ATTENTION (0-5)                                               ║
║  • 5: Daily use, core workflow                                 ║
║  • 4: Weekly use, important workflow                           ║
║  • 3: Monthly use, nice-to-have                                ║
║  • 2: Rare use, edge case                                      ║
║  • 1: Nobody asked for this                                    ║
║                                                                ║
║  TRUST (0-5)                                                   ║
║  • 5: Security-critical, data protection                       ║
║  • 4: Reliability-critical, uptime essential                   ║
║  • 3: Transparency, user control                               ║
║  • 2: Error handling, feedback                                 ║
║  • 1: No trust impact                                          ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║  10-STAR METHODOLOGY                                           ║
║                                                                ║
║  12-15 ⭐ BUILD      - Strong signal, proceed with confidence  ║
║  10-11 ⭐ BUILD      - Good signal, validate assumptions       ║
║   8-9  ⭐ CONSIDER   - Mixed signal, need more data            ║
║   0-7  ⭐ DON'T BUILD - Weak signal, focus elsewhere           ║
║                                                                ║
║  Minimum threshold: 10/15 stars to build                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`));
}
//# sourceMappingURL=index.js.map