/**
 * CLI utilities for superpowers
 */
import { Logger } from './logger';

export interface CLIOptions {
  [key: string]: string | boolean | undefined;
}

export function parseEnvOptions(): CLIOptions {
  const optionsStr = process.env.SUPERPOWER_OPTIONS || '{}';
  try {
    return JSON.parse(optionsStr);
  } catch {
    return {};
  }
}

export function getEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

export function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export function exitWithError(message: string, code = 1): never {
  console.error(message);
  process.exit(code);
}

export function exitWithSuccess(message?: string): never {
  if (message) {
    console.log(message);
  }
  process.exit(0);
}

export async function runCommand(
  name: string,
  fn: () => Promise<void>,
  logger: Logger
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`${name} failed: ${errorMessage}`);
    process.exit(1);
  }
}