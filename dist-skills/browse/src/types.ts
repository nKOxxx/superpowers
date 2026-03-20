export interface ViewportSize {
  width: number;
  height: number;
}

export interface BrowseOptions {
  url: string;
  screenshot: boolean;
  viewport: ViewportSize;
  audit: boolean;
  waitFor?: string;
  timeout: number;
  compare?: string;
  mobile: boolean;
  darkMode: boolean;
  output?: string;
  fullPage: boolean;
  telegram: boolean;
  silent: boolean;
}

export interface AuditResult {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  help: string;
  helpUrl: string;
  target: string[];
}

export interface ComparisonResult {
  matches: boolean;
  diffPercentage: number;
  diffPath?: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  paint: number;
}

export interface BrowseResult {
  url: string;
  screenshot?: string;
  audit?: AuditResult;
  comparison?: ComparisonResult;
  metrics?: PerformanceMetrics;
  errors: string[];
  timestamp: string;
}
