export interface QAOptions {
  changed: boolean;
  coverage: boolean;
  watch: boolean;
  file?: string;
  grep?: string;
  framework?: string;
  full: boolean;
  security: boolean;
  e2e: boolean;
  unit: boolean;
  integration: boolean;
  failFast: boolean;
  parallel: boolean;
  maxWorkers: number;
  silent: boolean;
  json: boolean;
}

export interface TestResult {
  success: boolean;
  framework: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  duration: number;
  coverage?: CoverageResult;
  failures: TestFailure[];
  changedFiles?: string[];
}

export interface CoverageResult {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface TestFailure {
  title: string;
  file: string;
  line?: number;
  column?: number;
  message: string;
  stack?: string;
}

export interface FrameworkConfig {
  name: string;
  command: string;
  args: string[];
  detectFiles: string[];
  detectPatterns: string[];
}
