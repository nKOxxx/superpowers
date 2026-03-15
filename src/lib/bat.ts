import type { BATScores, Recommendation } from '../types/index.js';

export interface BATResult {
  feature: string;
  score: BATScores;
  total: number;
  recommendation: Recommendation;
}

/**
 * Calculate BAT (Brand, Attention, Trust) scores for a feature
 */
export function calculateBATScore(
  feature: string,
  brand: number,
  attention: number,
  trust: number
): BATResult {
  // Clamp scores to 0-5 range
  const clampedScores: BATScores = {
    brand: Math.max(0, Math.min(5, brand)),
    attention: Math.max(0, Math.min(5, attention)),
    trust: Math.max(0, Math.min(5, trust)),
  };

  const total = clampedScores.brand + clampedScores.attention + clampedScores.trust;

  let recommendation: Recommendation;
  if (total >= 12) {
    recommendation = 'BUILD';
  } else if (total >= 10) {
    recommendation = 'BUILD';
  } else if (total >= 8) {
    recommendation = 'CONSIDER';
  } else {
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
export function formatStarRating(score: number): string {
  const clamped = Math.max(0, Math.min(5, score));
  const filled = '⭐'.repeat(clamped);
  const empty = '⬜'.repeat(5 - clamped);
  return filled + empty;
}
