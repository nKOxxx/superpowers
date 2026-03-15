export interface BATScore {
    brand: number;
    attention: number;
    trust: number;
}
export interface BATEvaluation {
    score: BATScore;
    total: number;
    rationale: {
        brand: string;
        attention: string;
        trust: string;
    };
    recommendation: 'BUILD' | 'CONSIDER' | 'DONT_BUILD';
    nextSteps: string[];
}
export declare function calculateBATScore(feature: string, brandScore: number, attentionScore: number, trustScore: number): BATEvaluation;
export declare function formatStarRating(score: number): string;
export declare function formatBATOutput(evaluation: BATEvaluation, feature: string): string;
//# sourceMappingURL=bat.d.ts.map