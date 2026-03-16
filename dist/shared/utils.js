import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs/promises';
export async function loadConfig(configPath) {
    const paths = [
        configPath,
        './superpowers.config.json',
        './config.json',
        './.superpowers/config.json',
    ].filter(Boolean);
    for (const p of paths) {
        try {
            const content = await fs.readFile(p, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            continue;
        }
    }
    return {};
}
export async function sendTelegram(message, botToken, chatId) {
    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const target = chatId || process.env.TELEGRAM_CHAT_ID;
    if (!token || !target) {
        console.log(chalk.gray('⚠️ Telegram not configured, skipping notification'));
        return;
    }
    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: target,
                text: message,
                parse_mode: 'Markdown',
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
    }
    catch (error) {
        console.error(chalk.red('Failed to send Telegram notification:'), error);
    }
}
export function formatDate(date = new Date()) {
    return date.toISOString().replace(/:/g, '-').split('.')[0];
}
export function ensureDir(dir) {
    try {
        execSync(`mkdir -p "${dir}"`, { stdio: 'ignore' });
    }
    catch {
        // Ignore errors
    }
}
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
export class Logger {
    silent;
    constructor(silent = false) {
        this.silent = silent;
    }
    log(message) {
        if (!this.silent)
            console.log(message);
    }
    success(message) {
        if (!this.silent)
            console.log(chalk.green('✅'), message);
    }
    error(message) {
        if (!this.silent)
            console.error(chalk.red('❌'), message);
    }
    warn(message) {
        if (!this.silent)
            console.log(chalk.yellow('⚠️'), message);
    }
    info(message) {
        if (!this.silent)
            console.log(chalk.blue('ℹ️'), message);
    }
    section(title) {
        if (!this.silent)
            console.log('\n' + chalk.bold.cyan(`▸ ${title}`));
    }
}
export function parseArgs(args) {
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('--')) {
                parsed[key] = nextArg;
                i++;
            }
            else {
                parsed[key] = true;
            }
        }
        else if (arg.startsWith('-')) {
            const key = arg.slice(1);
            parsed[key] = true;
        }
        else if (!parsed._) {
            parsed._ = arg;
        }
    }
    return parsed;
}
//# sourceMappingURL=utils.js.map