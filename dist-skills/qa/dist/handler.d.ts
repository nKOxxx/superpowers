type TestMode = 'targeted' | 'smoke' | 'full';
type TestFramework = 'vitest' | 'jest' | 'mocha' | 'npm' | null;
interface TestFailure {
    test: string;
    file: string;
    error: string;
    line?: number;
}
interface CoverageReport {
    lines: number;
    functions: number;
    branches: number;
    statements?: number;
}
interface TestResult {
    framework: TestFramework;
    mode: TestMode;
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        duration: number;
    };
    failures: TestFailure[];
    coverage?: CoverageReport;
    rawOutput: string;
}
interface SkillContext {
    args: string[];
    options: Record<string, string | boolean>;
    cwd?: string;
}
interface SkillResult {
    success: boolean;
    message: string;
    data?: TestResult;
    error?: string;
}
export declare function handler(context: SkillContext): Promise<SkillResult>;
export {};
