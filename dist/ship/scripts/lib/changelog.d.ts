/**
 * Changelog generator for ship skill
 */
export type ChangelogPreset = 'conventional' | 'angular' | 'atom';
export interface ChangelogOptions {
    dryRun?: boolean;
    preset?: ChangelogPreset;
    includeContributors?: boolean;
}
export declare function generateChangelog(version: string, options?: ChangelogOptions): Promise<string>;
//# sourceMappingURL=changelog.d.ts.map