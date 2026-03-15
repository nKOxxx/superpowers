#!/usr/bin/env node
type BATScore = 0 | 1 | 2 | 3 | 4 | 5;
type Recommendation = 'BUILD' | 'CONSIDER' | "DON'T BUILD";
type Confidence = 'low' | 'medium' | 'high';
interface DimensionScore {
    score: BATScore;
    rationale: string;
}
interface BATAnalysis {
    brand: DimensionScore;
    attention: DimensionScore;
    trust: DimensionScore;
}
interface CEOReviewResult {
    question: string;
    bat: BATAnalysis;
    totalScore: number;
    stars: string;
    recommendation: Recommendation;
    confidence: Confidence;
    risks: string[];
    nextSteps: string[];
}
interface ReviewOptions {
    question: string;
    brand?: BATScore;
    attention?: BATScore;
    trust?: BATScore;
    autoScore: boolean;
    json: boolean;
}
export declare function review(options: ReviewOptions): CEOReviewResult;
export {};
