import type { Viewport } from './config.js';
export interface FlowStep {
    /** Action to perform */
    action: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'scroll' | 'hover';
    /** Target selector or URL */
    target?: string;
    /** Value for type action */
    value?: string;
    /** Options for the action */
    options?: Record<string, unknown>;
}
export interface Flow {
    name: string;
    baseUrl: string;
    steps: FlowStep[];
}
export interface FlowResult {
    flowName: string;
    success: boolean;
    stepsCompleted: number;
    totalSteps: number;
    screenshots: string[];
    errors: string[];
    duration: number;
}
export interface FlowOptions {
    viewport?: Viewport;
    screenshotDir?: string;
    headless?: boolean;
    timeout?: number;
}
/**
 * Execute a single flow
 */
export declare function executeFlow(flow: Flow, options?: FlowOptions): Promise<FlowResult>;
/**
 * Execute multiple flows in sequence
 */
export declare function executeFlows(flows: Flow[], options?: FlowOptions): Promise<FlowResult[]>;
/**
 * Create a flow from predefined paths
 */
export declare function createFlowFromPaths(name: string, baseUrl: string, paths: string[], options?: {
    screenshotEach?: boolean;
}): Flow;
/**
 * Format flow results for display
 */
export declare function formatFlowResults(results: FlowResult[]): string;
//# sourceMappingURL=flows.d.ts.map