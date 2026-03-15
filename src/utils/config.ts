import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

export interface Config {
  browser?: {
    defaultViewport?: string;
    screenshotDir?: string;
    viewports?: Record<string, { width: number; height: number }>;
    flows?: Record<string, Array<{ name: string; url: string; actions?: unknown[] }>>;
  };
  qa?: {
    defaultMode?: string;
    testCommand?: string;
    coverageCommand?: string;
    coverageThreshold?: number;
  };
  ship?: {
    requireCleanWorkingDir?: boolean;
    runTestsBeforeRelease?: boolean;
    changelogPath?: string;
    versionFiles?: string[];
  };
  ceoReview?: {
    minimumScore?: number;
    requireAllBAT?: boolean;
    autoGenerateNextSteps?: boolean;
  };
}

export function loadConfig(cwd: string = process.cwd()): Config {
  const configPath = join(cwd, 'superpowers.config.json');
  
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      return JSON.parse(content) as Config;
    } catch {
      return {};
    }
  }
  
  return {};
}

export function mergeWithDefaults<T>(config: T | undefined, defaults: T): T {
  return { ...defaults, ...config };
}

export const VIEWPORT_PRESETS: Record<string, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 }
};

export function formatDate(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}