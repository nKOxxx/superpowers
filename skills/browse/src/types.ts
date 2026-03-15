export interface Viewport {
  width: number;
  height: number;
}

export interface BrowseAction {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'screenshot';
  selector?: string;
  text?: string;
  duration?: number;
  x?: number;
  y?: number;
  output?: string;
}

export interface BrowseOptions {
  url: string;
  viewport?: string | Viewport;
  fullPage?: boolean;
  selector?: string;
  outputPath?: string;
  timeout?: number;
  actions?: BrowseAction[];
}

export interface FlowAction extends BrowseAction {
  output?: string;
}

export interface FlowOptions {
  url: string;
  viewport?: string;
  actions: FlowAction[];
  output?: string;
}

export interface ScreenshotResult {
  success: boolean;
  base64?: string;
  path?: string;
  viewport?: Viewport;
  url?: string;
  timestamp: string;
  error?: string;
}
