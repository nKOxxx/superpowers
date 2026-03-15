import chalk from 'chalk';
export interface BATScore {
    brand: number;
    attention: number;
    trust: number;
}
export interface CEOReviewOptions {
    featureName: string;
    description?: string;
    brand?: number;
    attention?: number;
    trust?: number;
    autoScore?: boolean;
}
export interface CEOReviewResult {
    featureName: string;
    description?: string;
    scores: BATScore;
    total: number;
    decision: 'build' | 'consider' | 'dont-build';
    nextSteps: string[];
}
export declare function calculateDecision(total: number): 'build' | 'consider' | 'dont-build';
export declare function getDecisionLabel(decision: 'build' | 'consider' | 'dont-build'): string;
export declare function getDecisionDescription(decision: 'build' | 'consider' | 'dont-build'): string;
export declare function generateNextSteps(result: CEOReviewResult): string[];
export declare function autoScore(featureName: string, description?: string): BATScore;
export declare function getScoreLabel(score: number): string;
export declare function renderScoreBar(score: number, max?: number): string;
export declare function planCEOReview(options: CEOReviewOptions): CEOReviewResult;
export { chalk };
//# sourceMappingURL=index.d.ts.map