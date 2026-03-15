export interface BrowseOptions {
    fullPage?: boolean;
    element?: string;
    viewport?: string;
    width?: string;
    height?: string;
    output?: string;
    base64?: boolean;
    actions?: string;
}
export declare function browseCommand(url: string, options: BrowseOptions): Promise<void>;
//# sourceMappingURL=index.d.ts.map