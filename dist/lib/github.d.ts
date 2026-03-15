import { Octokit } from '@octokit/rest';
export interface ReleaseOptions {
    owner: string;
    repo: string;
    tag: string;
    name: string;
    body: string;
    draft?: boolean;
    prerelease?: boolean;
}
export declare function createGitHubClient(): Octokit;
export declare function createRelease(options: ReleaseOptions): Promise<string>;
export declare function getLatestRelease(owner: string, repo: string): Promise<{
    tag: string;
    url: string;
} | undefined>;
export declare function parseRepoString(repo: string): {
    owner: string;
    repo: string;
};
//# sourceMappingURL=github.d.ts.map