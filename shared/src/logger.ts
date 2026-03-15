/**
 * Logger utility for superpowers
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  silent?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private silent: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info';
    this.prefix = options.prefix || '';
    this.silent = options.silent || false;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return `[${timestamp}]${prefix}[${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.silent || !this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message), ...args);
  }

  info(message: string, ...args: unknown[]): void {
    if (this.silent || !this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.silent || !this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    if (this.silent || !this.shouldLog('error')) return;
    console.error(this.formatMessage('error', message), ...args);
  }

  success(message: string): void {
    this.info(`✓ ${message}`);
  }

  fail(message: string): void {
    this.error(`✗ ${message}`);
  }

  spinner(message: string): { succeed: (msg?: string) => void; fail: (msg?: string) => void } {
    this.info(`⏳ ${message}`);
    return {
      succeed: (msg?: string) => this.success(msg || message),
      fail: (msg?: string) => this.fail(msg || message),
    };
  }
}

export const logger = new Logger();