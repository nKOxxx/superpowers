import axios from 'axios';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export interface TelegramConfig {
  botToken?: string;
  chatId?: string;
  channel?: string;
}

export function getTelegramConfig(): TelegramConfig {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    channel: process.env.TELEGRAM_CHANNEL
  };
}

export async function sendMessage(
  message: string,
  chatId?: string,
  options: { parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'; disableNotification?: boolean } = {}
): Promise<void> {
  const config = getTelegramConfig();
  const token = config.botToken;
  const targetChat = chatId || config.chatId || config.channel;

  if (!token) {
    console.warn('Telegram bot token not configured. Set TELEGRAM_BOT_TOKEN environment variable.');
    return;
  }

  if (!targetChat) {
    console.warn('Telegram chat ID not configured. Set TELEGRAM_CHAT_ID environment variable.');
    return;
  }

  try {
    await axios.post(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      chat_id: targetChat,
      text: message,
      parse_mode: options.parseMode,
      disable_notification: options.disableNotification ?? false
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    throw error;
  }
}

export async function sendPhoto(
  photoPath: string,
  caption?: string,
  chatId?: string
): Promise<void> {
  const config = getTelegramConfig();
  const token = config.botToken;
  const targetChat = chatId || config.chatId || config.channel;

  if (!token || !targetChat) {
    console.warn('Telegram not fully configured');
    return;
  }

  const FormData = require('form-data');
  const fs = require('fs');
  const form = new FormData();
  
  form.append('chat_id', targetChat);
  form.append('photo', fs.createReadStream(photoPath));
  if (caption) {
    form.append('caption', caption);
  }

  try {
    await axios.post(`${TELEGRAM_API_BASE}${token}/sendPhoto`, form, {
      headers: form.getHeaders()
    });
  } catch (error) {
    console.error('Failed to send Telegram photo:', error);
    throw error;
  }
}

export async function sendDocument(
  documentPath: string,
  caption?: string,
  chatId?: string
): Promise<void> {
  const config = getTelegramConfig();
  const token = config.botToken;
  const targetChat = chatId || config.chatId || config.channel;

  if (!token || !targetChat) {
    console.warn('Telegram not fully configured');
    return;
  }

  const FormData = require('form-data');
  const fs = require('fs');
  const form = new FormData();
  
  form.append('chat_id', targetChat);
  form.append('document', fs.createReadStream(documentPath));
  if (caption) {
    form.append('caption', caption);
  }

  try {
    await axios.post(`${TELEGRAM_API_BASE}${token}/sendDocument`, form, {
      headers: form.getHeaders()
    });
  } catch (error) {
    console.error('Failed to send Telegram document:', error);
    throw error;
  }
}

export function formatQAResult(result: {
  mode: string;
  changedFiles: string[];
  selectedTests: string[];
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}): string {
  const total = result.passed + result.failed + result.skipped;
  const status = result.failed === 0 ? '✅' : '❌';
  
  return `
${status} <b>QA Results - ${result.mode.toUpperCase()} Mode</b>

📁 Changed Files: ${result.changedFiles.length}
🧪 Selected Tests: ${result.selectedTests.length}

📊 Results:
  ✅ Passed: ${result.passed}
  ❌ Failed: ${result.failed}
  ⏭️ Skipped: ${result.skipped}
  📈 Total: ${total}

⏱️ Duration: ${(result.duration / 1000).toFixed(2)}s
  `.trim();
}

export function formatShipResult(result: {
  version: string;
  previousVersion: string;
  changelogUpdated: boolean;
  commitCreated: boolean;
  tagCreated: boolean;
  pushed: boolean;
  githubRelease?: { url: string };
  published: boolean;
}): string {
  return `
🚀 <b>Release ${result.version}</b>

📦 Version: ${result.previousVersion} → <b>${result.version}</b>
📝 Changelog: ${result.changelogUpdated ? '✅' : '⏭️'}
💾 Commit: ${result.commitCreated ? '✅' : '⏭️'}
🏷️ Tag: ${result.tagCreated ? '✅' : '⏭️'}
📤 Push: ${result.pushed ? '✅' : '⏭️'}
${result.githubRelease ? `🔗 GitHub: <a href="${result.githubRelease.url}">Release</a>` : ''}
📦 Published: ${result.published ? '✅' : '⏭️'}
  `.trim();
}

export function formatCEOResult(result: {
  question: string;
  scores: { brand: number; attention: number; trust: number; overall: number };
  decision: string;
}): string {
  const decisionEmoji = {
    'PROCEED': '✅',
    'PAUSE': '⏸️',
    'REJECT': '❌'
  }[result.decision] || '❓';

  return `
${decisionEmoji} <b>CEO Review: ${result.question}</b>

🎯 BAT Scores:
  🏷️ Brand: ${result.scores.brand}/10
  👀 Attention: ${result.scores.attention}/10
  🤝 Trust: ${result.scores.trust}/10
  📊 Overall: ${result.scores.overall}/10

📋 Decision: <b>${result.decision}</b>
  `.trim();
}
