"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.qa = qa;
const config_js_1 = require("../lib/config.js");
const format = __importStar(require("../lib/format.js"));
const git_js_1 = require("../lib/git.js");
const child_process_1 = require("child_process");
async function qa(options = {}) {
    const config = await (0, config_js_1.loadConfig)();
    const qaConfig = config.qa;
    const mode = options.mode || qaConfig.defaultMode || 'targeted';
    const startTime = Date.now();
    format.header(`QA Report - Mode: ${mode}`);
    // Get changed files for targeted mode
    let filesChanged = [];
    if (mode === 'targeted') {
        const diffRef = options.diff || 'HEAD~1';
        filesChanged = (0, git_js_1.getDiffFiles)(diffRef);
        format.info(`Files changed (${filesChanged.length}):`);
        filesChanged.forEach(f => format.step(`  - ${f}`));
    }
    // Determine which tests to run
    const testPatterns = qaConfig.testPatterns || {
        unit: ['**/*.test.ts', '**/*.spec.ts'],
        integration: ['**/*.integration.test.ts'],
        e2e: ['**/e2e/**/*.spec.ts']
    };
    const testsToRun = selectTests(mode, filesChanged, testPatterns);
    format.info(`Tests selected (${testsToRun.length}):`);
    testsToRun.forEach(t => format.step(`  - ${t}`));
    // Run tests
    const testCommand = qaConfig.testCommand || 'npm test';
    let passed = 0;
    let failed = 0;
    try {
        format.step('Running tests...');
        const output = (0, child_process_1.execSync)(testCommand, {
            encoding: 'utf-8',
            cwd: process.cwd(),
            stdio: 'pipe'
        });
        // Parse test results from output
        const result = parseTestOutput(output);
        passed = result.passed;
        failed = result.failed;
        if (failed === 0) {
            format.success(`All tests passed (${passed})`);
        }
        else {
            format.error(`${failed} tests failed, ${passed} passed`);
        }
    }
    catch (error) {
        // Test command failed - parse error output
        const errorOutput = error instanceof Error && 'stdout' in error
            ? String(error.stdout)
            : String(error);
        const result = parseTestOutput(errorOutput);
        passed = result.passed;
        failed = result.failed || 1;
        format.error(`${failed} tests failed, ${passed} passed`);
    }
    const duration = Date.now() - startTime;
    // Output summary
    format.divider();
    console.log(`Results:`);
    console.log(`  Mode: ${mode}`);
    console.log(`  Files Changed: ${filesChanged.length}`);
    console.log(`  Tests Run: ${testsToRun.length}`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Duration: ${format.formatDuration(duration)}`);
    const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';
    console.log(`  Status: ${status}`);
    return {
        mode,
        filesChanged,
        testsRun: testsToRun,
        passed,
        failed,
        duration
    };
}
function selectTests(mode, filesChanged, patterns) {
    switch (mode) {
        case 'smoke':
            // Run only critical smoke tests
            return ['smoke.test.ts'];
        case 'full':
            // Run all tests
            return [
                ...patterns.unit,
                ...patterns.integration,
                ...patterns.e2e
            ];
        case 'targeted':
        default:
            // Map changed files to relevant tests
            return mapFilesToTests(filesChanged, patterns);
    }
}
function mapFilesToTests(filesChanged, patterns) {
    const tests = new Set();
    for (const file of filesChanged) {
        // If test file itself changed, include it
        if (file.includes('.test.') || file.includes('.spec.')) {
            tests.add(file);
            continue;
        }
        // Map source files to their test files
        if (file.startsWith('src/')) {
            const testFile = file
                .replace('src/', 'tests/')
                .replace(/\.ts$/, '.test.ts');
            tests.add(testFile);
            // Also add unit test pattern
            const unitTest = file
                .replace(/\.ts$/, '.test.ts')
                .replace(/^src\//, '');
            tests.add(unitTest);
        }
        // Component changes trigger component tests
        if (file.includes('components') && file.endsWith('.tsx')) {
            tests.add('**/*.component.test.ts');
        }
        // API changes trigger integration tests
        if (file.includes('api/')) {
            tests.add('**/*.integration.test.ts');
        }
    }
    // If no specific tests mapped, run unit tests
    if (tests.size === 0) {
        return patterns.unit;
    }
    return Array.from(tests);
}
function parseTestOutput(output) {
    // Try to parse common test output formats
    // Vitest/Jest format: "Tests  5 passed (5)" or "✓ 5 tests"
    const passedMatch = output.match(/(\d+)\s+passed/i) ||
        output.match(/✓\s*(\d+)\s*test/i) ||
        output.match(/passing\s*\(?\s*(\d+)\s*\)?/i);
    const failedMatch = output.match(/(\d+)\s+failed/i) ||
        output.match(/✗\s*(\d+)\s*test/i) ||
        output.match(/failing\s*\(?\s*(\d+)\s*\)?/i);
    return {
        passed: passedMatch ? parseInt(passedMatch[1], 10) : 0,
        failed: failedMatch ? parseInt(failedMatch[1], 10) : 0
    };
}
//# sourceMappingURL=qa.js.map