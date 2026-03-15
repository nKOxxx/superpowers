"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qaCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const git_js_1 = require("../lib/git.js");
exports.qaCommand = new commander_1.Command('qa')
    .description('Systematic testing as QA Lead')
    .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
    .option('-d, --diff <range>', 'Git diff range for targeted mode', 'HEAD~1')
    .option('-c, --coverage', 'Enable coverage reporting')
    .option('-p, --parallel', 'Run tests in parallel')
    .action(async (options) => {
    console.log(chalk_1.default.blue('══════════════════════════════════════════════════'));
    console.log(chalk_1.default.blue('QA Mode: ' + (options.mode?.toUpperCase() || 'TARGETED')));
    console.log(chalk_1.default.blue('══════════════════════════════════════════════════\n'));
    try {
        // Validate git repo
        if (!(0, git_js_1.isGitRepo)()) {
            console.error(chalk_1.default.red('✗ Not a git repository'));
            process.exit(1);
        }
        // Detect test framework
        const framework = (0, git_js_1.detectTestFramework)();
        if (!framework) {
            console.error(chalk_1.default.red('✗ No test framework detected (vitest, jest, or mocha required)'));
            process.exit(1);
        }
        console.log(chalk_1.default.gray(`Framework: ${framework}\n`));
        // Determine tests to run
        let testFiles = [];
        let testCommand = '';
        switch (options.mode) {
            case 'targeted':
                const changedFiles = (0, git_js_1.getChangedFiles)(options.diff);
                console.log(chalk_1.default.blue('Files Changed:'));
                for (const file of changedFiles.slice(0, 10)) {
                    console.log(chalk_1.default.gray(`  - ${file}`));
                }
                if (changedFiles.length > 10) {
                    console.log(chalk_1.default.gray(`  ... and ${changedFiles.length - 10} more`));
                }
                testFiles = (0, git_js_1.mapToTestFiles)(changedFiles);
                console.log(chalk_1.default.blue(`\nTests Selected: ${testFiles.length}`));
                for (const file of testFiles) {
                    console.log(chalk_1.default.gray(`  - ${file}`));
                }
                if (testFiles.length === 0) {
                    console.log(chalk_1.default.yellow('\n⚠ No tests found for changed files'));
                    console.log(chalk_1.default.gray('Running smoke tests instead...\n'));
                    options.mode = 'smoke';
                }
                break;
            case 'smoke':
                console.log(chalk_1.default.blue('Running smoke tests...\n'));
                break;
            case 'full':
                console.log(chalk_1.default.blue('Running full test suite...\n'));
                break;
        }
        // Build test command
        switch (framework) {
            case 'vitest':
                if (options.mode === 'targeted' && testFiles.length > 0) {
                    testCommand = `npx vitest run ${testFiles.join(' ')}`;
                }
                else if (options.mode === 'smoke') {
                    testCommand = 'npx vitest run --reporter=verbose -t "smoke|basic|critical"';
                }
                else {
                    testCommand = 'npx vitest run';
                }
                if (options.coverage)
                    testCommand += ' --coverage';
                break;
            case 'jest':
                if (options.mode === 'targeted' && testFiles.length > 0) {
                    testCommand = `npx jest ${testFiles.join(' ')}`;
                }
                else if (options.mode === 'smoke') {
                    testCommand = 'npx jest --testNamePattern="smoke|basic|critical"';
                }
                else {
                    testCommand = 'npx jest';
                }
                if (options.coverage)
                    testCommand += ' --coverage';
                break;
            case 'mocha':
                if (options.mode === 'targeted' && testFiles.length > 0) {
                    testCommand = `npx mocha ${testFiles.join(' ')}`;
                }
                else {
                    testCommand = 'npx mocha';
                }
                break;
        }
        // Run tests
        console.log(chalk_1.default.blue('Running tests...\n'));
        const startTime = Date.now();
        try {
            (0, child_process_1.execSync)(testCommand, { stdio: 'inherit' });
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(chalk_1.default.blue('\n──────────────────────────────────────────────────'));
            console.log(chalk_1.default.green('Status: PASSED'));
            console.log(chalk_1.default.gray(`Duration: ${duration}s`));
            console.log(chalk_1.default.blue('══════════════════════════════════════════════════'));
        }
        catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(chalk_1.default.blue('\n──────────────────────────────────────────────────'));
            console.log(chalk_1.default.red('Status: FAILED'));
            console.log(chalk_1.default.gray(`Duration: ${duration}s`));
            console.log(chalk_1.default.blue('══════════════════════════════════════════════════'));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
//# sourceMappingURL=qa.js.map