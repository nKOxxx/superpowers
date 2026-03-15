export type VersionType = 'patch' | 'minor' | 'major';
export interface ShipOptions {
    repo: string;
    version: string;
    dryRun?: boolean;
    skipTests?: boolean;
    force?: boolean;
    notes?: string;
}
export interface ShipResult {
    version: string;
    tag: string;
    releaseUrl?: string;
    changelogUpdated: boolean;
}
export declare function ship(options: ShipOptions): Promise<ShipResult>;
//# sourceMappingURL=ship.d.ts.map