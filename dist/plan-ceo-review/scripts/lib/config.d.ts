/**
 * Configuration loader for plan-ceo-review skill
 */
export interface CEOConfig {
    ceoReview?: {
        minimumScore?: number;
        requireAllBAT?: boolean;
        autoGenerateNextSteps?: boolean;
        marketAnalysis?: boolean;
    };
}
export declare function loadConfig(): Promise<CEOConfig>;
//# sourceMappingURL=config.d.ts.map