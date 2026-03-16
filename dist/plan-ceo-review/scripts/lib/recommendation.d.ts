/**
 * Recommendation generator for plan-ceo-review skill
 */
import { BATEvaluation } from './bat-scoring.js';
import { MarketAnalysis } from './market-analysis.js';
import { CEOConfig } from './config.js';
export interface Recommendation {
    build: boolean;
    confidence: number;
    reasoning: string[];
    nextSteps?: string[];
}
export declare function generateRecommendation(bat: BATEvaluation, marketAnalysis?: MarketAnalysis, config?: CEOConfig): Recommendation;
//# sourceMappingURL=recommendation.d.ts.map