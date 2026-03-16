/**
 * Configuration loader for QA skill
 */
export interface QAConfig {
    qa?: {
        defaultMode?: 'targeted' | 'smoke' | 'full';
        coverageThreshold?: number;
        testCommand?: string;
        testPatterns?: {
            unit?: string[];
            integration?: string[];
            e2e?: string[];
        };
    };
}
export declare function loadConfig(): Promise<QAConfig>;
//# sourceMappingURL=config.d.ts.map