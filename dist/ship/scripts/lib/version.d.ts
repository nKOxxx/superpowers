/**
 * Version bump utilities for ship skill
 */
export type VersionType = 'patch' | 'minor' | 'major';
export interface VersionOptions {
    dryRun?: boolean;
}
export declare function bumpVersion(versionInput: string, options?: VersionOptions): Promise<string>;
//# sourceMappingURL=version.d.ts.map