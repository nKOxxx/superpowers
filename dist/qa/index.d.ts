import chalk from 'chalk';
export type TestFramework = 'vitest' | 'jest' | 'mocha' | 'npm';
export type TestMode = 'targeted' | 'smoke' | 'full';
export interface QAOptions {
    mode?: TestMode;
    coverage?: boolean;
    watch?: boolean;
    testPathPattern?: string;
}
export interface TestFrameworkInfo {
    framework: TestFramework;
    command: string;
    args: string[];
}
export declare function detectFramework(cwd?: string): TestFrameworkInfo;
export declare function getGitDiffFiles(cwd?: string): string[];
export declare function getStagedFiles(cwd?: string): string[];
export declare function mapSourceToTest(sourceFile: string): string | null;
export declare function findRelatedTests(files: string[], cwd?: string): string[];
export declare function runTests(options?: QAOptions, cwd?: string): Promise<void>;
export { chalk };
//# sourceMappingURL=index.d.ts.map