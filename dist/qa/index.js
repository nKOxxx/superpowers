"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qaCommand = qaCommand;
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const path_1 = require("path");
const frameworks = {
    vitest: {
        name: 'Vitest',
        command: 'npx vitest run',
        coverageFlag: '--coverage',
        watchFlag: '',
        configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs']
    },
    jest: {
        name: 'Jest',
        command: 'npx jest',
        coverageFlag: '--coverage',
        watchFlag: '--watch',
        configFiles: ['jest.config.js', 'jest.config.ts', 'jest.json']
    },
    mocha: {
        name: 'Mocha',
        command: 'npx mocha',
        coverageFlag: '',
        watchFlag: '--watch',
        configFiles: ['.mocharc.js', '.mocharc.json', '.mocharc.yml']
    },
    unknown: {
        name: 'Unknown',
        command: 'npm test',
        coverageFlag: '',
        watchFlag: '',
        configFiles: []
    }
};
async function qaCommand(options) {
    console.log(chalk_1.default.blue('🧪 QA Mode:'), chalk_1.default.cyan(options.mode || 'targeted'));
    const framework = detectFramework();
    console.log(chalk_1.default.gray(`Framework: ${frameworks[framework].name}`));
    const config = frameworks[framework];
    switch (options.mode) {
        case 'targeted':
            await runTargetedTests(config, options);
            break;
        case 'smoke':
            await runSmokeTests(config, options);
            break;
        case 'full':
            await runFullTests(config, options);
            break;
        default:
            console.error(chalk_1.default.red(`Unknown mode: ${options.mode}`));
            process.exit(1);
    }
}
function detectFramework() {
    const packageJsonPath = (0, path_1.resolve)('package.json');
    if (!(0, fs_1.existsSync)(packageJsonPath)) {
        return 'unknown';
    }
    const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
    const devDeps = { ...packageJson.devDependencies, ...packageJson.dependencies };
    // Check config files first
    for (const [fw, config] of Object.entries(frameworks)) {
        if (fw === 'unknown')
            continue;
        for (const configFile of config.configFiles) {
            if ((0, fs_1.existsSync)(configFile)) {
                return fw;
            }
        }
    }
    // Check package.json dependencies
    if (devDeps.vitest)
        return 'vitest';
    if (devDeps.jest)
        return 'jest';
    if (devDeps.mocha)
        return 'mocha';
    return 'unknown';
}
async function runTargetedTests(config, options) {
    console.log(chalk_1.default.blue('🎯 Targeted Tests'));
    console.log(chalk_1.default.gray('Analyzing git diff for changed files...'));
    try {
        const changedFiles = getChangedFiles();
        console.log(chalk_1.default.gray(`Changed files: ${changedFiles.length}`));
        if (changedFiles.length === 0) {
            console.log(chalk_1.default.yellow('No changes detected. Running smoke tests...'));
            await runSmokeTests(config, options);
            return;
        }
        // Map source files to test files
        const testFiles = mapToTestFiles(changedFiles);
        console.log(chalk_1.default.gray(`Related test files: ${testFiles.length}`));
        if (testFiles.length === 0) {
            console.log(chalk_1.default.yellow('No test files found for changes. Running smoke tests...'));
            await runSmokeTests(config, options);
            return;
        }
        for (const file of changedFiles) {
            console.log(chalk_1.default.gray(`  📄 ${file}`));
        }
        for (const file of testFiles) {
            console.log(chalk_1.default.cyan(`  🧪 ${file}`));
        }
        // Run only the relevant tests
        const testPattern = testFiles.join(' ');
        await runTestCommand(config, testPattern, options);
    }
    catch (error) {
        console.error(chalk_1.default.red('Error in targeted tests:'), error);
        process.exit(1);
    }
}
async function runSmokeTests(config, options) {
    console.log(chalk_1.default.blue('💨 Smoke Tests'));
    const testFiles = findTestFiles();
    const smokeTests = testFiles.filter(f => f.includes('.smoke.') ||
        f.includes('.spec.') ||
        f.includes('.test.')).slice(0, 5); // Limit to 5 smoke tests
    if (smokeTests.length === 0) {
        console.log(chalk_1.default.yellow('No smoke tests found. Running full test suite...'));
        await runFullTests(config, options);
        return;
    }
    const testPattern = smokeTests.join(' ');
    await runTestCommand(config, testPattern, options);
}
async function runFullTests(config, options) {
    console.log(chalk_1.default.blue('🔥 Full Test Suite'));
    await runTestCommand(config, '', options);
}
async function runTestCommand(config, testPattern, options) {
    let command = config.command;
    if (options.coverage && config.coverageFlag) {
        command += ` ${config.coverageFlag}`;
    }
    if (testPattern) {
        command += ` ${testPattern}`;
    }
    console.log(chalk_1.default.gray(`Running: ${command}`));
    console.log('');
    try {
        (0, child_process_1.execSync)(command, { stdio: 'inherit' });
        console.log(chalk_1.default.green('✅ All tests passed'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Tests failed'));
        process.exit(1);
    }
}
function getChangedFiles() {
    try {
        const output = (0, child_process_1.execSync)('git diff --name-only --diff-filter=ACM HEAD~1', { encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch (error) {
        // If no previous commit or not a git repo, return empty
        return [];
    }
}
function mapToTestFiles(sourceFiles) {
    const testFiles = [];
    for (const file of sourceFiles) {
        // Skip test files themselves
        if (file.includes('.test.') || file.includes('.spec.')) {
            testFiles.push(file);
            continue;
        }
        // Map source file to potential test files
        const dir = file.substring(0, file.lastIndexOf('/') + 1);
        const basename = file.substring(file.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
        const ext = file.substring(file.lastIndexOf('.'));
        const potentialTests = [
            `${dir}${basename}.test${ext}`,
            `${dir}${basename}.spec${ext}`,
            `${dir}__tests__/${basename}.test${ext}`,
            `${dir}__tests__/${basename}.spec${ext}`,
            `tests/${dir}${basename}.test${ext}`,
            `test/${dir}${basename}.test${ext}`
        ];
        for (const testFile of potentialTests) {
            if ((0, fs_1.existsSync)(testFile)) {
                testFiles.push(testFile);
            }
        }
    }
    return [...new Set(testFiles)]; // Remove duplicates
}
function findTestFiles() {
    try {
        const output = (0, child_process_1.execSync)('find . -type f -name "*.test.*" -o -name "*.spec.*" | head -20', { encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch (error) {
        return [];
    }
}
//# sourceMappingURL=index.js.map