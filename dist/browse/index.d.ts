import { ViewportSize } from 'playwright';
export interface BrowseOptions {
    url: string;
    viewport?: string | ViewportSize;
    fullPage?: boolean;
    selector?: string;
    actions?: Action[];
    outputPath?: string;
}
export interface Action {
    type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
    selector?: string;
    text?: string;
    delay?: number;
    x?: number;
    y?: number;
}
export declare class BrowseSkill {
    private browser;
    init(): Promise<void>;
    close(): Promise<void>;
    private parseViewport;
    captureScreenshot(options: BrowseOptions): Promise<{
        path: string;
        base64: string;
    }>;
    private executeActions;
}
