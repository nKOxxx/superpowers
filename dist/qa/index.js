"use strict";
/**
 * QA Skill - Systematic testing as QA Lead
 *
 * Usage: /qa [--mode=targeted|smoke|full] [--coverage] [--pattern=<glob>]
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QASkill = void 0;
exports.run = run;
const fs_1 = require("fs");
const path_1 = require("path");
const utils_js_1 = require("../utils.js");
const FRAMEWORKS = [
    {
        name: 'vitest',
        configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
        testCommands: ['vitest run', 'npx vitest run']
    },
    {
        name: 'jest',
        configFiles: ['jest.config.ts', 'jest.config.js', 'jest.config.json'],
        testCommands: ['jest', 'npx jest', 'npm test']
    },
    {
        name: 'mocha',
        configFiles: ['.mocharc.js', '.mocharc.json', 'mocha.opts'],
        testCommands: ['mocha', 'npx mocha']
    }
];
class QASkill {
    cwd;
    framework;
    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
        (0, utils_js_1.detectPackageManager)(cwd); // Validate environment
    }
    async execute(options) {
        const startTime = Date.now();
        try {
            // Detect test framework
            this.framework = this.detectFramework();
            if (!this.framework) {
                return (0, utils_js_1.failure)('No test framework detected. Supported: vitest, jest, mocha');
            }
            // Get relevant test files based on mode
            const testFiles = await this.getTestFiles(options);
            if (testFiles.length === 0) {
                return (0, utils_js_1.failure)('No test files found');
            }
            // Build and run test command
            const result = await this.runTests(options, testFiles);
            const duration = (0, utils_js_1.formatDuration)(Date.now() - startTime);
            if (result.failed === 0) {
                return (0, utils_js_1.success)(`✅ All tests passed (${result.passed}) in ${duration}\n` +
                    `🧪 Framework: ${this.framework.name}\n` +
                    `📁 Files: ${result.files.length}`, result);
            }
            else {
                return (0, utils_js_1.failure)(`❌ Tests failed: ${result.failed}/${result.passed + result.failed}`, [`Duration: ${duration}`, `Files: ${result.files.join(', ')}`]);
            }
        }
        catch (error) {
            return (0, utils_js_1.failure)(`QA run failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    detectFramework() {
        for (const framework of FRAMEWORKS) {
            for (const configFile of framework.configFiles) {
                if ((0, fs_1.existsSync)((0, path_1.join)(this.cwd, configFile))) {
                    return framework;
                }
            }
        }
        // Check package.json for test scripts
        const pkgPath = (0, path_1.join)(this.cwd, 'package.json');
        if ((0, fs_1.existsSync)(pkgPath)) {
            const pkg = JSON.parse((0, fs_1.readFileSync)(pkgPath, 'utf-8'));
            const testScript = pkg.scripts?.test || '';
            for (const framework of FRAMEWORKS) {
                if (framework.testCommands.some(cmd => testScript.includes(cmd.split(' ')[0]))) {
                    return framework;
                }
            }
        }
        return undefined;
    }
    async getTestFiles(options) {
        switch (options.mode) {
            case 'targeted':
                return this.getTargetedTests(options);
            case 'smoke':
                return this.getSmokeTests();
            default:
                return this.getAllTests();
        }
    }
    async getTargetedTests(_options) {
        // Get git diff to find changed files
        const { stdout: diffOutput } = (0, utils_js_1.execCommandSilent)('git diff --name-only HEAD~1', this.cwd);
        const changedFiles = diffOutput.split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        if (changedFiles.length === 0) {
            return this.getAllTests();
        }
        // Find corresponding test files
        const testFiles = [];
        for (const file of changedFiles) {
            const testFile = this.findTestFile(file);
            if (testFile) {
                testFiles.push(testFile);
            }
        }
        return testFiles.length > 0 ? testFiles : this.getAllTests();
    }
    findTestFile(sourceFile) {
        const base = sourceFile.replace(/\.(ts|js)$/, '');
        const candidates = [
            `${base}.test.ts`,
            `${base}.test.js`,
            `${base}.spec.ts`,
            `${base}.spec.js`,
            sourceFile.replace(/\.(ts|js)$/, '.test.$1'),
            sourceFile.replace(/\.(ts|js)$/, '.spec.$1')
        ];
        for (const candidate of candidates) {
            if ((0, fs_1.existsSync)((0, path_1.join)(this.cwd, candidate))) {
                return candidate;
            }
        }
        return undefined;
    }
    getSmokeTests() {
        // Look for smoke tests or basic tests
        const { stdout } = (0, utils_js_1.execCommandSilent)('find . -name "*.test.*" -o -name "*.spec.*" | grep -i smoke || find . -name "*.test.*" -o -name "*.spec.*" | head -5', this.cwd);
        return stdout.split('\n').filter(Boolean);
    }
    getAllTests() {
        const { stdout } = (0, utils_js_1.execCommandSilent)('find . -name "*.test.*" -o -name "*.spec.*"', this.cwd);
        return stdout.split('\n').filter(Boolean);
    }
    async runTests(_options, testFiles) {
        const cmd = this.buildTestCommand(_options, testFiles);
        const { stdout, stderr } = await (0, utils_js_1.streamCommand)(cmd, [], this.cwd);
        // Parse test results
        const result = this.parseTestOutput(stdout + stderr, testFiles);
        result.files = testFiles;
        return result;
    }
    buildTestCommand(options, testFiles) {
        const baseCmd = this.framework?.testCommands[0] || 'npm test';
        let cmd = baseCmd;
        if (this.framework?.name === 'vitest') {
            cmd += ' --reporter=verbose';
            if (options.coverage)
                cmd += ' --coverage';
            if (testFiles.length > 0 && testFiles.length < 10) {
                cmd += ' ' + testFiles.join(' ');
            }
        }
        else if (this.framework?.name === 'jest') {
            cmd += ' --verbose';
            if (options.coverage)
                cmd += ' --coverage';
            if (testFiles.length > 0 && testFiles.length < 10) {
                cmd += ' ' + testFiles.join(' ');
            }
        }
        return cmd;
    }
    parseTestOutput(output, files) {
        const result = {
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            files
        };
        // Parse vitest output
        const vitestMatch = output.match(/(\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);
        if (vitestMatch) {
            result.passed = parseInt(vitestMatch[1], 10) || 0;
            result.failed = parseInt(vitestMatch[2], 10) || 0;
            result.skipped = parseInt(vitestMatch[3], 10) || 0;
        }
        // Parse jest output
        const jestMatch = output.match(/Tests:\s+(\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);
        if (jestMatch) {
            result.passed = parseInt(jestMatch[1], 10) || 0;
            result.failed = parseInt(jestMatch[2], 10) || 0;
            result.skipped = parseInt(jestMatch[3], 10) || 0;
        }
        // Parse duration
        const durationMatch = output.match(/(?:Duration|Time):\s+([\d.]+)(ms|s|m)/);
        if (durationMatch) {
            const value = parseFloat(durationMatch[1]);
            const unit = durationMatch[2];
            result.duration = unit === 'ms' ? value : unit === 's' ? value * 1000 : value * 60000;
        }
        return result;
    }
}
exports.QASkill = QASkill;
// CLI entry point
async function run(args, cwd) {
    const options = parseQAArgs(args);
    const skill = new QASkill(cwd);
    return skill.execute(options);
}
function parseQAArgs(args) {
    const options = { mode: 'targeted' };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--mode' || arg.startsWith('--mode=')) {
            const value = arg.includes('=') ? arg.split('=')[1] : args[++i];
            if (['targeted', 'smoke', 'full'].includes(value)) {
                options.mode = value;
            }
        }
        else if (arg === '--coverage') {
            options.coverage = true;
        }
        else if (arg === '--pattern' || arg.startsWith('--pattern=')) {
            options.testPattern = arg.includes('=') ? arg.split('=')[1] : args[++i];
        }
    }
    return options;
}
//# sourceMappingURL=index.js.map