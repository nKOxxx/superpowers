/**
 * Screenshot utilities for browse skill
 */
import { Page, BrowserContext } from 'playwright';
export interface ScreenshotOptions {
    fullPage?: boolean;
    waitFor?: string;
    timeout?: number;
}
export declare function captureScreenshot(context: BrowserContext, url: string, outputPath: string, options?: ScreenshotOptions): Promise<string>;
export declare function captureElementScreenshot(page: Page, selector: string, outputPath: string): Promise<string>;
export declare function compareScreenshots(baselinePath: string, currentPath: string, diffPath?: string): Promise<{
    matches: boolean;
    diffPercentage: number;
}>;
//# sourceMappingURL=screenshot.d.ts.map