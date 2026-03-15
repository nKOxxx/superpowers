import { ViewportSize } from 'playwright';
export interface BrowseOptions {
    url: string;
    viewport?: 'mobile' | 'tablet' | 'desktop' | 'custom';
    width?: number;
    height?: number;
    fullPage?: boolean;
    selector?: string;
    actions?: string;
    output?: string;
}
export interface BrowseResult {
    screenshotPath: string;
    base64Image: string;
    url: string;
    viewport: ViewportSize;
    actionsPerformed: string[];
}
export declare function browse(options: BrowseOptions): Promise<BrowseResult>;
//# sourceMappingURL=index.d.ts.map