export interface Viewport {
    width: number;
    height: number;
}
export interface BrowserConfig {
    defaultViewport: string;
    viewports: Record<string, Viewport>;
    flows: Record<string, string[]>;
    screenshotDir: string;
}
export interface QAPatterns {
    unit: string[];
    integration: string[];
    e2e: string[];
}
export interface FileToTestMapping {
    [pattern: string]: string | string[];
}
export interface QAConfig {
    defaultMode: 'targeted' | 'smoke' | 'full';
    coverageThreshold: number;
    testCommand: string;
    testPatterns: QAPatterns;
    fileToTestMapping: FileToTestMapping;
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
    browser: BrowserConfig;
    qa: QAConfig;
    ship: ShipConfig;
    ceoReview: CEOReviewConfig;
}
/**
 * Load configuration from superpowers.config.json or return defaults
 */
export declare function loadConfig(configPath?: string): SuperpowersConfig;
//# sourceMappingURL=config.d.ts.map