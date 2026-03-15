"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBATScore = calculateBATScore;
exports.formatStarRating = formatStarRating;
exports.formatBATOutput = formatBATOutput;
function calculateBATScore(feature, brandScore, attentionScore, trustScore) {
    const score = {
        brand: Math.max(0, Math.min(5, brandScore)),
        attention: Math.max(0, Math.min(5, attentionScore)),
        trust: Math.max(0, Math.min(5, trustScore))
    };
    const total = score.brand + score.attention + score.trust;
    let recommendation;
    if (total >= 10) {
        recommendation = 'BUILD';
    }
    else if (total >= 7) {
        recommendation = 'CONSIDER';
    }
    else {
        recommendation = 'DONT_BUILD';
    }
    const rationale = generateRationale(score, feature);
    const nextSteps = generateNextSteps(recommendation, feature);
    return {
        score,
        total,
        rationale,
        recommendation,
        nextSteps
    };
}
function generateRationale(score, feature) {
    const brandDescriptions = {
        5: 'Iconic feature that defines category leadership',
        4: 'Strongly differentiated and memorable',
        3: 'Good quality, meets expectations',
        2: 'Mediocre, somewhat forgettable',
        1: 'Weakens brand perception',
        0: 'No brand impact or negative'
    };
    const attentionDescriptions = {
        5: 'Daily use, core to user workflow',
        4: 'Weekly use, high value engagement',
        3: 'Monthly use, nice to have',
        2: 'Rarely used, low value',
        1: 'Almost never used',
        0: 'No user attention expected'
    };
    const trustDescriptions = {
        5: 'Critical safety/security feature',
        4: 'Significant reliability improvement',
        3: 'Expected standard feature',
        2: 'Minor trust impact',
        1: 'Negligible trust benefit',
        0: 'Erodes trust'
    };
    return {
        brand: brandDescriptions[score.brand] || 'Unknown',
        attention: attentionDescriptions[score.attention] || 'Unknown',
        trust: trustDescriptions[score.trust] || 'Unknown'
    };
}
function generateNextSteps(recommendation, feature) {
    switch (recommendation) {
        case 'BUILD':
            return [
                'Prioritize in next sprint',
                'Create detailed technical spec',
                'Define success metrics',
                'Schedule implementation kickoff'
            ];
        case 'CONSIDER':
            return [
                'Gather more user feedback',
                'Analyze competitor implementations',
                'Estimate implementation cost',
                'Re-evaluate in 2-4 weeks'
            ];
        case 'DONT_BUILD':
            return [
                'Document decision rationale',
                'Monitor for changing conditions',
                'Consider alternative approaches',
                'Focus resources on higher priority features'
            ];
    }
}
function formatStarRating(score) {
    const filled = '⭐'.repeat(score);
    const empty = '⬜'.repeat(5 - score);
    return filled + empty;
}
function formatBATOutput(evaluation, feature) {
    const lines = [];
    lines.push(`CEO Review: ${feature}`);
    lines.push('');
    lines.push('BAT Evaluation:');
    lines.push(`  Brand:     ${formatStarRating(evaluation.score.brand)} (${evaluation.score.brand}/5)`);
    lines.push(`             ${evaluation.rationale.brand}`);
    lines.push(`  Attention: ${formatStarRating(evaluation.score.attention)} (${evaluation.score.attention}/5)`);
    lines.push(`             ${evaluation.rationale.attention}`);
    lines.push(`  Trust:     ${formatStarRating(evaluation.score.trust)} (${evaluation.score.trust}/5)`);
    lines.push(`             ${evaluation.rationale.trust}`);
    lines.push('');
    lines.push(`Total Score: ${evaluation.total}/15 ⭐`);
    lines.push('');
    lines.push(`Recommendation: ${evaluation.recommendation}`);
    lines.push('');
    lines.push('Next Steps:');
    evaluation.nextSteps.forEach((step, i) => {
        lines.push(`  ${i + 1}. ${step}`);
    });
    return lines.join('\n');
}
//# sourceMappingURL=bat.js.map