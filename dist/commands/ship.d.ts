interface ShipOptions {
    version: string;
    repo?: string;
    dryRun: boolean;
    skipTests: boolean;
    notes?: string;
    prerelease: boolean;
}
export declare function shipCommand(options: ShipOptions): Promise<void>;
export {};
