"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramNotification = sendTelegramNotification;
exports.formatShipNotification = formatShipNotification;
exports.formatQANotification = formatQANotification;
async function sendTelegramNotification(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
        console.warn('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
        return;
    }
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        if (!response.ok) {
            const error = await response.text();
            console.warn(`Failed to send Telegram notification: ${error}`);
        }
    }
    catch (error) {
        console.warn(`Telegram notification error: ${error}`);
    }
}
function formatShipNotification(repo, version, releaseUrl) {
    return `
🚀 <b>New Release Shipped!</b>

<b>Repository:</b> ${repo}
<b>Version:</b> v${version}

<a href="${releaseUrl}">View Release</a>
`.trim();
}
function formatQANotification(passed, failed, duration) {
    const status = failed === 0 ? '✅' : '❌';
    return `
${status} <b>QA Test Results</b>

<b>Passed:</b> ${passed}
<b>Failed:</b> ${failed}
<b>Duration:</b> ${duration}
`.trim();
}
//# sourceMappingURL=telegram.js.map