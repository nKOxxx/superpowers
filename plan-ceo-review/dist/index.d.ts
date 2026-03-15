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
interface SkillContext {
    args: string[];
    options: Record<string, string | boolean>;
    channel?: string;
    userId?: string;
}
interface SkillResult {
    success: boolean;
    message: string;
    data?: CEOReviewResult;
    error?: string;
    interactive?: boolean;
    buttons?: Array<{
        text: string;
        callback_data: string;
    }>;
}
export declare function handler(context: SkillContext): Promise<SkillResult>;
export declare function handleCallback(callbackData: string, currentState: any): SkillResult;
export {};
