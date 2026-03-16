import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface TelegramConfig {
  enabled: boolean;
  botToken?: string;
  chatId?: string;
}

export interface SuperpowersConfig {
  telegram?: TelegramConfig;
  [key: string]: unknown;
}

export function loadConfig(configPath?: string): SuperpowersConfig {
  const paths = configPath 
    ? [configPath]
    : [
        'superpowers.config.json',
        '.superpowers.json',
        './config/superpowers.config.json'
      ];
  
  for (const p of paths) {
    const fullPath = resolve(p);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        return JSON.parse(content) as SuperpowersConfig;
      } catch (e) {
        console.warn(`Warning: Failed to parse config at ${p}`);
      }
    }
  }
  
  return {};
}

export function substituteEnvVars(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (_, name) => process.env[name] || '');
  }
  if (Array.isArray(obj)) {
    return obj.map(substituteEnvVars);
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVars(value);
    }
    return result;
  }
  return obj;
}

export async function sendTelegramNotification(
  config: TelegramConfig,
  message: string,
  options?: { photo?: string; caption?: string }
): Promise<void> {
  if (!config.enabled || !config.botToken || !config.chatId) {
    return;
  }

  const baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  
  try {
    if (options?.photo) {
      // Photo sending requires multipart/form-data - sending as text with link for now
      const photoMessage = `${options.caption || message}\n\n[Photo: ${options.photo}]`;
      await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: photoMessage,
          parse_mode: 'Markdown'
        })
      });
    } else {
      // Send text message
      await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
