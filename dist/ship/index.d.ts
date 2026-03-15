import chalk from 'chalk';
export type VersionBump = 'patch' | 'minor' | 'major';
export interface ShipOptions {
    version: VersionBump | string;
    dryRun?: boolean;
    skipChangelog?: boolean;
    skipGit?: boolean;
    skipGithub?: boolean;
}
export interface ChangelogEntry {
    type: string;
    scope?: string;
    message: string;
    hash: string;
}
export declare function bumpVersion(currentVersion: string, bump: VersionBump): string;
export declare function parseConventionalCommits(commits: string[]): ChangelogEntry[];
export declare function generateChangelog(entries: ChangelogEntry[], version: string): string;
export declare function ship(options: ShipOptions, cwd?: string): Promise<void>;
export { chalk };
//# sourceMappingURL=index.d.ts.map