export type TestMode = 'targeted' | 'smoke' | 'full';
export type TestFramework = 'vitest' | 'jest' | 'mocha' | 'unknown';
export interface QAOptions {
    mode?: TestMode;
    coverage?: boolean;
    watch?: boolean;
    testPathPattern?: string;
}
export interface QAResult {
    success: boolean;
    framework: TestFramework;
    mode: TestMode;
    output: string;
    error?: string;
    duration: number;
    testCount?: number;
    passedCount?: number;
    failedCount?: number;
}
export declare function runQA(options?: QAOptions): Promise<QAResult>;
//# sourceMappingURL=index.d.ts.map