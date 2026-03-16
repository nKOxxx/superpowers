export type ReleaseType = 'major' | 'minor' | 'patch' | 'prerelease';

export interface ShipConfig {
  defaultBump: ReleaseType;
  changelogPath: string;
  packageFiles: string[];
  tagPrefix: string;
  releaseBranch: string;
  requireCleanWorkingDir: boolean;
  runTests: boolean;
  testCommand: string;
  buildCommand?: string;
  preReleaseHooks: string[];
  postReleaseHooks: string[];
  githubRepo?: string;
  npmRegistry?: string;
  npmAccess?: 'public' | 'restricted';
  telegram?: {
    botToken: string;
    chatId: string;
  };
}

export interface ReleaseOptions {
  tag?: string;
  skipChangelog?: boolean;
  skipGithub?: boolean;
  skipNpm?: boolean;
  skipGitChecks?: boolean;
  skipTests?: boolean;
  dryRun?: boolean;
  force?: boolean;
  version?: string;
}

export interface ReleaseStatus {
  currentVersion: string;
  currentBranch: string;
  isClean: boolean;
  lastTag: string;
  commitsSinceTag: number;
  recommendedBump: ReleaseType;
  hasGhToken: boolean;
  hasNpmToken: boolean;
}

export interface ChangelogEntry {
  type: string;
  message: string;
  isBreaking: boolean;
}
