/**
 * GitHub API integration for ship skill
 */
export interface ReleaseOptions {
    tag: string;
    version: string;
    notes: string;
    token?: string;
}
export declare function createGitHubRelease(repo: string, options: ReleaseOptions): Promise<string>;
export declare function getLatestRelease(repo: string, token?: string): Promise<any>;
//# sourceMappingURL=github.d.ts.map