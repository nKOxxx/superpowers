import chalk from 'chalk';
export function calculateDecision(total) {
    if (total >= 12)
        return 'build';
    if (total >= 8)
        return 'consider';
    return 'dont-build';
}
export function getDecisionLabel(decision) {
    switch (decision) {
        case 'build':
            return chalk.green.bold('🚀 BUILD');
        case 'consider':
            return chalk.yellow.bold('🤔 CONSIDER');
        case 'dont-build':
            return chalk.red.bold('❌ DON\'T BUILD');
    }
}
export function getDecisionDescription(decision) {
    switch (decision) {
        case 'build':
            return 'This feature scores highly on all three dimensions. It strengthens your brand, captures attention, and builds trust. Prioritize this.';
        case 'consider':
            return 'This feature has potential but needs refinement. Review the scores to see which dimensions need improvement before building.';
        case 'dont-build':
            return 'This feature scores low on critical dimensions. Either redesign significantly or deprioritize in favor of higher-impact work.';
    }
}
export function generateNextSteps(result) {
    const steps = [];
    if (result.decision === 'build') {
        steps.push('Add to roadmap with high priority');
        steps.push('Define success metrics for launch');
        steps.push('Allocate resources and set timeline');
    }
    else if (result.decision === 'consider') {
        if (result.scores.brand < 4) {
            steps.push('Brand: Consider how this aligns with your core identity');
            steps.push('Brand: Explore ways to make this more distinctive to your brand');
        }
        if (result.scores.attention < 4) {
            steps.push('Attention: Research user demand more deeply');
            steps.push('Attention: Consider a smaller MVP to test engagement');
        }
        if (result.scores.trust < 4) {
            steps.push('Trust: Identify and mitigate potential trust concerns');
            steps.push('Trust: Consider phased rollout with feedback loops');
        }
        steps.push('Re-evaluate with improved proposal in 2-4 weeks');
    }
    else {
        steps.push('Deprioritize this feature');
        steps.push('Document why it was rejected (for future reference)');
        steps.push('If critical, require complete redesign proposal');
        steps.push('Focus team on higher-scoring opportunities');
    }
    return steps;
}
export function autoScore(featureName, description) {
    const text = `${featureName} ${description || ''}`.toLowerCase();
    // Brand indicators
    const brandKeywords = ['brand', 'identity', 'premium', 'unique', 'exclusive', 'signature', 'iconic', 'differentiator'];
    const brandScore = Math.min(5, 2 + brandKeywords.filter(k => text.includes(k)).length);
    // Attention indicators  
    const attentionKeywords = ['viral', 'share', 'engage', 'grow', 'trend', 'demand', 'popular', 'attention', 'acquisition'];
    const attentionScore = Math.min(5, 2 + attentionKeywords.filter(k => text.includes(k)).length);
    // Trust indicators
    const trustKeywords = ['secure', 'private', 'transparent', 'verified', 'trust', 'reliable', 'safe', 'authentic', 'proven'];
    const trustScore = Math.min(5, 2 + trustKeywords.filter(k => text.includes(k)).length);
    return {
        brand: brandScore,
        attention: attentionScore,
        trust: trustScore
    };
}
export function getScoreLabel(score) {
    if (score >= 5)
        return chalk.green('Exceptional');
    if (score >= 4)
        return chalk.green('Strong');
    if (score >= 3)
        return chalk.yellow('Moderate');
    if (score >= 2)
        return chalk.red('Weak');
    return chalk.red('Critical');
}
export function renderScoreBar(score, max = 5) {
    const filled = '█'.repeat(score);
    const empty = '░'.repeat(max - score);
    const color = score >= 4 ? chalk.green : score >= 3 ? chalk.yellow : chalk.red;
    return color(`${filled}${empty} ${score}/${max}`);
}
export function planCEOReview(options) {
    console.log(chalk.blue.bold('\n📊 CEO Review - BAT Framework\n'));
    console.log(chalk.white.bold(`Feature: ${options.featureName}`));
    if (options.description) {
        console.log(chalk.gray(`Description: ${options.description}`));
    }
    console.log();
    let scores;
    if (options.autoScore || (options.brand === undefined && options.attention === undefined && options.trust === undefined)) {
        // Auto-score based on keywords
        scores = autoScore(options.featureName, options.description);
        console.log(chalk.yellow('🤖 Auto-scoring based on feature description...\n'));
    }
    else {
        scores = {
            brand: options.brand ?? 3,
            attention: options.attention ?? 3,
            trust: options.trust ?? 3
        };
    }
    const total = scores.brand + scores.attention + scores.trust;
    const decision = calculateDecision(total);
    // Render scores
    console.log(chalk.white.bold('BAT Scores:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  ${chalk.cyan('Brand:')}      ${renderScoreBar(scores.brand)}`);
    console.log(`             ${chalk.gray('Does this strengthen our brand?')}`);
    console.log(`             ${getScoreLabel(scores.brand)}`);
    console.log();
    console.log(`  ${chalk.cyan('Attention:')}  ${renderScoreBar(scores.attention)}`);
    console.log(`             ${chalk.gray('Will users engage with this?')}`);
    console.log(`             ${getScoreLabel(scores.attention)}`);
    console.log();
    console.log(`  ${chalk.cyan('Trust:')}      ${renderScoreBar(scores.trust)}`);
    console.log(`             ${chalk.gray('Does this build user confidence?')}`);
    console.log(`             ${getScoreLabel(scores.trust)}`);
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  ${chalk.cyan('Total:')}      ${renderScoreBar(total, 15)}`);
    console.log();
    // Render decision
    console.log(chalk.white.bold('Decision:'));
    console.log(`  ${getDecisionLabel(decision)}`);
    console.log(`  ${chalk.gray(getDecisionDescription(decision))}`);
    console.log();
    // Generate next steps
    const nextSteps = generateNextSteps({
        featureName: options.featureName,
        description: options.description,
        scores,
        total,
        decision,
        nextSteps: []
    });
    console.log(chalk.white.bold('Next Steps:'));
    nextSteps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
    });
    console.log(chalk.gray('\n─'.repeat(50)));
    console.log(chalk.gray('10-Star Methodology: 12-15 = BUILD | 8-11 = CONSIDER | 0-7 = DON\'T BUILD'));
    console.log();
    return {
        featureName: options.featureName,
        description: options.description,
        scores,
        total,
        decision,
        nextSteps
    };
}
export { chalk };
//# sourceMappingURL=index.js.map