import type { GitCommit } from '../types/index.js';
/**
 * Check if current directory is a git repository
 */
export declare function isGitRepo(): boolean;
/**
 * Check if working directory is clean
 */
export declare function isWorkingDirectoryClean(): boolean;
/**
 * Get current git branch
 */
export declare function getCurrentBranch(): string;
/**
 * Get the last tag
 */
export declare function getLastTag(): string | null;
/**
 * Get commits since last tag or from beginning
 */
export declare function getCommitsSinceLastTag(): GitCommit[];
/**
 * Get files changed in a git diff range
 */
export declare function getChangedFiles(range?: string): string[];
/**
 * Create a git tag
 */
export declare function createTag(version: string): void;
/**
 * Push to remote
 */
export declare function pushToRemote(branch?: string): void;
/**
 * Commit all changes
 */
export declare function commitAll(message: string): void;
/**
 * Get repository owner/repo from git remote
 */
export declare function getRepoFromRemote(): string | null;
/**
 * Detect test framework
 */
export declare function detectTestFramework(): 'vitest' | 'jest' | 'mocha' | null;
/**
 * Map source files to test files
 */
export declare function mapToTestFiles(changedFiles: string[]): string[];
//# sourceMappingURL=git.d.ts.map