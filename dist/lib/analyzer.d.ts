import type { QAConfig } from './config.js';
export interface ChangedFile {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions: number;
    deletions: number;
}
export interface TestSelection {
    type: 'unit' | 'integration' | 'e2e' | 'visual' | 'specific';
    files: string[];
    reason: string;
}
export interface AnalysisResult {
    changedFiles: ChangedFile[];
    testSelections: TestSelection[];
    coverage: {
        estimated: number;
        filesAffected: number;
    };
}
/**
 * Get changed files from git diff
 */
export declare function getChangedFiles(diffTarget?: string): ChangedFile[];
/**
 * Analyze changed files and determine which tests to run
 */
export declare function analyzeChanges(changedFiles: ChangedFile[], config: QAConfig): AnalysisResult;
/**
 * Generate test command based on selections
 */
export declare function generateTestCommand(selections: TestSelection[], config: QAConfig, mode: 'targeted' | 'smoke' | 'full'): string;
/**
 * Format analysis result for display
 */
export declare function formatAnalysis(result: AnalysisResult): string;
//# sourceMappingURL=analyzer.d.ts.map