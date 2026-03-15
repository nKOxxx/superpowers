import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
const CONFIG_FILES = [
    'superpowers.config.json',
    '.superpowers.json',
    'superpowers.config.js',
];
/**
 * Load configuration from file
 */
export function loadConfig(cwd = process.cwd()) {
    for (const configFile of CONFIG_FILES) {
        const configPath = join(cwd, configFile);
        if (!existsSync(configPath)) {
            continue;
        }
        try {
            if (configFile.endsWith('.js')) {
                // Dynamic import for JS config
                return require(configPath);
            }
            else {
                // JSON config
                const content = readFileSync(configPath, 'utf-8');
                return JSON.parse(content);
            }
        }
        catch (error) {
            console.warn(`Warning: Failed to load config from ${configFile}`);
        }
    }
    // Return default config
    return {
        browser: {
            defaultViewport: 'desktop',
            screenshotDir: './screenshots',
        },
        qa: {
            defaultMode: 'targeted',
            testCommand: 'npm test',
        },
        ship: {
            requireCleanWorkingDir: true,
            runTestsBeforeRelease: true,
            changelogPath: 'CHANGELOG.md',
        },
        ceoReview: {
            minimumScore: 10,
            autoGenerateNextSteps: true,
        },
    };
}
/**
 * Merge user config with defaults
 */
export function mergeWithDefaults(config) {
    return {
        browser: {
            defaultViewport: 'desktop',
            screenshotDir: './screenshots',
            viewports: {},
            flows: {},
            ...config.browser,
        },
        qa: {
            defaultMode: 'targeted',
            testCommand: 'npm test',
            coverageCommand: 'npm run test:coverage',
            coverageThreshold: 80,
            ...config.qa,
        },
        ship: {
            requireCleanWorkingDir: true,
            runTestsBeforeRelease: true,
            changelogPath: 'CHANGELOG.md',
            versionFiles: [],
            ...config.ship,
        },
        ceoReview: {
            minimumScore: 10,
            requireAllBAT: false,
            autoGenerateNextSteps: true,
            ...config.ceoReview,
        },
    };
}
