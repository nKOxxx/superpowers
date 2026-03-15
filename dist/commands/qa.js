"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qaCommand = qaCommand;
const picocolors_1 = __importDefault(require("picocolors"));
const config_js_1 = require("../lib/config.js");
const git_js_1 = require("../lib/git.js");
const fs_1 = require("fs");
function qaCommand(program) {
    program
        .command('qa')
        .description('Systematic testing as QA Lead')
        .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
        .option('-d, --diff <range>', 'Git diff range for targeted mode', 'HEAD~1')
        .option('-c, --coverage', 'Enable coverage reporting')
        .option('-p, --parallel', 'Run tests in parallel')
        .action(async (options) => {
        try {
            await runQA(options);
        }
        catch (error) {
            console.error(picocolors_1.default.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    });
}
async function runQA(options) {
    const config = (0, config_js_1.mergeWithDefaults)((0, config_js_1.loadConfig)());
    const mode = options.mode || config.qa.defaultMode || 'targeted';
    console.log(picocolors_1.default.cyan('══════════════════════════════════════════════════'));
    console.log(picocolors_1.default.cyan(`QA Mode: ${mode.toUpperCase()}`));
    console.log(picocolors_1.default.cyan('══════════════════════════════════════════════════'));
    console.log();
    // Check for git repo in targeted mode
    if (mode === 'targeted' && !(0, git_js_1.isGitRepo)()) {
        console.error(picocolors_1.default.red('Error: Targeted mode requires a git repository'));
        process.exit(1);
    }
    // Determine test command
    let testCommand = config.qa.testCommand || 'npm test';
    if (options.coverage && config.qa.coverageCommand) {
        testCommand = config.qa.coverageCommand;
    }
    // Run tests based on mode
    switch (mode) {
        case 'targeted':
            await runTargetedTests(options, config, testCommand);
            break;
        case 'smoke':
            await runSmokeTests(testCommand);
            break;
        case 'full':
            await runFullTests(testCommand, options);
            break;
    }
}
async function runTargetedTests(options, config, testCommand) {
    const changedFiles = (0, git_js_1.getChangedFiles)(options.diff || 'HEAD~1');
    if (changedFiles.length === 0) {
        console.log(picocolors_1.default.yellow('No files changed. Running smoke tests instead.'));
        await runSmokeTests(testCommand);
        return;
    }
    console.log(picocolors_1.default.blue(`Files Changed: ${changedFiles.length}`));
    changedFiles.forEach(f => console.log(`  - ${f}`));
    console.log();
    // Map changed files to test files
    const testFiles = mapFilesToTests(changedFiles);
    if (testFiles.length === 0) {
        console.log(picocolors_1.default.yellow('No test files found for changed files. Running smoke tests.'));
        await runSmokeTests(testCommand);
        return;
    }
    console.log(picocolors_1.default.blue(`Tests Selected: ${testFiles.length}`));
    testFiles.forEach(f => console.log(`  - ${f}`));
    console.log();
    // Run tests
    const results = [];
    for (const testFile of testFiles) {
        process.stdout.write(`  Testing ${testFile}... `);
        const { success, output } = await (0, git_js_1.runTests)(`${testCommand} ${testFile}`);
        results.push({ file: testFile, passed: success, output });
        if (success) {
            console.log(picocolors_1.default.green('✓'));
        }
        else {
            console.log(picocolors_1.default.red('✗'));
        }
    }
    printResults(results, config.qa.coverageThreshold);
}
async function runSmokeTests(testCommand) {
    console.log(picocolors_1.default.blue('Running smoke tests...'));
    console.log();
    // Try to run smoke-specific tests first
    let command = testCommand;
    // Check for smoke test patterns
    const smokePatterns = [
        '--grep="smoke"',
        '--tags=@smoke',
        '--testNamePattern="smoke"',
    ];
    for (const pattern of smokePatterns) {
        const { success, output } = await (0, git_js_1.runTests)(`${testCommand} ${pattern}`);
        if (success || output.includes('smoke') || output.includes('pass')) {
            command = `${testCommand} ${pattern}`;
            break;
        }
    }
    const { success, output } = await (0, git_js_1.runTests)(command);
    console.log(success ? picocolors_1.default.green('✓ Smoke tests passed') : picocolors_1.default.red('✗ Smoke tests failed'));
    if (!success) {
        console.log();
        console.log(output.slice(-500)); // Show last 500 chars
    }
    if (!success) {
        process.exit(1);
    }
}
async function runFullTests(testCommand, options) {
    console.log(picocolors_1.default.blue('Running full test suite...'));
    console.log();
    const command = options.parallel ? `${testCommand} --parallel` : testCommand;
    const { success, output } = await (0, git_js_1.runTests)(command);
    console.log(success ? picocolors_1.default.green('✓ All tests passed') : picocolors_1.default.red('✗ Some tests failed'));
    console.log();
    // Parse and display summary
    const summary = parseTestOutput(output);
    console.log(`  Passed: ${picocolors_1.default.green(summary.passed.toString())}`);
    console.log(`  Failed: ${summary.failed > 0 ? picocolors_1.default.red(summary.failed.toString()) : summary.failed}`);
    console.log(`  Duration: ${summary.duration}`);
    if (!success) {
        process.exit(1);
    }
}
function mapFilesToTests(changedFiles) {
    const testFiles = new Set();
    for (const file of changedFiles) {
        // Skip test files themselves
        if (file.includes('.test.') || file.includes('.spec.')) {
            continue;
        }
        // Map source files to test files
        const mappings = [
            // src/file.ts -> tests/file.test.ts or src/file.test.ts
            { pattern: /^src\/(.*)\.ts$/, replacements: ['tests/$1.test.ts', 'src/$1.test.ts'] },
            // src/components/X.tsx -> src/components/X.test.tsx
            { pattern: /^src\/(.*)\.tsx$/, replacements: ['src/$1.test.tsx'] },
            // lib/file.js -> test/file.test.js
            { pattern: /^(.*)\.js$/, replacements: ['test/$1.test.js', '$1.test.js'] },
        ];
        for (const { pattern, replacements } of mappings) {
            const match = file.match(pattern);
            if (match) {
                for (const replacement of replacements) {
                    const testPath = file.replace(pattern, replacement);
                    if ((0, fs_1.existsSync)(testPath)) {
                        testFiles.add(testPath);
                    }
                }
            }
        }
    }
    return Array.from(testFiles);
}
function parseTestOutput(output) {
    // Try to parse various test runner outputs
    // Jest/Vitest pattern: "Tests: 5 passed, 1 failed"
    const jestMatch = output.match(/(\d+)\s+passed.*?(\d+)\s+failed/);
    if (jestMatch) {
        return {
            passed: parseInt(jestMatch[1]) || 0,
            failed: parseInt(jestMatch[2]) || 0,
            duration: extractDuration(output),
        };
    }
    // Mocha pattern: "passing (5)" / "failing (1)"
    const mochaPass = output.match(/passing\s*\((\d+)\)/);
    const mochaFail = output.match(/failing\s*\((\d+)\)/);
    if (mochaPass || mochaFail) {
        return {
            passed: mochaPass ? parseInt(mochaPass[1]) : 0,
            failed: mochaFail ? parseInt(mochaFail[1]) : 0,
            duration: extractDuration(output),
        };
    }
    return { passed: 0, failed: 0, duration: extractDuration(output) };
}
function extractDuration(output) {
    const match = output.match(/(?:Time|Duration):?\s*([\d.ms]+)/i);
    return match ? match[1] : 'unknown';
}
function printResults(results, coverageThreshold) {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log();
    console.log(picocolors_1.default.cyan('──────────────────────────────────────────────────'));
    console.log(`Passed: ${picocolors_1.default.green(passed.toString())}/${results.length} (${Math.round(passed / results.length * 100)}%)`);
    if (failed > 0) {
        console.log(`Failed: ${picocolors_1.default.red(failed.toString())}`);
    }
    console.log(picocolors_1.default.cyan('──────────────────────────────────────────────────'));
    console.log(`Status: ${failed === 0 ? picocolors_1.default.green('PASSED') : picocolors_1.default.red('FAILED')}`);
    if (failed > 0) {
        console.log();
        console.log(picocolors_1.default.red('Failed tests:'));
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  ✗ ${r.file}`);
        });
        process.exit(1);
    }
}
//# sourceMappingURL=qa.js.map