/**
 * Market analysis utilities for product strategy
 */
export interface Competitor {
    name: string;
    strengths: string[];
    weaknesses: string[];
    marketShare?: string;
}
export interface MarketAnalysis {
    market: string;
    size?: string;
    growth?: string;
    competitors: Competitor[];
    trends: string[];
    opportunities: string[];
    threats: string[];
}
export interface FeasibilityAnalysis {
    technical: {
        score: number;
        complexity: 'low' | 'medium' | 'high';
        risks: string[];
    };
    business: {
        score: number;
        impact: 'low' | 'medium' | 'high';
        revenue?: string;
        timeline: string;
    };
    resources: {
        score: number;
        team: string;
        budget?: string;
        constraints: string[];
    };
}
/**
 * Get template for market analysis
 */
export declare function getMarketTemplate(market: string): MarketAnalysis;
/**
 * Analyze feasibility based on complexity factors
 */
export declare function analyzeFeasibility(_featureName: string, options?: {
    complexity?: 'low' | 'medium' | 'high';
    teamSize?: number;
    timeline?: string;
    dependencies?: string[];
}): FeasibilityAnalysis;
/**
 * Generate next steps for a feature
 */
export declare function generateNextSteps(featureName: string, feasibility: FeasibilityAnalysis): string[];
/**
 * Format market analysis for display
 */
export declare function formatMarketAnalysis(analysis: MarketAnalysis): string;
/**
 * Format feasibility analysis for display
 */
export declare function formatFeasibilityAnalysis(analysis: FeasibilityAnalysis): string;
/**
 * Get market insights template
 */
export declare function getMarketInsightsTemplate(feature: string, market: string): string;
//# sourceMappingURL=market-analysis.d.ts.map