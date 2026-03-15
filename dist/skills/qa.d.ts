export type QAMode = 'targeted' | 'smoke' | 'full';
export interface QAOptions {
    mode?: QAMode;
    diff?: string;
    notifyTelegram?: boolean;
}
export interface QAResult {
    mode: QAMode;
    filesChanged: string[];
    testsRun: string[];
    passed: number;
    failed: number;
    duration: number;
    coverage?: number;
}
export declare function qa(options?: QAOptions): Promise<QAResult>;
//# sourceMappingURL=qa.d.ts.map