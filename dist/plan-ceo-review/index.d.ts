/**
 * Plan CEO Review Skill - BAT Framework for Product Strategy
 *
 * Usage: /plan-ceo-review "<product description>" [--brand=X] [--attention=X] [--trust=X]
 *
 * BAT Framework: Brand, Attention, Trust (0-5 each, 10+ to build)
 */
import { CEORReviewInput, BATScore, SkillResult } from '../types.js';
export declare class CEOReviewSkill {
    execute(input: CEORReviewInput, scores?: BATScore): SkillResult;
    private calculateScores;
    private getRecommendation;
    private getStrengthArea;
    private getWeaknessArea;
    private generateNextSteps;
    private formatResult;
    private scoreBar;
}
export declare function run(args: string[]): Promise<SkillResult>;
//# sourceMappingURL=index.d.ts.map