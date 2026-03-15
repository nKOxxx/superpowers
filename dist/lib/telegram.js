"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = sendTelegramMessage;
exports.formatReleaseMessage = formatReleaseMessage;
/**
 * Send notification to Telegram
 */
async function sendTelegramMessage(message, botToken, chatId) {
    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chat = chatId || process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) {
        return {
            success: false,
            error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID',
        };
    }
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chat,
                text: message,
                parse_mode: 'Markdown',
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            return { success: false, error };
        }
        return { success: true };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Format release message for Telegram
 */
function formatReleaseMessage(repo, version, changelog) {
    return [
        `🚀 *New Release: ${repo} v${version}*`,
        '',
        '📝 *Changelog:*',
        changelog.slice(0, 1000), // Telegram limit
        '',
        `[View on GitHub](https://github.com/${repo}/releases/tag/v${version})`,
    ].join('\n');
}
//# sourceMappingURL=telegram.js.map