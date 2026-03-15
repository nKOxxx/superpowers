export interface BrowseOptions {
    viewport: string;
    width?: string;
    height?: string;
    fullPage: boolean;
    output: string;
    waitFor?: string;
    actions?: string;
    timeout: string;
}
export declare function browseCommand(url: string, options: BrowseOptions): Promise<void>;
//# sourceMappingURL=index.d.ts.map