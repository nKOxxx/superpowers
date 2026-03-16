import type { TestSelection } from './analyzer.js';
export interface TestResult {
    command: string;
    exitCode: number;
    passed: boolean;
    output: string;
    errorOutput: string;
    duration: number;
    stats?: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        coverage?: number;
    };
}
export interface TestRunOptions {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    silent?: boolean;
}
/**
 * Run a test command and capture results
 */
export declare function runTests(command: string, options?: TestRunOptions): Promise<TestResult>;
/**
 * Run tests for multiple selections
 */
export declare function runTestSelections(selections: TestSelection[], baseCommand: string, options?: TestRunOptions): Promise<TestResult[]>;
/**
 * Format test results for display
 */
export declare function formatTestResults(results: TestResult[]): string;
/**
 * Check if tests pass the coverage threshold
 */
export declare function checkCoverage(results: TestResult[], threshold: number): {
    passed: boolean;
    actual: number;
    threshold: number;
};
//# sourceMappingURL=test-runner.d.ts.map