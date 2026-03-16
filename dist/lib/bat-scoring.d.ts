/**
 * BAT (Brand, Attention, Trust) Framework scoring
 */
export type BATDimension = 'brand' | 'attention' | 'trust';
export interface BATScore {
    dimension: BATDimension;
    score: number;
    reasoning: string;
}
export interface BATEvaluation {
    feature: string;
    goal: string;
    market?: string;
    scores: Record<BATDimension, BATScore>;
    totalScore: number;
    recommendation: 'build' | 'consider' | 'dont-build';
    rationale: string[];
}
export interface BATCriteria {
    score: number;
    label: string;
    description: string;
}
export declare const CRITERIA: Record<BATDimension, BATCriteria[]>;
export declare const DIMENSION_TITLES: Record<BATDimension, string>;
/**
 * Validate a score is within range
 */
export declare function validateScore(score: number): void;
/**
 * Calculate total BAT score
 */
export declare function calculateTotal(scores: Record<BATDimension, number>): number;
/**
 * Get recommendation based on total score
 */
export declare function getRecommendation(totalScore: number, minimumScore?: number): BATEvaluation['recommendation'];
/**
 * Get criteria description for a score
 */
export declare function getCriteriaDescription(_dim: BATDimension, score: number): string;
/**
 * Generate stars display
 */
export declare function getStars(score: number): string;
/**
 * Evaluate BAT scores
 */
export declare function evaluateBAT(feature: string, goal: string, scores: Record<BATDimension, number>, market?: string, options?: {
    minimumScore?: number;
    requireAllBAT?: boolean;
}): BATEvaluation;
/**
 * Format BAT evaluation for display
 */
export declare function formatBATEvaluation(evaluation: BATEvaluation): string;
/**
 * Get recommendation table
 */
export declare function getRecommendationTable(): string;
//# sourceMappingURL=bat-scoring.d.ts.map