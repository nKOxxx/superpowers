"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.loadConfig = loadConfig;
exports.getConfig = getConfig;
const fs_1 = require("fs");
const path_1 = require("path");
exports.defaultConfig = {
    browser: {
        defaultViewport: 'desktop',
        screenshotDir: './screenshots',
        viewports: {
            mobile: { width: 375, height: 667 },
            tablet: { width: 768, height: 1024 },
            desktop: { width: 1280, height: 720 }
        },
        flows: {},
        timeout: 30000
    },
    qa: {
        defaultMode: 'targeted',
        coverageThreshold: 80,
        testCommand: 'npm test',
        testPatterns: {
            unit: ['**/*.test.ts', '**/*.spec.ts'],
            integration: ['**/*.integration.test.ts'],
            e2e: ['**/e2e/**/*.spec.ts']
        }
    },
    ship: {
        requireCleanWorkingDir: true,
        runTestsBeforeRelease: true,
        testCommand: 'npm test',
        changelog: {
            preset: 'conventional',
            includeContributors: true
        },
        github: {
            defaultOrg: 'nKOxxx'
        },
        telegram: {
            notifyOnShip: true
        }
    },
    ceoReview: {
        minimumScore: 10,
        requireAllBAT: false,
        autoGenerateNextSteps: true,
        marketAnalysis: true
    }
};
async function loadConfig(cwd = process.cwd()) {
    const configPath = (0, path_1.join)(cwd, 'superpowers.config.json');
    try {
        const content = await fs_1.promises.readFile(configPath, 'utf-8');
        const userConfig = JSON.parse(content);
        // Deep merge with defaults
        return {
            browser: { ...exports.defaultConfig.browser, ...userConfig.browser },
            qa: { ...exports.defaultConfig.qa, ...userConfig.qa },
            ship: { ...exports.defaultConfig.ship, ...userConfig.ship },
            ceoReview: { ...exports.defaultConfig.ceoReview, ...userConfig.ceoReview }
        };
    }
    catch (error) {
        // Return defaults if config doesn't exist or is invalid
        return exports.defaultConfig;
    }
}
function getConfig() {
    // Synchronous version for when async isn't needed
    return exports.defaultConfig;
}
//# sourceMappingURL=config.js.map