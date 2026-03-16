import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import fg from 'fast-glob';
const { glob } = fg;
import { simpleGit } from 'simple-git';
const DEFAULT_CONFIG = {
    defaultRunner: 'vitest',
    testDirs: ['src', 'tests', '__tests__'],
    testPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    coverageThreshold: 80,
    smokeTags: ['smoke', 'critical', 'sanity'],
    exclude: ['node_modules/**', 'dist/**'],
    timeout: 30000,
    workers: 4
};
export class QaSkill {
    config;
    git = simpleGit();
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async loadConfig() {
        try {
            const configPath = path.join(process.cwd(), '.qa.config.json');
            const content = await fs.readFile(configPath, 'utf-8');
            const userConfig = JSON.parse(content);
            this.config = { ...this.config, ...userConfig };
        }
        catch {
            // Use default config
        }
    }
    async detectRunner() {
        const files = await fs.readdir(process.cwd());
        if (files.includes('vitest.config.ts') || files.includes('vitest.config.js')) {
            return 'vitest';
        }
        if (files.includes('jest.config.js') || files.includes('jest.config.ts')) {
            return 'jest';
        }
        if (files.includes('playwright.config.ts') || files.includes('playwright.config.js')) {
            return 'playwright';
        }
        if (files.includes('package.json')) {
            const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
            if (pkg.devDependencies?.vitest)
                return 'vitest';
            if (pkg.devDependencies?.jest)
                return 'jest';
            if (pkg.devDependencies?.playwright)
                return 'playwright';
            if (pkg.devDependencies?.mocha)
                return 'mocha';
        }
        return this.config.defaultRunner || 'vitest';
    }
    async analyze() {
        const status = await this.git.status();
        const changedFiles = [...status.modified, ...status.created, ...status.staged];
        const riskFactors = [];
        let riskScore = 0;
        // Factor: Number of files changed
        if (changedFiles.length > 0) {
            riskScore += Math.min(changedFiles.length * 5, 30);
        }
        // Factor: Core/shared files modified
        const coreFiles = changedFiles.filter(f => f.includes('src/core') ||
            f.includes('src/shared') ||
            f.includes('src/utils') ||
            f.includes('src/index'));
        if (coreFiles.length > 0) {
            riskScore += 20;
            riskFactors.push({ type: 'core', message: 'Core/shared files modified' });
        }
        // Map to test files
        const affectedTests = await this.findRelatedTests(changedFiles);
        // Factor: Files without tests
        const untestedFiles = changedFiles.filter(f => !f.includes('.test.') &&
            !f.includes('.spec.') &&
            !affectedTests.some(t => t.includes(path.basename(f, path.extname(f)))));
        if (untestedFiles.length > 0) {
            riskScore += 15;
            riskFactors.push({ type: 'untested', message: 'Files without tests' });
        }
        // Determine recommendation
        let recommendation = 'targeted';
        if (riskScore >= 61) {
            recommendation = 'full';
        }
        else if (riskScore >= 31) {
            recommendation = 'smoke';
        }
        return {
            riskScore: Math.min(riskScore, 100),
            riskFactors,
            changedFiles,
            affectedTests,
            recommendation
        };
    }
    async findRelatedTests(changedFiles) {
        const testFiles = await glob(this.config.testPatterns, {
            ignore: this.config.exclude
        });
        const relatedTests = [];
        for (const changedFile of changedFiles) {
            const baseName = path.basename(changedFile, path.extname(changedFile));
            for (const testFile of testFiles) {
                if (testFile.includes(baseName)) {
                    relatedTests.push(testFile);
                }
            }
        }
        return [...new Set(relatedTests)];
    }
    async run(options = {}) {
        const mode = options.mode || 'targeted';
        const runner = options.runner || await this.detectRunner();
        let command;
        switch (mode) {
            case 'targeted':
                command = await this.buildTargetedCommand(runner, options);
                break;
            case 'smoke':
                command = this.buildSmokeCommand(runner, options);
                break;
            case 'full':
                command = this.buildFullCommand(runner, options);
                break;
            default:
                throw new Error(`Unknown mode: ${mode}`);
        }
        try {
            const output = execSync(command, {
                encoding: 'utf-8',
                stdio: options.verbose ? 'inherit' : 'pipe'
            });
            return { success: true, output };
        }
        catch (error) {
            return {
                success: false,
                output: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async buildTargetedCommand(runner, options) {
        const relatedTests = await this.findRelatedTests((await this.git.status()).modified);
        switch (runner) {
            case 'vitest':
                return relatedTests.length > 0
                    ? `npx vitest run ${relatedTests.join(' ')}${options.coverage ? ' --coverage' : ''}${options.bail ? ' --bail' : ''}`
                    : `npx vitest run${options.coverage ? ' --coverage' : ''}`;
            case 'jest':
                return relatedTests.length > 0
                    ? `npx jest ${relatedTests.join(' ')}${options.coverage ? ' --coverage' : ''}${options.bail ? ' --bail' : ''}`
                    : `npx jest${options.coverage ? ' --coverage' : ''}`;
            case 'playwright':
                return `npx playwright test${options.bail ? ' --max-failures=1' : ''}`;
            case 'mocha':
                return `npx mocha ${relatedTests.join(' ') || '**/*.test.js'}`;
            default:
                throw new Error(`Unsupported runner: ${runner}`);
        }
    }
    buildSmokeCommand(runner, options) {
        const smokePattern = this.config.smokeTags.join('|');
        switch (runner) {
            case 'vitest':
                return `npx vitest run -t "(${smokePattern})"${options.coverage ? ' --coverage' : ''}`;
            case 'jest':
                return `npx jest --testNamePattern="(${smokePattern})"${options.coverage ? ' --coverage' : ''}`;
            case 'playwright':
                return `npx playwright test --grep="(${smokePattern})"`;
            case 'mocha':
                return `npx mocha --grep="(${smokePattern})"`;
            default:
                throw new Error(`Unsupported runner: ${runner}`);
        }
    }
    buildFullCommand(runner, options) {
        switch (runner) {
            case 'vitest':
                return `npx vitest run${options.coverage ? ' --coverage' : ''}${options.updateSnapshots ? ' --update' : ''}`;
            case 'jest':
                return `npx jest${options.coverage ? ' --coverage' : ''}${options.updateSnapshots ? ' --updateSnapshot' : ''}`;
            case 'playwright':
                return `npx playwright test`;
            case 'mocha':
                return `npx mocha "**/*.test.js"`;
            default:
                throw new Error(`Unsupported runner: ${runner}`);
        }
    }
    async initConfig() {
        const configPath = path.join(process.cwd(), '.qa.config.json');
        await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
    getConfig() {
        return this.config;
    }
}
//# sourceMappingURL=index.js.map