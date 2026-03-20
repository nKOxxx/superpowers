export type VersionType = 'patch' | 'minor' | 'major' | string;

export interface ShipOptions {
  version: VersionType;
  dryRun: boolean;
  publish: boolean;
  githubRelease: boolean;
  branch: string;
  message?: string;
  prerelease?: string;
  skipTests: boolean;
  skipBuild: boolean;
  skipChangelog: boolean;
  force: boolean;
  silent: boolean;
}

export interface ShipResult {
  success: boolean;
  version?: string;
  previousVersion?: string;
  changelog?: {
    generated: boolean;
    entries: ChangelogEntry[];
    path?: string;
  };
  git?: {
    commit?: string;
    tag?: string;
    pushed?: boolean;
  };
  github?: {
    released: boolean;
    url?: string;
    id?: number;
  };
  npm?: {
    published: boolean;
    package?: string;
  };
  warnings: string[];
  errors: string[];
}

export interface ChangelogEntry {
  type: string;
  scope?: string;
  message: string;
  hash: string;
  breaking: boolean;
}

export interface Commit {
  hash: string;
  subject: string;
  body?: string;
  type?: string;
  scope?: string;
  breaking: boolean;
}
