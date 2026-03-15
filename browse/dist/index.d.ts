#!/usr/bin/env node
interface BrowseAction {
    type: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'screenshot';
    selector?: string;
    text?: string;
    ms?: number;
    x?: number;
    y?: number;
    fullPage?: boolean;
}
interface BrowseOptions {
    url: string;
    viewport: string | {
        width: number;
        height: number;
    };
    fullPage: boolean;
    selector?: string;
    waitFor?: string;
    timeout: number;
    actions?: BrowseAction[];
    output?: string;
    headless: boolean;
}
interface BrowseResult {
    success: boolean;
    screenshotPath?: string;
    url: string;
    title?: string;
    viewport: string;
    duration: number;
    actionsExecuted: number;
    error?: string;
}
export declare function browse(options: BrowseOptions): Promise<BrowseResult>;
export {};
