// Main entry point - export all commands for programmatic use
export { browseCommand as browse } from './commands/browse.js';
export { qaCommand as qa } from './commands/qa.js';
export { shipCommand as ship } from './commands/ship.js';
export { ceoReviewCommand as ceoReview } from './commands/ceo-review.js';

// Export types
export type {
  Viewport,
  ViewportPreset,
  ActionType,
  FlowAction,
  FlowStep,
  BrowserConfig,
  QAConfig,
  ShipConfig,
  CEOReviewConfig,
  SuperpowersConfig,
  GitHubRelease,
  BATScores,
  CEOReviewInput,
  Recommendation,
  CEOReviewResult,
  ChangelogEntry,
  TestResult,
  ScreenshotResult,
} from './types/index.js';

// Export utilities
export { loadConfig, mergeWithDefaults } from './lib/config.js';
export { calculateBATScore, formatStarRating } from './lib/bat.js';
export { formatDuration, formatBytes } from './lib/format.js';
export { sendTelegramMessage, formatReleaseMessage } from './lib/telegram.js';
export { createRelease, getToken, hasGHCLI, parseRepoString } from './lib/github.js';
export {
  isGitRepo,
  getCurrentBranch,
  isWorkingDirectoryClean,
  getLatestTag,
  getChangedFiles,
  getCommitsSince,
  createTag,
  pushToRemote,
  createCommit,
  runTests,
  getRemoteUrl,
  parseRepoFromRemote,
} from './lib/git.js';
