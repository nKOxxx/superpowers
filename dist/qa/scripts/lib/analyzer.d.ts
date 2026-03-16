/**
 * Code change analyzer for QA skill
 * Maps file changes to relevant tests
 */
export interface ChangeAnalysis {
    filesChanged: string[];
    relatedTests: string[];
    testCoverage: Map<string, string[]>;
}
export declare function analyzeChanges(diffRef?: string): Promise<ChangeAnalysis>;
//# sourceMappingURL=analyzer.d.ts.map