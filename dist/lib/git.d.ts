/**
 * Check if we're in a git repository
 */
export declare function isGitRepo(cwd?: string): boolean;
/**
 * Get current git branch
 */
export declare function getCurrentBranch(cwd?: string): string;
/**
 * Check if working directory is clean
 */
export declare function isWorkingDirectoryClean(cwd?: string): boolean;
/**
 * Get the latest git tag
 */
export declare function getLatestTag(cwd?: string): string | null;
/**
 * Get list of files changed since a commit/tag
 */
export declare function getChangedFiles(since?: string, cwd?: string): string[];
/**
 * Get conventional commits since a tag
 */
export declare function getCommitsSince(tag: string | null, cwd?: string): string[];
/**
 * Create a git tag
 */
export declare function createTag(version: string, message: string, cwd?: string): void;
/**
 * Push commits and tags
 */
export declare function pushToRemote(cwd?: string): void;
/**
 * Create a commit
 */
export declare function createCommit(message: string, files?: string[], cwd?: string): void;
/**
 * Run tests via npm/yarn/pnpm
 */
export declare function runTests(command: string, cwd?: string): Promise<{
    success: boolean;
    output: string;
}>;
/**
 * Get repository remote URL
 */
export declare function getRemoteUrl(cwd?: string): string | null;
/**
 * Parse owner/repo from git remote URL
 */
export declare function parseRepoFromRemote(url: string): {
    owner: string;
    repo: string;
} | null;
