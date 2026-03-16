export interface BrowseOptions {
    url: string;
    viewport?: 'mobile' | 'desktop' | 'both';
    flows?: string[];
    outputDir?: string;
    timeout?: number;
    silent?: boolean;
}
export interface QAOptions {
    mode?: 'targeted' | 'smoke' | 'full' | 'deep';
    diff?: string;
    repoPath?: string;
    silent?: boolean;
}
export interface ShipOptions {
    repo: string;
    version: 'patch' | 'minor' | 'major' | string;
    force?: boolean;
    skipTests?: boolean;
    dryRun?: boolean;
    notes?: string;
    silent?: boolean;
}
export interface PlanCEOOptions {
    question?: string;
    feature?: string;
    goal?: string;
    problem?: string;
    solution?: string;
    save?: boolean;
    silent?: boolean;
}
export interface TestResult {
    passed: boolean;
    message: string;
    duration?: number;
}
export interface FlowResult {
    name: string;
    url: string;
    success: boolean;
    error?: string;
    duration: number;
}
export interface ScreenshotResult {
    viewport: string;
    path: string;
    success: boolean;
}
export interface ReleaseInfo {
    owner: string;
    repo: string;
    currentVersion: string;
    newVersion: string;
    changelog: string;
}
//# sourceMappingURL=types.d.ts.map