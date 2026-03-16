/**
 * BAT (Brand, Attention, Trust) Framework scoring
 */
const BRAND_CRITERIA = [
    { score: 5, label: 'Iconic', description: 'Defines the category, becomes synonymous with the brand' },
    { score: 4, label: 'Differentiated', description: 'Strongly memorable, clearly different from competitors' },
    { score: 3, label: 'Quality', description: 'Good quality, meets user expectations' },
    { score: 2, label: 'Mediocre', description: 'Forgettable, doesn\'t stand out' },
    { score: 1, label: 'Weak', description: 'Weakens brand perception' },
    { score: 0, label: 'Damaging', description: 'Actively harms brand reputation' }
];
const ATTENTION_CRITERIA = [
    { score: 5, label: 'Daily Use', description: 'Core workflow, used every day by power users' },
    { score: 4, label: 'Weekly Use', description: 'High value feature, used weekly' },
    { score: 3, label: 'Monthly Use', description: 'Nice to have, used occasionally' },
    { score: 2, label: 'Rare Use', description: 'Rarely used, low value' },
    { score: 1, label: 'Never Used', description: 'Wasted effort, nobody uses it' },
    { score: 0, label: 'Abandoned', description: 'Users actively avoid it' }
];
const TRUST_CRITERIA = [
    { score: 5, label: 'Critical Safety', description: 'Critical safety or security feature' },
    { score: 4, label: 'Reliability', description: 'Significant reliability improvement' },
    { score: 3, label: 'Standard', description: 'Expected standard, table stakes' },
    { score: 2, label: 'Minor Impact', description: 'Minor trust impact' },
    { score: 1, label: 'Questionable', description: 'May erode trust if done poorly' },
    { score: 0, label: 'Eroding', description: 'Actively erodes user trust' }
];
export const CRITERIA = {
    brand: BRAND_CRITERIA,
    attention: ATTENTION_CRITERIA,
    trust: TRUST_CRITERIA
};
export const DIMENSION_TITLES = {
    brand: 'Brand',
    attention: 'Attention',
    trust: 'Trust'
};
/**
 * Validate a score is within range
 */
export function validateScore(score) {
    if (!Number.isInteger(score) || score < 0 || score > 5) {
        throw new Error('Score must be an integer between 0 and 5');
    }
}
/**
 * Calculate total BAT score
 */
export function calculateTotal(scores) {
    return scores.brand + scores.attention + scores.trust;
}
/**
 * Get recommendation based on total score
 */
export function getRecommendation(totalScore, minimumScore = 10) {
    if (totalScore >= 12) {
        return 'build';
    }
    else if (totalScore >= minimumScore) {
        return 'build';
    }
    else if (totalScore >= 8) {
        return 'consider';
    }
    else {
        return 'dont-build';
    }
}
/**
 * Get criteria description for a score
 */
export function getCriteriaDescription(_dim, score) {
    const criteria = CRITERIA[_dim].find(c => c.score === score);
    return criteria?.description || 'Unknown';
}
/**
 * Generate stars display
 */
export function getStars(score) {
    const filled = '⭐'.repeat(score);
    const empty = '⚫'.repeat(5 - score);
    return filled + empty;
}
/**
 * Evaluate BAT scores
 */
export function evaluateBAT(feature, goal, scores, market, options = {}) {
    const { minimumScore = 10, requireAllBAT = false } = options;
    // Validate scores
    for (const [, score] of Object.entries(scores)) {
        validateScore(score);
    }
    const totalScore = calculateTotal(scores);
    const recommendation = getRecommendation(totalScore, minimumScore);
    // Check if all BAT dimensions meet minimum threshold
    if (requireAllBAT) {
        const allPass = Object.values(scores).every(s => s >= 3);
        if (!allPass && recommendation === 'build') {
            return {
                feature,
                goal,
                market,
                scores: {
                    brand: { dimension: 'brand', score: scores.brand, reasoning: getCriteriaDescription('brand', scores.brand) },
                    attention: { dimension: 'attention', score: scores.attention, reasoning: getCriteriaDescription('attention', scores.attention) },
                    trust: { dimension: 'trust', score: scores.trust, reasoning: getCriteriaDescription('trust', scores.trust) }
                },
                totalScore,
                recommendation: 'consider',
                rationale: ['Requires all BAT dimensions to score 3+ when requireAllBAT is enabled']
            };
        }
    }
    // Generate rationale
    const rationale = [];
    const highestDimension = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])[0];
    const lowestDimension = Object.entries(scores)
        .sort((a, b) => a[1] - b[1])[0];
    rationale.push(`Strongest in ${DIMENSION_TITLES[highestDimension[0]]} (${highestDimension[1]}/5)`);
    if (lowestDimension[1] < 3) {
        rationale.push(`Weakness in ${DIMENSION_TITLES[lowestDimension[0]]} (${lowestDimension[1]}/5)`);
    }
    if (scores.attention >= 4) {
        rationale.push('High engagement potential (daily/weekly use)');
    }
    if (scores.brand >= 4) {
        rationale.push('Strong brand differentiation opportunity');
    }
    if (scores.trust >= 4) {
        rationale.push('Builds significant user trust');
    }
    return {
        feature,
        goal,
        market,
        scores: {
            brand: { dimension: 'brand', score: scores.brand, reasoning: getCriteriaDescription('brand', scores.brand) },
            attention: { dimension: 'attention', score: scores.attention, reasoning: getCriteriaDescription('attention', scores.attention) },
            trust: { dimension: 'trust', score: scores.trust, reasoning: getCriteriaDescription('trust', scores.trust) }
        },
        totalScore,
        recommendation,
        rationale
    };
}
/**
 * Format BAT evaluation for display
 */
export function formatBATEvaluation(evaluation) {
    const lines = [
        `CEO Review: ${evaluation.feature}`,
        '===================================',
        '',
        `Feature: ${evaluation.feature}`,
        `Goal: ${evaluation.goal}`
    ];
    if (evaluation.market) {
        lines.push(`Market: ${evaluation.market}`);
    }
    lines.push('');
    lines.push('BAT Evaluation:');
    lines.push('---------------');
    for (const [dimension, score] of Object.entries(evaluation.scores)) {
        const dim = dimension;
        lines.push(`${DIMENSION_TITLES[dim]}: ${getStars(score.score)} (${score.score}/5) - ${score.reasoning}`);
    }
    lines.push('');
    lines.push(`Total: ${evaluation.totalScore}/15 ${getStars(Math.round(evaluation.totalScore / 3))}`);
    lines.push('');
    const recEmoji = evaluation.recommendation === 'build' ? '✅' :
        evaluation.recommendation === 'consider' ? '⚠️' : '❌';
    const recText = evaluation.recommendation === 'build' ? 'BUILD' :
        evaluation.recommendation === 'consider' ? 'CONSIDER CAREFULLY' : 'DON\'T BUILD';
    lines.push(`Recommendation: ${recEmoji} ${recText}`);
    lines.push('');
    if (evaluation.rationale.length > 0) {
        lines.push('Rationale:');
        for (const reason of evaluation.rationale) {
            lines.push(`  • ${reason}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
/**
 * Get recommendation table
 */
export function getRecommendationTable() {
    return `
Score Range | Recommendation
------------|-----------------
12-15       | Build immediately
10-11       | Build with confidence
8-9         | Consider carefully
5-7         | Probably don't build
0-4         | Don't build
`.trim();
}
//# sourceMappingURL=bat-scoring.js.map