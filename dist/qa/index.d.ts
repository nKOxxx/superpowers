interface QAOptions {
    mode: 'targeted' | 'smoke' | 'full';
    diff: string;
    coverage: boolean;
    parallel: boolean;
}
export declare function run(options: QAOptions): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map