/**
 * GitHub API utilities
 */
export interface GitHubRelease {
    id: number;
    tag_name: string;
    name: string;
    body: string;
    html_url: string;
}
/**
 * Create a GitHub release
 */
export declare function createGitHubRelease(repo: string, version: string, changelog: string, token: string, prerelease?: boolean): Promise<GitHubRelease>;
/**
 * Check if GH_TOKEN is available
 */
export declare function hasGitHubToken(): boolean;
/**
 * Get GH_TOKEN
 */
export declare function getGitHubToken(): string | undefined;
//# sourceMappingURL=github.d.ts.map