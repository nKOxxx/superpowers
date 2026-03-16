import { readFile, writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export function log(message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info'): void {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    warn: chalk.yellow('⚠'),
    error: chalk.red('✗')
  }[level];
  console.log(`${prefix} ${message}`);
}

export function error(message: string): never {
  log(message, 'error');
  process.exit(1);
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + '\n');
}

export function formatDate(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

export function ensureDir(path: string): string {
  return path.replace(/\/+$/, '');
}

export function getOutputPath(dir: string, filename?: string, extension = 'png'): string {
  const name = filename || `screenshot-${formatDate()}.${extension}`;
  return join(ensureDir(dir), name);
}

export async function notifyTelegram(
  botToken: string,
  chatId: string,
  message: string
): Promise<void> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
  } catch (err) {
    log(`Failed to send Telegram notification: ${err}`, 'warn');
  }
}
