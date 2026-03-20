/**
 * Core types shared across all superpowers skills
 */

export interface SkillConfig {
  name: string;
  version: string;
  description: string;
}

export interface SkillResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  errors?: string[];
}

export interface CommandOptions {
  dryRun?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export class ConsoleLogger implements Logger {
  constructor(private level: LogLevel = 'info') {}

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) console.log(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) console.log(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) console.error(`[ERROR] ${message}`, ...args);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function execAsync(
  command: string,
  options?: { cwd?: string; env?: Record<string, string> }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd: options?.cwd,
      env: { ...process.env, ...options?.env },
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: exitCode || 0 });
    });
  });
}

export function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result[key] = nextArg;
        i++;
      } else {
        result[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      result[key] = true;
    } else {
      result._ = arg;
    }
  }
  
  return result;
}