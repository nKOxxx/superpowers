import chalk from 'chalk';

export interface Logger {
  info: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

export function createLogger(verbose = false): Logger {
  return {
    info: (message: string) => console.log(chalk.blue(message)),
    success: (message: string) => console.log(chalk.green(message)),
    warning: (message: string) => console.log(chalk.yellow(message)),
    error: (message: string) => console.error(chalk.red(message)),
    debug: (message: string) => {
      if (verbose) console.log(chalk.gray(`[debug] ${message}`));
    },
  };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function parseViewport(viewport: string): { width: number; height: number } | null {
  const match = viewport.match(/^(\d+)x(\d+)$/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  return null;
}

export const viewportPresets = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
} as const;

export type ViewportPreset = keyof typeof viewportPresets;

export function detectViewport(
  preset?: ViewportPreset,
  custom?: string
): { width: number; height: number } {
  if (custom) {
    const parsed = parseViewport(custom);
    if (parsed) return parsed;
  }
  if (preset && preset in viewportPresets) {
    return viewportPresets[preset];
  }
  return viewportPresets.desktop;
}

export interface Spinner {
  start: (text: string) => void;
  succeed: (text?: string) => void;
  fail: (text?: string) => void;
  info: (text: string) => void;
}

export function createSpinner(): Spinner {
  let currentText = '';
  
  return {
    start: (text: string) => {
      currentText = text;
      process.stdout.write(chalk.cyan(`⠋ ${text}`));
    },
    succeed: (text?: string) => {
      process.stdout.write('\r' + chalk.green(`✓ ${text || currentText}`) + '\n');
    },
    fail: (text?: string) => {
      process.stdout.write('\r' + chalk.red(`✗ ${text || currentText}`) + '\n');
    },
    info: (text: string) => {
      console.log(chalk.blue(`ℹ ${text}`));
    },
  };
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function parseJsonSafe<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

export function groupBy<T>(array: T[], key: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = key(item);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function padEnd(str: string, length: number): string {
  return str.length >= length ? str : str + ' '.repeat(length - str.length);
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}
