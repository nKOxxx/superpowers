import { Command } from 'commander';
interface BrowseOptions {
    viewport?: string;
    fullPage?: boolean;
    selector?: string;
    actions?: string;
    output?: string;
}
interface ViewportConfig {
    width: number;
    height: number;
}
export declare function captureScreenshot(url: string, options: BrowseOptions): Promise<{
    screenshot: string;
    url: string;
    viewport: ViewportConfig;
}>;
export declare const browseCommand: Command;
export {};
//# sourceMappingURL=index.d.ts.map