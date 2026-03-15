export interface QAOptions {
    mode?: 'targeted' | 'smoke' | 'full';
    coverage?: boolean;
    files?: string;
    watch?: boolean;
}
export interface QAResult {
    framework: string;
    command: string;
    exitCode: number;
    output: string;
    summary: string;
}
export declare function detectFramework(): string;
export declare function getChangedFiles(): string[];
export declare function mapToTestFiles(sourceFiles: string[]): string[];
export declare function runTests(options: QAOptions): QAResult;
//# sourceMappingURL=index.d.ts.map