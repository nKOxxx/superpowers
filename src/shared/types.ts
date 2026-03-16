// Shared types for all superpowers

export interface CliOptions {
  verbose?: boolean;
  dryRun?: boolean;
  output?: string;
  format?: 'text' | 'json' | 'markdown';
}

export interface ViewportPreset {
  name: string;
  width: number;
  height: number;
}

export interface ScreenshotOptions {
  url: string;
  viewport?: 'desktop' | 'mobile' | 'tablet' | ViewportPreset;
  fullPage?: boolean;
  waitFor?: string;
  waitTime?: number;
  hideSelectors?: string[];
  darkMode?: boolean;
  outputDir?: string;
  filename?: string;
}

export interface TestUrlOptions {
  url: string;
  expectStatus?: number;
  expectText?: string;
  expectSelector?: string;
  timeout?: number;
  darkMode?: boolean;
}

export interface ClickOptions {
  url: string;
  selector: string;
  screenshot?: boolean;
  waitForNavigation?: boolean;
  viewport?: 'desktop' | 'mobile' | 'tablet';
}

export interface TypeOptions {
  url: string;
  selector: string;
  text: string;
  clear?: boolean;
  submit?: boolean;
  delay?: number;
  screenshot?: boolean;
}

export interface FlowStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'scroll' | 'screenshot';
  url?: string;
  selector?: string;
  text?: string;
  time?: number;
  filename?: string;
}

export interface FlowOptions {
  name?: string;
  viewport?: 'desktop' | 'mobile' | 'tablet';
  outputDir?: string;
  steps: FlowStep[];
}

export interface QaConfig {
  defaultRunner?: 'jest' | 'vitest' | 'playwright' | 'mocha' | 'node';
  testDirs?: string[];
  testPatterns?: string[];
  coverageThreshold?: number;
  smokeTags?: string[];
  exclude?: string[];
  timeout?: number;
  workers?: number;
}

export interface ShipConfig {
  defaultBump?: 'major' | 'minor' | 'patch' | 'prerelease';
  changelogPath?: string;
  packageFiles?: string[];
  tagPrefix?: string;
  releaseBranch?: string;
  requireCleanWorkingDir?: boolean;
  runTests?: boolean;
  testCommand?: string;
  buildCommand?: string;
  preReleaseHooks?: string[];
  postReleaseHooks?: string[];
  githubRepo?: string;
  npmRegistry?: string;
  npmAccess?: 'public' | 'restricted';
  telegram?: {
    botToken?: string;
    chatId?: string;
  };
}

export interface BatScore {
  brand: number;
  attention: number;
  trust: number;
  total: number;
  recommendation: 'BUILD' | 'CONSIDER' | "DON'T BUILD";
}

export interface StarRating {
  problem: number;
  usability: number;
  delight: number;
  feasibility: number;
  viability: number;
  overall: number;
}

export interface CeoReviewResult {
  feature: string;
  audience?: string;
  market?: string;
  bat: BatScore;
  stars: StarRating;
  nextSteps: string[];
  resources: string;
  timeline: string;
}
