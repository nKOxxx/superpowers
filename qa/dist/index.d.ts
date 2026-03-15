#!/usr/bin/env node
type TestMode = 'targeted' | 'smoke' | 'full';
type TestFramework = 'vitest' | 'jest' | 'mocha' | 'node' | 'unknown';
interface QAOptions {
    mode: TestMode;
    files?: string;
    coverage: boolean;
    watch: boolean;
    ci: boolean;
    json: boolean;
}
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
export declare function runQA(options: QAOptions, cwd?: string): Promise<TestResult>;
export {};
