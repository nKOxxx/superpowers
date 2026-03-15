/** Viewport preset definitions */
export interface Viewport {
    width: number;
    height: number;
}
export type ViewportPreset = 'mobile' | 'tablet' | 'desktop' | 'wide';
export declare const VIEWPORT_PRESETS: Record<ViewportPreset, Viewport>;
/** Browser flow action types */
export type ActionType = 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'screenshot';
export interface FlowAction {
    type: ActionType;
    selector?: string;
    text?: string;
    delay?: number;
}
export interface FlowStep {
    name: string;
    url: string;
    actions?: FlowAction[];
}
/** Configuration types */
export interface BrowserConfig {
    defaultViewport?: ViewportPreset | string;
    screenshotDir?: string;
    viewports?: Record<string, Viewport>;
    flows?: Record<string, FlowStep[]>;
}
export interface QAConfig {
    defaultMode?: 'targeted' | 'smoke' | 'full';
    testCommand?: string;
    coverageCommand?: string;
    coverageThreshold?: number;
}
export interface ShipConfig {
    requireCleanWorkingDir?: boolean;
    runTestsBeforeRelease?: boolean;
    changelogPath?: string;
    versionFiles?: string[];
}
export interface CEOReviewConfig {
    minimumScore?: number;
    requireAllBAT?: boolean;
    autoGenerateNextSteps?: boolean;
}
export interface SuperpowersConfig {
    browser?: BrowserConfig;
    qa?: QAConfig;
    ship?: ShipConfig;
    ceoReview?: CEOReviewConfig;
}
/** GitHub release types */
export interface GitHubRelease {
    tag_name: string;
    name: string;
    body: string;
    draft?: boolean;
    prerelease?: boolean;
}
/** BAT Framework types */
export interface BATScores {
    brand: number;
    attention: number;
    trust: number;
}
export interface CEOReviewInput {
    feature: string;
    goal?: string;
    audience?: string;
    competition?: string;
    trust?: string;
    scores?: BATScores;
}
export type Recommendation = 'BUILD' | 'CONSIDER' | "DON'T BUILD";
export interface CEOReviewResult {
    feature: string;
    scores: BATScores;
    total: number;
    recommendation: Recommendation;
    rationale: string[];
    nextSteps: string[];
}
/** Changelog entry */
export interface ChangelogEntry {
    type: 'feat' | 'fix' | 'chore' | 'docs' | 'refactor' | 'test' | 'other';
    message: string;
    scope?: string;
}
/** Test result */
export interface TestResult {
    file: string;
    passed: boolean;
    duration?: number;
    error?: string;
}
/** Screenshot result */
export interface ScreenshotResult {
    path: string;
    url: string;
    viewport: string;
    timestamp: string;
}
//# sourceMappingURL=index.d.ts.map