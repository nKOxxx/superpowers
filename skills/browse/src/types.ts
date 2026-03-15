export interface Viewport {
  width: number;
  height: number;
}

export interface ViewportPreset {
  name: string;
  width: number;
  height: number;
}

export type ActionType = 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'press';

export interface BrowseAction {
  type: ActionType;
  selector?: string;
  text?: string;
  duration?: number;
  x?: number;
  y?: number;
  key?: string;
}

export interface BrowseOptions {
  url: string;
  viewport?: 'mobile' | 'tablet' | 'desktop' | Viewport;
  fullPage?: boolean;
  selector?: string;
  actions?: BrowseAction[];
  outputPath?: string;
  timeout?: number;
}

export interface ScreenshotResult {
  success: boolean;
  base64?: string;
  path?: string;
  error?: string;
  viewport: Viewport;
  url: string;
  timestamp: string;
}

export const VIEWPORT_PRESETS: Record<string, Viewport> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};
