type TestMode = 'targeted' | 'smoke' | 'full';
type TestFramework = 'vitest' | 'jest' | 'mocha' | 'node' | 'unknown';
interface TestResult {
    success: boolean;
    mode: TestMode;
    framework: TestFramework;
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    duration: number;
    coverage?: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
    filesTested: string[];
    output: string;
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
