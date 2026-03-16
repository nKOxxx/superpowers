export type VersionBump = 'patch' | 'minor' | 'major' | string;
export interface VersionResult {
    oldVersion: string;
    newVersion: string;
    filesUpdated: string[];
}
/**
 * Parse a semantic version string
 */
export declare function parseVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
};
/**
 * Bump version based on type
 */
export declare function bumpVersion(currentVersion: string, bump: VersionBump): string;
/**
 * Read version from package.json
 */
export declare function readPackageVersion(cwd?: string): string;
/**
 * Update version in package.json
 */
export declare function updatePackageVersion(newVersion: string, cwd?: string): void;
/**
 * Update version in other files if they exist
 */
export declare function updateVersionInFiles(newVersion: string, files: string[], cwd?: string): string[];
/**
 * Bump version and update all relevant files
 */
export declare function bump(bump: VersionBump, options?: {
    cwd?: string;
    additionalFiles?: string[];
}): VersionResult;
/**
 * Validate that a version bump is valid
 */
export declare function validateBump(currentVersion: string, newVersion: string): {
    valid: boolean;
    reason?: string;
};
//# sourceMappingURL=version.d.ts.map