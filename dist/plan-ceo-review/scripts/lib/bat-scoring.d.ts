/**
 * BAT (Brand, Attention, Trust) scoring framework
 */
export interface BATScores {
    brand: number;
    attention: number;
    trust: number;
}
export interface BATRationale {
    brand: string;
    attention: string;
    trust: string;
}
export interface BATEvaluation extends BATScores {
    total: number;
    rationale: BATRationale;
}
export interface FeatureOptions {
    feature?: string;
    goal?: string;
    market?: string;
    description?: string;
}
export declare function evaluateBAT(options: FeatureOptions): Promise<BATEvaluation>;
//# sourceMappingURL=bat-scoring.d.ts.map