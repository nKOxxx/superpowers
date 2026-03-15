export type VersionBump = 'patch' | 'minor' | 'major';
export interface ShipOptions {
    version?: VersionBump | string;
    dryRun?: boolean;
    skipChangelog?: boolean;
    skipGit?: boolean;
    skipGithubRelease?: boolean;
}
export interface ShipResult {
    success: boolean;
    previousVersion?: string;
    newVersion?: string;
    changelogEntry?: string;
    tagName?: string;
    githubReleaseUrl?: string;
    error?: string;
    duration: number;
    changes: string[];
}
export declare function ship(options?: ShipOptions): Promise<ShipResult>;
//# sourceMappingURL=index.d.ts.map