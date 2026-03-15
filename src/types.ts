/**
 * Shared types for Superpowers skills
 */

export interface SkillContext {
  workspace: string;
  cwd: string;
  env: Record<string, string>;
  verbose?: boolean;
}

export interface SkillResult {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: string[];
}

export interface SkillAction {
  kind: string;
  [key: string]: unknown;
}

// Browser skill types
export interface BrowserOptions {
  url: string;
  viewport?: 'mobile' | 'tablet' | 'desktop' | { width: number; height: number };
  fullPage?: boolean;
  waitFor?: string | number;
  actions?: BrowserAction[];
}

export type BrowserAction =
  | { kind: 'click'; selector: string }
  | { kind: 'type'; selector: string; text: string; submit?: boolean }
  | { kind: 'wait'; ms: number }
  | { kind: 'scroll'; selector?: string; direction?: 'up' | 'down' }
  | { kind: 'hover'; selector: string }
  | { kind: 'screenshot'; selector?: string; path?: string };

// QA skill types
export type QAMode = 'targeted' | 'smoke' | 'full';

export interface QAOptions {
  mode: QAMode;
  testPattern?: string;
  coverage?: boolean;
  watch?: boolean;
}

export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  files: string[];
}

// Ship skill types
export type VersionBump = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  version?: VersionBump | string;
  dryRun?: boolean;
  skipTests?: boolean;
  skipChangelog?: boolean;
  skipGitTag?: boolean;
  skipGitHubRelease?: boolean;
}

export interface ReleaseInfo {
  version: string;
  changelog: string;
  commits: string[];
  tagName: string;
}

// CEO Review skill types
export interface BATScore {
  brand: number;      // 0-5
  attention: number;  // 0-5
  trust: number;      // 0-5
}

export interface CEORReviewInput {
  productName: string;
  description: string;
  targetMarket: string;
  differentiator: string;
  risks?: string[];
}

export interface CEORReviewResult {
  scores: BATScore;
  totalScore: number;  // 0-15, 10+ recommended
  recommendation: 'build' | 'consider' | 'dont-build';
  reasoning: string;
  nextSteps: string[];
}
