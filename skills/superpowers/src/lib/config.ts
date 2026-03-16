import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { Config, BrowserConfig, QAConfig, ShipConfig, CeoReviewConfig } from '../types.js';

const DEFAULT_CONFIG: Config = {
  browser: {
    defaultViewport: 'desktop',
    screenshotDir: './browse-results',
    viewports: {
      mobile: { width: 375, height: 667, deviceScaleFactor: 2 },
      tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
      desktop: { width: 1280, height: 720, deviceScaleFactor: 1 }
    }
  },
  qa: {
    defaultMode: 'targeted',
    coverageThreshold: 80,
    testCommand: 'npm test',
    testPatterns: {
      unit: ['**/*.test.ts', '**/*.spec.ts'],
      integration: ['**/*.integration.test.ts'],
      e2e: ['**/e2e/**/*.spec.ts']
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
      enabled: true,
      defaultOrg: 'nKOxxx'
    }
  },
  ceoReview: {
    minimumScore: 7.0,
    requireAllBAT: false,
    autoGenerateNextSteps: true,
    marketAnalysis: true
  }
};

export function loadConfig(): Config {
  const configPaths = [
    'superpowers.config.json',
    '.superpowersrc.json',
    'superpowers.config.js',
    '.superpowersrc.js'
  ];

  for (const configPath of configPaths) {
    const fullPath = resolve(process.cwd(), configPath);
    
    if (!existsSync(fullPath)) continue;

    try {
      if (configPath.endsWith('.js')) {
        // For JS configs, we need to import dynamically
        // This is a simplified version - in production, use proper import
        const config = require(fullPath);
        return mergeConfig(DEFAULT_CONFIG, config);
      } else {
        const content = readFileSync(fullPath, 'utf-8');
        const config = JSON.parse(content);
        return mergeConfig(DEFAULT_CONFIG, config);
      }
    } catch (error) {
      console.warn(`Warning: Failed to load config from ${configPath}`);
    }
  }

  return DEFAULT_CONFIG;
}

function mergeConfig(defaults: Config, user: Partial<Config>): Config {
  return {
    browser: { ...defaults.browser, ...user.browser },
    qa: { ...defaults.qa, ...user.qa },
    ship: { ...defaults.ship, ...user.ship },
    ceoReview: { ...defaults.ceoReview, ...user.ceoReview }
  };
}

export function getBrowserConfig(config: Config): BrowserConfig {
  return config.browser || DEFAULT_CONFIG.browser!;
}

export function getQAConfig(config: Config): QAConfig {
  return config.qa || DEFAULT_CONFIG.qa!;
}

export function getShipConfig(config: Config): ShipConfig {
  return config.ship || DEFAULT_CONFIG.ship!;
}

export function getCeoReviewConfig(config: Config): CeoReviewConfig {
  return config.ceoReview || DEFAULT_CONFIG.ceoReview!;
}

export function saveConfig(config: Config): void {
  // Implementation for saving config if needed
  const fs = require('fs');
  const path = resolve(process.cwd(), 'superpowers.config.json');
  fs.writeFileSync(path, JSON.stringify(config, null, 2));
}
