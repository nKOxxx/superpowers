export interface ChangelogEntry {
    version: string;
    date: string;
    changes: {
        type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'chore';
        scope?: string;
        description: string;
        sha: string;
    }[];
}
export interface ChangelogOptions {
    preset?: 'conventional' | 'angular' | 'eslint';
    includeContributors?: boolean;
    fromTag?: string;
    toTag?: string;
}
/**
 * Parse a conventional commit message
 */
export declare function parseCommitMessage(message: string): {
    type: string;
    scope?: string;
    description: string;
    breaking: boolean;
} | null;
/**
 * Get commits between two tags
 */
export declare function getCommits(fromTag?: string, toTag?: string): Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
}>;
/**
 * Generate changelog entry from commits
 */
export declare function generateChangelogEntry(version: string, commits: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
}>, options?: ChangelogOptions): ChangelogEntry;
/**
 * Format changelog entry as markdown
 */
export declare function formatChangelogEntry(entry: ChangelogEntry): string;
/**
 * Read existing changelog
 */
export declare function readChangelog(cwd?: string): string;
/**
 * Update changelog with new entry
 */
export declare function updateChangelog(entry: ChangelogEntry, cwd?: string): void;
/**
 * Generate full changelog
 */
export declare function generateChangelog(options?: ChangelogOptions): string;
/**
 * Get the last tag
 */
export declare function getLastTag(): string | undefined;
//# sourceMappingURL=changelog.d.ts.map