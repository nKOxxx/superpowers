import { type Page } from 'playwright';
export interface Viewport {
    width: number;
    height: number;
}
export interface BrowseOptions {
    url: string;
    viewport?: Viewport | 'mobile' | 'tablet' | 'desktop';
    fullPage?: boolean;
    selector?: string;
    actions?: Action[];
    output?: 'base64' | 'file' | 'buffer';
    outputPath?: string;
}
export interface Action {
    type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
    target?: string;
    value?: string;
    duration?: number;
}
export declare function parseViewport(viewport: string): Viewport;
export declare function parseActions(actionsStr: string): Action[];
export declare function executeActions(page: Page, actions: Action[]): Promise<void>;
export interface BrowseResult {
    screenshot: Buffer;
    url: string;
    viewport: Viewport;
    title: string;
    duration: number;
}
export declare function browse(options: BrowseOptions): Promise<BrowseResult>;
export declare function screenshotToBase64(screenshot: Buffer): string;
//# sourceMappingURL=index.d.ts.map