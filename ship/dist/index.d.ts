export interface ShipOptions {
    version: string;
    dryRun?: boolean;
    noPush?: boolean;
    noRelease?: boolean;
}
export interface ShipResult {
    oldVersion: string;
    newVersion: string;
    changelog: string;
    tagCreated: boolean;
    pushed: boolean;
    released: boolean;
    releaseUrl?: string;
}
export declare function getCurrentVersion(): string;
export declare function bumpVersion(currentVersion: string, bumpType: string): string;
export declare function generateChangelog(newVersion: string): string;
export declare function ship(options: ShipOptions): ShipResult;
//# sourceMappingURL=index.d.ts.map