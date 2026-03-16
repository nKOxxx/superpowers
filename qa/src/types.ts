export type TestMode = 'targeted' | 'smoke' | 'full';
export type TestRunner = 'vitest' | 'jest' | 'playwright' | 'mocha';

export interface QaConfig {
  defaultRunner: TestRunner;
  testDirs: string[];
  testPatterns: string[];
  coverageThreshold: number;
  smokeTags: string[];
  exclude: string[];
  timeout: number;
  workers: number;
}

export interface RunOptions {
  mode?: TestMode;
  runner?: TestRunner;
  watch?: boolean;
  coverage?: boolean;
  updateSnapshots?: boolean;
  pattern?: string;
  bail?: boolean;
  verbose?: boolean;
  ci?: boolean;
  workers?: number;
  timeout?: number;
}

export interface RiskFactor {
  type: 'core' | 'untested' | 'noTestChanges';
  message: string;
}

export interface AnalyzeResult {
  riskScore: number;
  riskFactors: RiskFactor[];
  changedFiles: string[];
  affectedTests: string[];
  recommendation: TestMode;
}
