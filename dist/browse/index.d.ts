export interface BrowseOptions {
    url: string;
    viewport?: 'mobile' | 'tablet' | 'desktop' | string;
    fullPage?: boolean;
    selector?: string;
    actions?: BrowseAction[];
    outputFormat?: 'base64' | 'file';
    outputPath?: string;
}
export interface BrowseAction {
    type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
    selector?: string;
    text?: string;
    delay?: number;
    x?: number;
    y?: number;
}
export interface BrowseResult {
    success: boolean;
    screenshot?: string;
    filePath?: string;
    error?: string;
    duration: number;
    url: string;
    viewport: {
        width: number;
        height: number;
    };
}
export declare function browse(options: BrowseOptions): Promise<BrowseResult>;
//# sourceMappingURL=index.d.ts.map