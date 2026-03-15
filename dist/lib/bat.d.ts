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
export declare function calculateBATScore(feature: string, brand: number, attention: number, trust: number): BATResult;
/**
 * Format a score as star rating string
 */
export declare function formatStarRating(score: number): string;
