export interface ViewportConfig {
    width: number;
    height: number;
}
export interface BrowserConfig {
    defaultViewport: string;
    screenshotDir: string;
    viewports: Record<string, ViewportConfig>;
    flows: Record<string, string[]>;
    timeout: number;
}
export interface QAConfig {
    defaultMode: 'targeted' | 'smoke' | 'full';
    coverageThreshold: number;
    testCommand: string;
    testPatterns: {
        unit: string[];
        integration: string[];
        e2e: string[];
    };
}
export interface ChangelogConfig {
    preset: string;
    includeContributors: boolean;
}
export interface GitHubConfig {
    defaultOrg: string;
}
export interface TelegramConfig {
    notifyOnShip: boolean;
}
export interface ShipConfig {
    requireCleanWorkingDir: boolean;
    runTestsBeforeRelease: boolean;
    testCommand: string;
    changelog: ChangelogConfig;
    github: GitHubConfig;
    telegram: TelegramConfig;
}
export interface CEOReviewConfig {
    minimumScore: number;
    requireAllBAT: boolean;
    autoGenerateNextSteps: boolean;
    marketAnalysis: boolean;
}
export interface SuperpowersConfig {
    browser?: Partial<BrowserConfig>;
    qa?: Partial<QAConfig>;
    ship?: Partial<ShipConfig>;
    ceoReview?: Partial<CEOReviewConfig>;
}
export declare const defaultConfig: SuperpowersConfig;
export declare function loadConfig(cwd?: string): Promise<SuperpowersConfig>;
export declare function getConfig(): SuperpowersConfig;
//# sourceMappingURL=config.d.ts.map