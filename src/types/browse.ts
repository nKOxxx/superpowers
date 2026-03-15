/**
 * Viewport configuration for browser automation
 */
export interface Viewport {
  width: number;
  height: number;
}

/**
 * Viewport presets
 */
export type ViewportPreset = 'mobile' | 'tablet' | 'desktop';

/**
 * Browser action
 */
export interface BrowserAction {
  kind: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'screenshot';
  selector?: string;
  text?: string;
  ms?: number;
}

/**
 * Browse skill options
 */
export interface BrowseOptions {
  url: string;
  viewport?: ViewportPreset | Viewport;
  fullPage?: boolean;
  outputDir?: string;
  waitFor?: string;
  actions?: BrowserAction[];
  timeout?: number;
}

/**
 * Flow definition
 */
export interface FlowStep {
  name: string;
  url: string;
  actions?: BrowserAction[];
}

/**
 * Flow configuration
 */
export type FlowConfig = Record<string, FlowStep[]>;
