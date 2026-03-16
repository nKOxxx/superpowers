/**
 * GitHub API integration
 */
import { Octokit } from '@octokit/rest';
export interface ReleaseOptions {
    owner: string;
    repo: string;
    tag: string;
    name?: string;
    body?: string;
    draft?: boolean;
    prerelease?: boolean;
    targetCommitish?: string;
}
export interface ReleaseResult {
    url: string;
    id: number;
    tag: string;
    name: string;
    published: boolean;
}
export interface RepoInfo {
    owner: string;
    repo: string;
    defaultBranch: string;
}
/**
 * Parse repo string (owner/repo format)
 */
export declare function parseRepo(repoString: string): {
    owner: string;
    repo: string;
};
/**
 * Get repo info from git remote
 */
export declare function getRepoFromGit(cwd?: string): RepoInfo;
/**
 * Create GitHub API client
 */
export declare function createGitHubClient(token?: string): Octokit;
/**
 * Create a GitHub release
 */
export declare function createRelease(options: ReleaseOptions, token?: string): Promise<ReleaseResult>;
/**
 * Get the latest release
 */
export declare function getLatestRelease(owner: string, repo: string, token?: string): Promise<{
    tag: string;
    name: string;
    published: string;
} | null>;
/**
 * Check if a release exists
 */
export declare function releaseExists(owner: string, repo: string, tag: string, token?: string): Promise<boolean>;
/**
 * Create a git tag and push to remote
 */
export declare function createGitTag(tag: string, message?: string, cwd?: string): void;
/**
 * Push tag to remote
 */
export declare function pushTag(tag: string, cwd?: string): void;
/**
 * Push commits to remote
 */
export declare function pushCommits(branch?: string, cwd?: string): void;
/**
 * Check if working directory is clean
 */
export declare function isWorkingDirectoryClean(cwd?: string): boolean;
/**
 * Get current branch name
 */
export declare function getCurrentBranch(cwd?: string): string;
/**
 * Create a release commit
 */
export declare function createReleaseCommit(version: string, files?: string[], cwd?: string): void;
/**
 * Send Telegram notification
 */
export declare function sendTelegramNotification(message: string, options?: {
    botToken?: string;
    chatId?: string;
}): Promise<boolean>;
//# sourceMappingURL=github.d.ts.map