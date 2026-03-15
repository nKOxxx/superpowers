import * as fs from 'fs';
import * as path from 'path';

/**
 * Logger utility for consistent output
 */
export class Logger {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(`ℹ ${message}`);
  }

  success(message: string): void {
    console.log(`✓ ${message}`);
  }

  error(message: string): void {
    console.error(`✗ ${message}`);
  }

  warn(message: string): void {
    console.warn(`⚠ ${message}`);
  }

  verboseLog(message: string): void {
    if (this.verbose) {
      console.log(`  ${message}`);
    }
  }

  header(title: string): void {
    console.log('\n' + '='.repeat(50));
    console.log(title);
    console.log('='.repeat(50));
  }

  section(title: string): void {
    console.log('\n' + title);
    console.log('-'.repeat(40));
  }
}

/**
 * Execute a shell command and return stdout
 */
export function execSync(command: string, cwd?: string, stdio?: 'inherit' | 'ignore' | 'pipe'): string {
  const { execSync } = require('child_process');
  try {
    return execSync(command, { 
      cwd, 
      encoding: 'utf-8',
      stdio: stdio || ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.stderr || error.message}`);
  }
}

/**
 * Check if a command exists
 */
export function commandExists(command: string): boolean {
  try {
    const { execSync } = require('child_process');
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure directory exists
 */
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load config from superpowers.config.json if it exists
 */
export function loadConfig(cwd: string = process.cwd()): any {
  const configPath = path.join(cwd, 'superpowers.config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Format timestamp for filenames
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Sanitize string for filenames
 */
export function sanitizeFilename(str: string): string {
  return str
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
