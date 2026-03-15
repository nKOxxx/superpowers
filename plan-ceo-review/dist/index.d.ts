export interface BATScores {
    brand: number;
    attention: number;
    trust: number;
}
export interface CEOReviewOptions {
    feature: string;
    brand?: number;
    attention?: number;
    trust?: number;
    description?: string;
}
export interface CEOReviewResult {
    feature: string;
    description?: string;
    scores: BATScores;
    totalScore: number;
    recommendation: 'BUILD' | 'CONSIDER' | "DON'T BUILD";
    reasoning: string;
    nextSteps: string[];
}
export declare function calculateRecommendation(totalScore: number): 'BUILD' | 'CONSIDER' | "DON'T BUILD";
export declare function generateReasoning(scores: BATScores, totalScore: number): string;
export declare function generateNextSteps(recommendation: 'BUILD' | 'CONSIDER' | "DON'T BUILD", feature: string): string[];
export declare function ceoReview(options: CEOReviewOptions): CEOReviewResult;
export declare const brandQuestions: string[];
export declare const attentionQuestions: string[];
export declare const trustQuestions: string[];
//# sourceMappingURL=index.d.ts.map