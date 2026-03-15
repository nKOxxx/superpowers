/**
 * Shared types for superpowers
 */

export interface Viewport {
  width: number;
  height: number;
}

export interface ViewportPresets {
  [key: string]: Viewport;
}

export interface BrowserAction {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'screenshot';
  selector?: string;
  text?: string;
  delay?: number;
}

export interface FlowStep {
  name: string;
  url: string;
  actions?: BrowserAction[];
}

export interface Flows {
  [key: string]: FlowStep[];
}

export interface BrowseOptions {
  viewport?: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  output?: string;
  flows?: string;
  waitFor?: string;
  actions?: string;
  timeout?: number;
}

export type QAMode = 'targeted' | 'smoke' | 'full';

export interface QAOptions {
  mode?: QAMode;
  diff?: string;
  coverage?: boolean;
  parallel?: boolean;
}

export type VersionBump = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  version: VersionBump | string;
  repo?: string;
  dryRun?: boolean;
  skipTests?: boolean;
  notes?: string;
  prerelease?: boolean;
}

export interface CEOReviewOptions {
  feature: string;
  goal?: string;
  audience?: string;
  competition?: string;
  trust?: string;
}

export interface BATScores {
  brand: number;
  attention: number;
  trust: number;
}

export interface TestResult {
  file: string;
  passed: boolean;
  duration: number;
  error?: string;
}

export interface QAResult {
  mode: QAMode;
  filesChanged: string[];
  testsRun: string[];
  results: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

export interface GitCommit {
  hash: string;
  message: string;
  date: string;
}

export interface ReleaseInfo {
  version: string;
  previousVersion: string;
  commits: GitCommit[];
  changelog: string;
}
