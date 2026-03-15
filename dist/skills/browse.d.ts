export interface BrowseOptions {
    url: string;
    viewport?: string;
    width?: number;
    height?: number;
    fullPage?: boolean;
    wait?: string;
    actions?: string;
    output?: string;
    timeout?: number;
}
export declare function browse(options: BrowseOptions): Promise<void>;
//# sourceMappingURL=browse.d.ts.map