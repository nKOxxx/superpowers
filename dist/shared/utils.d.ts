export interface Config {
    browser?: {
        flows?: Record<string, string[]>;
        defaultTimeout?: number;
        viewports?: {
            desktop?: {
                width: number;
                height: number;
            };
            mobile?: {
                width: number;
                height: number;
            };
        };
    };
    qa?: {
        defaultMode?: 'targeted' | 'smoke' | 'full' | 'deep';
        autoTestThreshold?: number;
        criticalPaths?: string[];
        skipPatterns?: string[];
        parallel?: boolean;
        coverageThreshold?: number;
    };
    ship?: {
        requireCleanWorkingDir?: boolean;
        runTestsBeforeRelease?: boolean;
        autoDeployTargets?: string[];
        telegramNotify?: boolean;
        repos?: Record<string, {
            deployTarget?: string;
            testCommand?: string;
        }>;
    };
    github?: {
        defaultOrg?: string;
        token?: string;
    };
    telegram?: {
        notifyOnShip?: boolean;
        target?: string;
        botToken?: string;
    };
}
export declare function loadConfig(configPath?: string): Promise<Config>;
export declare function sendTelegram(message: string, botToken?: string, chatId?: string): Promise<void>;
export declare function formatDate(date?: Date): string;
export declare function ensureDir(dir: string): void;
export declare function slugify(text: string): string;
export declare class Logger {
    private silent;
    constructor(silent?: boolean);
    log(message: string): void;
    success(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    section(title: string): void;
}
export declare function parseArgs(args: string[]): Record<string, string | boolean>;
//# sourceMappingURL=utils.d.ts.map