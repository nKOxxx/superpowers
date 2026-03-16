/**
 * Flow execution engine for browse skill
 */
import { BrowserContext } from 'playwright';
export interface FlowStep {
    action: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'scroll';
    target?: string;
    value?: string;
    selector?: string;
    url?: string;
    delay?: number;
}
export interface FlowConfig {
    name: string;
    steps: FlowStep[];
    viewport?: {
        width: number;
        height: number;
    };
}
export interface FlowOptions {
    outputDir?: string;
    viewport?: {
        width: number;
        height: number;
    };
}
export declare function runFlow(context: BrowserContext, baseUrl: string, flow: FlowConfig, options?: FlowOptions): Promise<void>;
//# sourceMappingURL=flows.d.ts.map