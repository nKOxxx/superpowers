interface Changes {
    added: string[];
    fixed: string[];
    changed: string[];
    deprecated: string[];
    removed: string[];
    security: string[];
    docs: string[];
}
interface ReleaseResult {
    version: string;
    previousVersion: string;
    tag: string;
    changes: Changes;
    commits: number;
    filesChanged: number;
    releaseUrl?: string;
}
interface SkillContext {
    args: string[];
    options: Record<string, string | boolean>;
    cwd?: string;
}
interface SkillResult {
    success: boolean;
    message: string;
    data?: ReleaseResult;
    error?: string;
}
export declare function handler(context: SkillContext): Promise<SkillResult>;
export {};
