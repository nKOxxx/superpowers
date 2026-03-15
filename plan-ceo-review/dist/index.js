export function calculateRecommendation(totalScore) {
    if (totalScore >= 12)
        return 'BUILD';
    if (totalScore >= 8)
        return 'CONSIDER';
    return "DON'T BUILD";
}
export function generateReasoning(scores, totalScore) {
    const parts = [];
    // Brand analysis
    if (scores.brand >= 4) {
        parts.push('Strong brand alignment - this reinforces our identity.');
    }
    else if (scores.brand >= 3) {
        parts.push('Neutral brand impact - neither strengthens nor weakens our position.');
    }
    else {
        parts.push('Weak brand fit - may dilute our core message.');
    }
    // Attention analysis
    if (scores.attention >= 4) {
        parts.push('High attention potential - users will engage actively.');
    }
    else if (scores.attention >= 3) {
        parts.push('Moderate attention - decent engagement expected.');
    }
    else {
        parts.push('Low attention value - users may ignore this feature.');
    }
    // Trust analysis
    if (scores.trust >= 4) {
        parts.push('Strong trust builder - deepens user confidence.');
    }
    else if (scores.trust >= 3) {
        parts.push('Neutral trust impact - maintains current levels.');
    }
    else {
        parts.push('Trust risk - may raise concerns or skepticism.');
    }
    // Overall
    if (totalScore >= 12) {
        parts.push('Overall: Strong strategic fit. Worth prioritizing.');
    }
    else if (totalScore >= 8) {
        parts.push('Overall: Evaluate carefully. Consider scope or approach adjustments.');
    }
    else {
        parts.push('Overall: Poor strategic fit. Resources better spent elsewhere.');
    }
    return parts.join(' ');
}
export function generateNextSteps(recommendation, feature) {
    const steps = [];
    switch (recommendation) {
        case 'BUILD':
            steps.push(`Prioritize ${feature} in next sprint`);
            steps.push('Assign design resources for UX mockups');
            steps.push('Define MVP scope and success metrics');
            steps.push('Prepare technical architecture document');
            break;
        case 'CONSIDER':
            steps.push(`Conduct user research to validate ${feature} assumptions`);
            steps.push('Analyze competitive landscape');
            steps.push('Re-evaluate BAT scores after research');
            steps.push('Consider MVP variant to test hypothesis');
            break;
        case "DON'T BUILD":
            steps.push(`Document ${feature} rejection rationale`);
            steps.push('Revisit if market conditions change');
            steps.push('Redirect resources to higher-scoring initiatives');
            break;
    }
    return steps;
}
export function ceoReview(options) {
    const scores = {
        brand: options.brand ?? 3,
        attention: options.attention ?? 3,
        trust: options.trust ?? 3
    };
    const totalScore = scores.brand + scores.attention + scores.trust;
    const recommendation = calculateRecommendation(totalScore);
    return {
        feature: options.feature,
        description: options.description,
        scores,
        totalScore,
        recommendation,
        reasoning: generateReasoning(scores, totalScore),
        nextSteps: generateNextSteps(recommendation, options.feature)
    };
}
// Interactive prompts for scoring
export const brandQuestions = [
    'Does this feature align with our core brand values? (1-5)',
    'Would users associate this feature with our brand? (1-5)',
    'Does this differentiate us from competitors? (1-5)'
];
export const attentionQuestions = [
    'Will users actively seek out this feature? (1-5)',
    'Is there viral/sharing potential? (1-5)',
    'Will this generate word-of-mouth? (1-5)'
];
export const trustQuestions = [
    'Does this build user confidence in our platform? (1-5)',
    'Are we the right provider for this feature? (1-5)',
    'Would users trust us with data this feature requires? (1-5)'
];
//# sourceMappingURL=index.js.map