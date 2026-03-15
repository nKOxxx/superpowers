export type VersionBump = 'patch' | 'minor' | 'major';

export interface ShipOptions {
  bump: VersionBump | string;  // string for explicit version like "1.2.3"
  dryRun: boolean;
  skipChangelog: boolean;
  skipGitHub: boolean;
  skipTag: boolean;
  repo?: string;  // GitHub repo in format "owner/repo"
  branch?: string;
  preId?: string;  // For prerelease versions
}

export interface ConventionalCommit {
  type: string;
  scope?: string;
  description: string;
  breaking: boolean;
  hash: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    features: string[];
    fixes: string[];
    breaking: string[];
    other: string[];
  };
}

export interface ShipResult {
  success: boolean;
  version: string;
  previousVersion: string;
  tagName: string;
  changelog?: string;
  error?: string;
  steps: {
    versionBumped: boolean;
    changelogGenerated: boolean;
    tagCreated: boolean;
    pushed: boolean;
    releaseCreated: boolean;
  };
}
