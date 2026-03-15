/**
 * QA Skill - Systematic testing as QA Lead
 *
 * Usage: /qa [--mode=targeted|smoke|full] [--coverage] [--pattern=<glob>]
 */
import { QAOptions, SkillResult } from '../types.js';
export declare class QASkill {
    private cwd;
    private framework?;
    constructor(cwd?: string);
    execute(options: QAOptions): Promise<SkillResult>;
    private detectFramework;
    private getTestFiles;
    private getTargetedTests;
    private findTestFile;
    private getSmokeTests;
    private getAllTests;
    private runTests;
    private buildTestCommand;
    private parseTestOutput;
}
export declare function run(args: string[], cwd?: string): Promise<SkillResult>;
//# sourceMappingURL=index.d.ts.map