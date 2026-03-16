/**
 * Market analysis for plan-ceo-review skill
 */
export interface MarketAnalysis {
    competitors: string[];
    trend: 'rising' | 'stable' | 'declining' | 'unknown';
    riskLevel: 'low' | 'medium' | 'high' | 'unknown';
    marketSize?: string;
    timing?: string;
}
export interface FeatureOptions {
    feature?: string;
    goal?: string;
    market?: string;
    description?: string;
}
export declare function analyzeMarket(options: FeatureOptions): Promise<MarketAnalysis>;
//# sourceMappingURL=market-analysis.d.ts.map