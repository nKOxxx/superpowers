/**
 * Telegram notifications for ship skill
 */
export interface NotificationPayload {
    repo: string;
    version: string;
    url?: string;
}
export declare function sendTelegramNotification(target: string, payload: NotificationPayload): Promise<void>;
//# sourceMappingURL=telegram.d.ts.map