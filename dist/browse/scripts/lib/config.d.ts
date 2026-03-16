/**
 * Configuration loader for browse skill
 */
export interface BrowseConfig {
    browser?: {
        flows?: Record<string, any>;
        viewports?: Record<string, {
            width: number;
            height: number;
        }>;
        defaultTimeout?: number;
    };
}
export declare function loadConfig(): Promise<BrowseConfig>;
export declare function saveConfig(config: BrowseConfig, configPath?: string): Promise<void>;
//# sourceMappingURL=config.d.ts.map