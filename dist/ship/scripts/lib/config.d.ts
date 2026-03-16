/**
 * Configuration loader for ship skill
 */
export interface ShipConfig {
    ship?: {
        requireCleanWorkingDir?: boolean;
        runTestsBeforeRelease?: boolean;
        testCommand?: string;
        changelog?: {
            preset?: 'conventional' | 'angular' | 'atom';
            includeContributors?: boolean;
        };
    };
    github?: {
        defaultOrg?: string;
        token?: string;
    };
    telegram?: {
        notifyOnShip?: boolean;
        target?: string;
    };
}
export declare function loadConfig(): Promise<ShipConfig>;
//# sourceMappingURL=config.d.ts.map