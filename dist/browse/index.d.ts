interface BrowseOptions {
    viewport: string;
    width?: number;
    height?: number;
    fullPage: boolean;
    output: string;
    waitFor?: string;
    actions?: string;
    timeout: number;
}
export declare function run(url: string, options: BrowseOptions): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map