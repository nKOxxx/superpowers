/**
 * Send notification to Telegram
 */
export declare function sendTelegramMessage(message: string, botToken?: string, chatId?: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Format release message for Telegram
 */
export declare function formatReleaseMessage(repo: string, version: string, changelog: string): string;
