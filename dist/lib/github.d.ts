import type { GitHubRelease } from '../types/index.js';
/**
 * Parse owner/repo string format
 */
export declare function parseRepoString(repoString: string): {
    owner: string;
    repo: string;
};
/**
 * Create GitHub API client
 */
export declare function createGitHubClient(): {
    token: string;
};
/**
 * Get GitHub token from environment
 */
export declare function getToken(): string | null;
/**
 * Check if GitHub CLI is available
 */
export declare function hasGHCLI(): boolean;
/**
 * Create a GitHub release using gh CLI (preferred) or API
 */
export declare function createRelease(owner: string, repo: string, release: GitHubRelease): Promise<{
    success: boolean;
    url?: string;
    error?: string;
}>;
/**
 * Get repository info
 */
export declare function getRepoInfo(owner: string, repo: string): Promise<{
    success: boolean;
    default_branch?: string;
    error?: string;
}>;
//# sourceMappingURL=github.d.ts.map