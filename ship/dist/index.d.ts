#!/usr/bin/env node
type VersionType = 'patch' | 'minor' | 'major';
interface ShipOptions {
    version: VersionType | string;
    repo?: string;
    dryRun: boolean;
    push: boolean;
    release: boolean;
    changelogOnly: boolean;
    prerelease?: string;
    skipCleanCheck: boolean;
}
interface Changes {
    feat: string[];
    fix: string[];
    docs: string[];
    style: string[];
    refactor: string[];
    perf: string[];
    test: string[];
    chore: string[];
    revert: string[];
    security: string[];
}
interface ReleaseResult {
    version: string;
    previousVersion: string;
    tag: string;
    changes: Changes;
    commits: number;
    filesChanged: number;
    releaseUrl?: string;
    dryRun: boolean;
}
export declare function ship(options: ShipOptions, cwd?: string): Promise<ReleaseResult>;
export {};
