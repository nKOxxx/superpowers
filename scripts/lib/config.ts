/**
 * Configuration loader for superpowers
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface Viewport {
  width: number;
  height: number;
}

export interface BrowserConfig {
  defaultViewport: string;
  viewports: Record<string, Viewport>;
  flows: Record<string, string[]>;
  screenshotDir: string;
}

export interface QAPatterns {
  unit: string[];
  integration: string[];
  e2e: string[];
}

export interface FileToTestMapping {
  [pattern: string]: string | string[];
}

export interface QAConfig {
  defaultMode: 'targeted' | 'smoke' | 'full';
  coverageThreshold: number;
  testCommand: string;
  testPatterns: QAPatterns;
  fileToTestMapping: FileToTestMapping;
}

export interface ChangelogConfig {
  preset: string;
  includeContributors: boolean;
}

export interface GitHubConfig {
  defaultOrg: string;
}

export interface TelegramConfig {
  notifyOnShip: boolean;
}

export interface ShipConfig {
  requireCleanWorkingDir: boolean;
  runTestsBeforeRelease: boolean;
  testCommand: string;
  changelog: ChangelogConfig;
  github: GitHubConfig;
  telegram: TelegramConfig;
}

export interface CEOReviewConfig {
  minimumScore: number;
  requireAllBAT: boolean;
  autoGenerateNextSteps: boolean;
  marketAnalysis: boolean;
}

export interface SuperpowersConfig {
  browser: BrowserConfig;
  qa: QAConfig;
  ship: ShipConfig;
  ceoReview: CEOReviewConfig;
}

const DEFAULT_CONFIG: SuperpowersConfig = {
  browser: {
    defaultViewport: 'desktop',
    viewports: {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 }
    },
    flows: {},
    screenshotDir: './screenshots'
  },
  qa: {
    defaultMode: 'targeted',
    coverageThreshold: 80,
    testCommand: 'npm test',
    testPatterns: {
      unit: ['**/*.test.ts', '**/*.spec.ts'],
      integration: ['**/*.integration.test.ts'],
      e2e: ['**/e2e/**/*.spec.ts']
    },
    fileToTestMapping: {
      'src/**/*.ts': 'unit',
      'src/components/*.tsx': ['unit', 'visual'],
      'src/api/**/*.ts': 'integration'
    }
  },
  ship: {
    requireCleanWorkingDir: true,
    runTestsBeforeRelease: true,
    testCommand: 'npm test',
    changelog: {
      preset: 'conventional',
      includeContributors: true
    },
    github: {
      defaultOrg: 'nKOxxx'
    },
    telegram: {
      notifyOnShip: false
    }
  },
  ceoReview: {
    minimumScore: 10,
    requireAllBAT: false,
    autoGenerateNextSteps: true,
    marketAnalysis: true
  }
};

/**
 * Load configuration from superpowers.config.json or return defaults
 */
export function loadConfig(configPath?: string): SuperpowersConfig {
  const paths = configPath 
    ? [configPath]
    : [
        './superpowers.config.json',
        './.superpowersrc.json',
        './.superpowers.json'
      ];

  for (const path of paths) {
    const fullPath = resolve(path);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const userConfig = JSON.parse(content) as Partial<SuperpowersConfig>;
        return mergeConfig(DEFAULT_CONFIG, userConfig);
      } catch (error) {
        console.warn(`Warning: Failed to parse config at ${path}:`, error);
      }
    }
  }

  return DEFAULT_CONFIG;
}

/**
 * Deep merge user config with defaults
 */
function mergeConfig(
  defaults: SuperpowersConfig,
  user: Partial<SuperpowersConfig>
): SuperpowersConfig {
  return {
    browser: { ...defaults.browser, ...user.browser },
    qa: { ...defaults.qa, ...user.qa },
    ship: { ...defaults.ship, ...user.ship },
    ceoReview: { ...defaults.ceoReview, ...user.ceoReview }
  };
}
