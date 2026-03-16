export type ViewportPreset = 'desktop' | 'mobile' | 'tablet';

export interface BrowseOptions {
  viewport?: ViewportPreset;
}

export interface ScreenshotOptions {
  viewport?: ViewportPreset;
  width?: number;
  height?: number;
  output?: string;
  filename?: string;
  fullPage?: boolean;
  waitFor?: string;
  waitTime?: number;
  hide?: string[];
  darkMode?: boolean;
}

export interface TestUrlOptions {
  expectStatus?: number;
  expectText?: string;
  expectSelector?: string;
  timeout?: number;
  darkMode?: boolean;
}

export interface FlowStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'scroll' | 'screenshot';
  url?: string;
  selector?: string;
  text?: string;
  time?: number;
  filename?: string;
}
