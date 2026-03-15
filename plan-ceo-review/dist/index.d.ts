interface BATScore {
    brand: number;
    attention: number;
    trust: number;
}
interface ReviewResult {
    product: string;
    scores: BATScore;
    reasoning: {
        brand: string;
        attention: string;
        trust: string;
    };
    total: number;
    normalized: number;
    recommendation: 'BUILD' | 'CONSIDER' | "DON'T BUILD";
    nextSteps: string[];
}
declare function parseArgs(): string;
declare function analyzeBAT(product: string): ReviewResult;
declare function generateReasoning(dimension: string, score: number, product: string): string;
declare function generateNextSteps(rec: 'BUILD' | 'CONSIDER' | "DON'T BUILD", product: string): string[];
declare function printReview(result: ReviewResult): void;
declare const product: string;
declare const result: ReviewResult;
