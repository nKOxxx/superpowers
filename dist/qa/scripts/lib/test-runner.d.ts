/**
 * Test runner for QA skill
 */
export interface TestResult {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    details: TestDetail[];
    coverage?: number;
}
export interface TestDetail {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration?: number;
    error?: string;
}
export interface RunOptions {
    coverage?: boolean;
    verbose?: boolean;
    timeout?: number;
}
export declare function runTests(testFiles: string[], options?: RunOptions): Promise<TestResult>;
//# sourceMappingURL=test-runner.d.ts.map