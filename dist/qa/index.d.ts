export type QAMode = 'targeted' | 'smoke' | 'full';
export interface QAOptions {
    mode: QAMode;
    coverage?: boolean;
    testPath?: string;
}
export interface QAResult {
    success: boolean;
    framework: string;
    mode: QAMode;
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    duration: number;
    output: string;
    coverage?: string;
}
export declare class QASkill {
    private detectFramework;
    private getChangedFiles;
    private findTestFiles;
    private buildCommand;
    runTests(options: QAOptions): Promise<QAResult>;
}
//# sourceMappingURL=index.d.ts.map