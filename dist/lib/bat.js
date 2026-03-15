"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBATScore = calculateBATScore;
exports.formatStarRating = formatStarRating;
/**
 * Calculate BAT (Brand, Attention, Trust) scores for a feature
 */
function calculateBATScore(feature, brand, attention, trust) {
    // Clamp scores to 0-5 range
    const clampedScores = {
        brand: Math.max(0, Math.min(5, brand)),
        attention: Math.max(0, Math.min(5, attention)),
        trust: Math.max(0, Math.min(5, trust)),
    };
    const total = clampedScores.brand + clampedScores.attention + clampedScores.trust;
    let recommendation;
    if (total >= 10) {
        recommendation = 'BUILD';
    }
    else if (total >= 7) {
        recommendation = 'CONSIDER';
    }
    else {
        recommendation = "DON'T BUILD";
    }
    return {
        feature,
        score: clampedScores,
        total,
        recommendation,
    };
}
/**
 * Format a score as star rating string
 */
function formatStarRating(score) {
    const clamped = Math.max(0, Math.min(5, score));
    const filled = '⭐'.repeat(clamped);
    const empty = '⬜'.repeat(5 - clamped);
    return filled + empty;
}
//# sourceMappingURL=bat.js.map