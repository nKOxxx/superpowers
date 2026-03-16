/**
 * Telegram notifications for ship skill
 */

export interface NotificationPayload {
  repo: string;
  version: string;
  url?: string;
}

export async function sendTelegramNotification(
  target: string,
  payload: NotificationPayload
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || target;
  
  if (!botToken) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not set, skipping notification');
    return;
  }
  
  const message = formatMessage(payload);
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.warn('⚠️  Failed to send Telegram notification:', error);
    } else {
      console.log('📱 Telegram notification sent');
    }
  } catch (error) {
    console.warn('⚠️  Telegram notification failed:', error);
  }
}

function formatMessage(payload: NotificationPayload): string {
  const lines = [
    '🚀 *New Release*',
    '',
    `*Repository:* ${payload.repo}`,
    `*Version:* \`${payload.version}\``,
  ];
  
  if (payload.url) {
    lines.push(`*Release:* [View on GitHub](${payload.url})`);
  }
  
  return lines.join('\n');
}
