// Type definitions for Superpowers

export interface Config {
  browser?: BrowserConfig;
  qa?: QAConfig;
  ship?: ShipConfig;
  ceoReview?: CeoReviewConfig;
}

export interface BrowserConfig {
  defaultViewport: string;
  screenshotDir: string;
  viewports: Record<string, Viewport>;
  flows?: Record<string, string[]>;
}

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  userAgent?: string;
}

export interface QAConfig {
  defaultMode: 'targeted' | 'smoke' | 'full';
  coverageThreshold: number;
  testCommand: string;
  testPatterns: {
    unit: string[];
    integration: string[];
    e2e: string[];
  };
  framework?: string;
  sourceFiles?: string[];
  ignorePatterns?: string[];
  selection?: {
    includePatterns?: string[];
    alwaysRun?: string[];
    excludeFromChanges?: string[];
  };
  execution?: {
    parallel?: boolean;
    maxWorkers?: number;
    timeout?: number;
  };
}

export interface ShipConfig {
  requireCleanWorkingDir: boolean;
  runTestsBeforeRelease: boolean;
  testCommand: string;
  changelog: {
    preset: string;
    includeContributors: boolean;
  };
  github: {
    enabled: boolean;
    defaultOrg: string;
    release?: boolean;
    releaseName?: string;
    draft?: boolean;
    prerelease?: boolean;
    assets?: string[];
  };
  telegram?: {
    notifyOnShip: boolean;
    channel?: string;
    template?: string;
  };
  version?: {
    files: string[];
    placeholders?: Array<{
      file: string;
      pattern: string;
    }>;
  };
  git?: {
    requireCleanWorkingDir?: boolean;
    addFiles?: string[];
    commitMessage?: string;
    tagName?: string;
    tagAnnotation?: string;
    push?: boolean;
    pushRepo?: string;
  };
  publish?: {
    enabled?: boolean;
    registry?: string;
    access?: 'public' | 'restricted';
  };
  hooks?: Record<string, string[]>;
}

export interface CeoReviewConfig {
  minimumScore: number;
  requireAllBAT: boolean;
  autoGenerateNextSteps: boolean;
  marketAnalysis: boolean;
}

export interface ScreenshotOptions {
  url: string;
  fullPage?: boolean;
  viewport?: string | { width: number; height: number };
  waitFor?: string;
  waitTime?: number;
  output?: string;
  selector?: string;
  darkMode?: boolean;
  mobile?: boolean;
  tablet?: boolean;
}

export interface CrawlOptions {
  startUrl: string;
  depth?: number;
  maxPages?: number;
  validateLinks?: boolean;
  screenshotEach?: boolean;
  include?: string;
  exclude?: string;
  sameOrigin?: boolean;
}

export interface QAResult {
  mode: string;
  changedFiles: string[];
  selectedTests: string[];
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface ShipResult {
  version: string;
  previousVersion: string;
  changelogUpdated: boolean;
  commitCreated: boolean;
  tagCreated: boolean;
  pushed: boolean;
  githubRelease?: {
    url: string;
    id: number;
  };
  published: boolean;
}

export interface BATScore {
  brand: number;
  attention: number;
  trust: number;
  overall: number;
}

export interface CEOResult {
  question: string;
  scores: BATScore;
  brandAnalysis: string;
  attentionAnalysis: string;
  trustAnalysis: string;
  risks: string[];
  alternatives: string[];
  decision: 'PROCEED' | 'PAUSE' | 'REJECT';
  nextSteps: string[];
}

export interface CrawlPage {
  url: string;
  title: string;
  statusCode: number;
  links: string[];
  brokenLinks: string[];
  screenshot?: string;
  depth: number;
}

export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

export interface PerformanceMetrics {
  url: string;
  lcp: number; // Largest Contentful Paint
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  cls: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
}
