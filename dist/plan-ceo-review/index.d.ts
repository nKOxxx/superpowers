export interface BATScores {
    brand: number;
    attention: number;
    trust: number;
}
export interface CEORReviewOptions {
    feature: string;
    description?: string;
    scores?: BATScores;
    autoScore?: boolean;
}
export interface CEORReviewResult {
    feature: string;
    description?: string;
    scores: BATScores;
    totalScore: number;
    recommendation: 'build' | 'consider' | 'dont-build';
    reasoning: string;
    nextSteps: string[];
}
export declare class PlanCEOReviewSkill {
    private calculateAutoScores;
    private getRecommendation;
    private generateNextSteps;
    review(options: CEORReviewOptions): Promise<CEORReviewResult>;
    formatReview(result: CEORReviewResult): string;
}
//# sourceMappingURL=index.d.ts.map