import type { Viewport } from './config.js';
export interface ScreenshotOptions {
    /** Full page or viewport only */
    fullPage?: boolean;
    /** CSS selector for element screenshot */
    selector?: string;
    /** Output file path */
    outputPath?: string;
    /** Viewport size */
    viewport?: Viewport;
    /** Hide elements matching these selectors */
    hideSelectors?: string[];
    /** Wait for selector before screenshot */
    waitForSelector?: string;
    /** Wait for network idle */
    waitForNetworkIdle?: boolean;
    /** Additional wait time in ms */
    delay?: number;
}
export interface ScreenshotResult {
    path: string;
    url: string;
    viewport: Viewport;
    size: number;
    timestamp: string;
}
/**
 * Take a screenshot of a URL
 */
export declare function takeScreenshot(url: string, options?: ScreenshotOptions): Promise<ScreenshotResult>;
/**
 * Take multiple screenshots at different viewports
 */
export declare function takeResponsiveScreenshots(url: string, viewports: Record<string, Viewport>, baseDir?: string): Promise<ScreenshotResult[]>;
/**
 * Create a screenshot comparison report
 */
export declare function createComparisonReport(screenshots: ScreenshotResult[], outputPath: string): Promise<void>;
//# sourceMappingURL=screenshot.d.ts.map