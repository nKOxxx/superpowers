export interface GitStatus {
    isClean: boolean;
    modified: string[];
    staged: string[];
    untracked: string[];
}
export interface CommitInfo {
    hash: string;
    message: string;
    author: string;
    date: string;
}
export declare function getGitStatus(): GitStatus;
export declare function getDiffFiles(ref?: string): string[];
export declare function getRecentCommits(count?: number): CommitInfo[];
export declare function getConventionalCommits(sinceTag?: string): Array<{
    type: string;
    message: string;
    scope?: string;
}>;
export declare function createCommit(message: string): Promise<void>;
export declare function createTag(version: string): Promise<void>;
export declare function pushToRemote(includeTags?: boolean): Promise<void>;
export declare function getCurrentBranch(): string;
export declare function getLastTag(): string | undefined;
//# sourceMappingURL=git.d.ts.map