/**
 * QA test modes
 */
export type QAMode = 'targeted' | 'smoke' | 'full';

/**
 * QA skill options
 */
export interface QAOptions {
  mode: QAMode;
  diffRange?: string;
  coverage?: boolean;
  parallel?: boolean;
}

/**
 * Test result
 */
export interface TestResult {
  file: string;
  passed: boolean;
  duration: number;
  error?: string;
}

/**
 * QA run results
 */
export interface QAResults {
  mode: QAMode;
  filesChanged: string[];
  testsRun: TestResult[];
  passed: number;
  failed: number;
  duration: number;
  coverage?: number;
}
