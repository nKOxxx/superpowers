/**
 * Ship Skill - One-command release pipeline
 *
 * Usage: /ship [--version=patch|minor|major|<semver>] [--dry-run] [--skip-tests]
 */
import { ShipOptions, SkillResult } from '../types.js';
export declare class ShipSkill {
    private cwd;
    private pkg;
    private pkgPath;
    constructor(cwd?: string);
    execute(options: ShipOptions): Promise<SkillResult>;
    private isGitRepo;
    private hasUncommittedChanges;
    private calculateVersion;
    private getCommitsSinceLastTag;
    private generateChangelog;
    private updateVersion;
    private updateChangelogFile;
    private runTests;
    private createGitHubRelease;
}
export declare function run(args: string[], cwd?: string): Promise<SkillResult>;
//# sourceMappingURL=index.d.ts.map