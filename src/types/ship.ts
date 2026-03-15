/**
 * Changelog entry type
 */
export type ChangelogEntryType = 'feat' | 'fix' | 'chore' | 'docs' | 'refactor' | 'test' | 'other';

/**
 * Ship skill options
 */
export interface ShipOptions {
  version: string;
  dryRun?: boolean;
  skipTests?: boolean;
  notes?: string;
  prerelease?: boolean;
  repo?: string;
}

/**
 * Release result
 */
export interface ReleaseResult {
  success: boolean;
  version?: string;
  tag?: string;
  error?: string;
  changelog?: string;
}

/**
 * Changelog entry
 */
export interface ChangelogEntry {
  type: ChangelogEntryType;
  message: string;
  scope?: string;
}
