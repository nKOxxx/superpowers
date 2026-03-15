export type VersionBump = 'patch' | 'minor' | 'major';
export interface ShipOptions {
    version?: VersionBump | string;
    dryRun?: boolean;
    skipChangelog?: boolean;
    skipTag?: boolean;
    skipRelease?: boolean;
}
export interface ShipResult {
    success: boolean;
    version?: string;
    changelog?: string;
    tag?: string;
    releaseUrl?: string;
    dryRun?: boolean;
}
export declare class ShipSkill {
    private getCurrentVersion;
    private getCommitsSinceLastTag;
    private generateChangelog;
    private updateChangelogFile;
    private updatePackageVersion;
    release(options: ShipOptions): Promise<ShipResult>;
    private getRepoSlug;
}
