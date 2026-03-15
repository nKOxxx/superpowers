import { calculateBATScore } from '../lib/bat.js';
export interface CEOReviewOptions {
    feature: string;
    goal?: string;
    market?: string;
    brandScore?: number;
    attentionScore?: number;
    trustScore?: number;
}
export interface CEOReviewResult {
    feature: string;
    evaluation: ReturnType<typeof calculateBATScore>;
    recommendation: string;
}
export declare function planCEOReview(options: CEOReviewOptions): Promise<CEOReviewResult>;
//# sourceMappingURL=plan-ceo-review.d.ts.map