interface SkillContext {
    args: string[];
    options: Record<string, string | boolean>;
    channel?: string;
    userId?: string;
}
interface SkillResult {
    success: boolean;
    message: string;
    data?: {
        screenshotPath?: string;
        url?: string;
        viewport?: string;
        duration?: number;
        actionsExecuted?: number;
    };
    error?: string;
}
export declare function handler(context: SkillContext): Promise<SkillResult>;
export {};
