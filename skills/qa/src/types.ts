export type TestFramework = 'vitest' | 'jest' | 'mocha' | 'unknown';
export type TestMode = 'targeted' | 'smoke' | 'full';

export interface QaOptions {
  mode: TestMode;
  coverage?: boolean;
  verbose?: boolean;
  watch?: boolean;
  testPathPattern?: string;
  updateSnapshot?: boolean;
}

export interface TestFile {
  path: string;
  framework: TestFramework;
  relatedSourceFiles: string[];
}

export interface QaResult {
  success: boolean;
  framework: TestFramework;
  mode: TestMode;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  duration: number;
  coverage?: CoverageReport;
  error?: string;
}

export interface CoverageReport {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface GitDiff {
  files: string[];
  added: string[];
  modified: string[];
  deleted: string[];
}
