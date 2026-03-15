export interface BATScores {
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
    success: boolean;
    featureName: string;
    scores: BATScores;
    totalStars: number;
    recommendation: 'build' | 'consider' | 'dont-build';
    reasoning: string[];
    nextSteps: string[];
    error?: string;
}
export declare function planCEOReview(options: CEOReviewOptions): Promise<CEOReviewResult>;
export declare function formatReviewOutput(result: CEOReviewResult): string;
//# sourceMappingURL=index.d.ts.map