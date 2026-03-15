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
exports.handler = handler;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Parse command line arguments
function parseArgs(args) {
    const options = {
        mode: process.env.QA_DEFAULT_MODE || 'targeted',
        reporter: 'verbose',
        coverage: false,
        watch: false
    };
    for (const arg of args) {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            switch (key) {
                case 'mode':
                    if (value === 'targeted' || value === 'smoke' || value === 'full') {
                        options.mode = value;
                    }
                    break;
                case 'test-path':
                    options.testPath = value;
                    break;
                case 'reporter':
                    if (value === 'verbose' || value === 'dot' || value === 'json') {
                        options.reporter = value;
                    }
                    break;
                case 'coverage':
                    options.coverage = true;
                    break;
                case 'watch':
                    options.watch = true;
                    break;
            }
        }
    }
    return options;
}
// Detect test framework
function detectFramework(cwd) {
    const files = fs.readdirSync(cwd);
    // Check for Vitest
    if (files.some(f => f.startsWith('vitest.config')) ||
        fs.existsSync(path.join(cwd, 'node_modules', 'vitest'))) {
        return 'vitest';
    }
    // Check for Jest
    if (files.some(f => f.startsWith('jest.config')) ||
        fs.existsSync(path.join(cwd, 'node_modules', 'jest'))) {
        return 'jest';
    }
    // Check for Mocha
    if (files.some(f => f.startsWith('.mocharc')) ||
        fs.existsSync(path.join(cwd, 'node_modules', 'mocha'))) {
        return 'mocha';
    }
    // Check package.json for test script
    const packageJsonPath = path.join(cwd, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.scripts?.test) {
            return 'npm';
        }
    }
    return null;
}
// Get changed files from git
function getChangedFiles(cwd) {
    try {
        const output = (0, child_process_1.execSync)('git diff --name-only HEAD', {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch {
        return [];
    }
}
// Map changed files to test files
function getRelatedTests(changedFiles, cwd) {
    const testFiles = [];
    for (const file of changedFiles) {
        // Skip test files themselves
        if (file.includes('.test.') || file.includes('.spec.')) {
            testFiles.push(file);
            continue;
        }
        // Look for corresponding test files
        const dir = path.dirname(file);
        const base = path.basename(file, path.extname(file));
        const extensions = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
        for (const ext of extensions) {
            const testFile = path.join(dir, base + ext);
            if (fs.existsSync(path.join(cwd, testFile))) {
                testFiles.push(testFile);
            }
            // Check __tests__ directory
            const testsDir = path.join(dir, '__tests__', base + ext);
            if (fs.existsSync(path.join(cwd, testsDir))) {
                testFiles.push(testsDir);
            }
        }
    }
    return [...new Set(testFiles)];
}
// Build test command
function buildCommand(framework, options, testFiles) {
    const coverage = options.coverage ? ['--coverage'] : [];
    const reporter = options.reporter === 'json' ? ['--reporter=json'] : [];
    switch (framework) {
        case 'vitest':
            return {
                command: 'npx',
                args: [
                    'vitest',
                    'run',
                    ...coverage,
                    ...(options.reporter === 'json' ? ['--reporter=json'] : []),
                    ...(testFiles.length > 0 ? testFiles : [options.testPath || '.'])
                ]
            };
        case 'jest':
            return {
                command: 'npx',
                args: [
                    'jest',
                    ...coverage,
                    ...(options.reporter === 'json' ? ['--json'] : []),
                    ...(testFiles.length > 0 ? testFiles : [options.testPath || '.'])
                ]
            };
        case 'mocha':
            return {
                command: 'npx',
                args: [
                    'mocha',
                    ...(options.reporter === 'json' ? ['--reporter=json'] : []),
                    ...(testFiles.length > 0 ? testFiles : [options.testPath || 'test/**/*.js'])
                ]
            };
        case 'npm':
        default:
            return {
                command: 'npm',
                args: ['test']
            };
    }
}
// Parse test results
function parseResults(output, framework, mode, duration) {
    const result = {
        framework,
        mode,
        summary: { total: 0, passed: 0, failed: 0, skipped: 0, duration },
        failures: [],
        rawOutput: output
    };
    // Parse based on framework
    if (framework === 'vitest') {
        // Vitest output parsing
        const failMatch = output.match(/Failed\s+(\d+)/);
        const passMatch = output.match(/Passed\s+(\d+)/);
        const skipMatch = output.match(/Skipped\s+(\d+)/);
        if (passMatch)
            result.summary.passed = parseInt(passMatch[1], 10);
        if (failMatch)
            result.summary.failed = parseInt(failMatch[1], 10);
        if (skipMatch)
            result.summary.skipped = parseInt(skipMatch[1], 10);
        result.summary.total = result.summary.passed + result.summary.failed + result.summary.skipped;
        // Parse failures
        const failRegex = /FAIL\s+(.+?)\s+●\s+(.+?)\n\s+(.+)/g;
        let match;
        while ((match = failRegex.exec(output)) !== null) {
            result.failures.push({
                file: match[1],
                test: match[2],
                error: match[3]
            });
        }
    }
    else if (framework === 'jest') {
        // Jest output parsing
        const summaryMatch = output.match(/Tests:\s+(\d+)\s+passed.*?,(\d+)\s+failed.*?,(\d+)\s+skipped/);
        if (summaryMatch) {
            result.summary.passed = parseInt(summaryMatch[1], 10);
            result.summary.failed = parseInt(summaryMatch[2], 10);
            result.summary.skipped = parseInt(summaryMatch[3], 10);
            result.summary.total = result.summary.passed + result.summary.failed + result.summary.skipped;
        }
    }
    else {
        // Generic parsing
        const passMatch = output.match(/(\d+)\s+pass/);
        const failMatch = output.match(/(\d+)\s+fail/);
        if (passMatch)
            result.summary.passed = parseInt(passMatch[1], 10);
        if (failMatch)
            result.summary.failed = parseInt(failMatch[1], 10);
        result.summary.total = result.summary.passed + result.summary.failed;
    }
    return result;
}
// Run tests
async function runTests(framework, options, cwd) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        // Get test files for targeted mode
        let testFiles = [];
        if (options.mode === 'targeted') {
            const changedFiles = getChangedFiles(cwd);
            testFiles = getRelatedTests(changedFiles, cwd);
        }
        else if (options.mode === 'smoke') {
            // Look for smoke tests
            testFiles = ['--grep=smoke'];
        }
        const { command, args } = buildCommand(framework, options, testFiles);
        let output = '';
        const child = (0, child_process_1.spawn)(command, args, {
            cwd,
            env: { ...process.env, FORCE_COLOR: '0' },
            shell: true
        });
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        child.stderr.on('data', (data) => {
            output += data.toString();
        });
        child.on('close', (code) => {
            const duration = Date.now() - startTime;
            const results = parseResults(output, framework, options.mode, duration);
            if (code === 0 || results.summary.failed === 0) {
                resolve(results);
            }
            else {
                resolve(results); // Still resolve to get failure details
            }
        });
        child.on('error', (err) => {
            reject(err);
        });
    });
}
// Main handler function
async function handler(context) {
    const startTime = Date.now();
    const cwd = context.cwd || process.cwd();
    try {
        // Parse arguments
        const options = parseArgs(context.args);
        // Detect framework
        const framework = detectFramework(cwd);
        if (!framework) {
            return {
                success: false,
                message: 'No test framework detected. Install vitest, jest, or mocha.',
                error: 'Framework not found'
            };
        }
        // Run tests
        const results = await runTests(framework, options, cwd);
        const success = results.summary.failed === 0;
        const duration = Date.now() - startTime;
        // Build message
        let message = `✅ QA Complete (${options.mode} mode)\n\n`;
        message += `Framework: ${framework}\n`;
        message += `Total: ${results.summary.total} tests\n`;
        message += `✓ Passed: ${results.summary.passed}\n`;
        if (results.summary.failed > 0) {
            message += `✗ Failed: ${results.summary.failed}\n`;
        }
        if (results.summary.skipped > 0) {
            message += `⊘ Skipped: ${results.summary.skipped}\n`;
        }
        message += `Duration: ${(duration / 1000).toFixed(2)}s`;
        if (results.failures.length > 0) {
            message += '\n\nFailed Tests:\n';
            for (const failure of results.failures.slice(0, 5)) {
                message += `• ${failure.test}\n  ${failure.file}\n`;
            }
            if (results.failures.length > 5) {
                message += `... and ${results.failures.length - 5} more`;
            }
        }
        return {
            success,
            message,
            data: results
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            message: `QA failed: ${errorMessage}`,
            error: errorMessage
        };
    }
}
// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    const context = {
        args,
        options: {},
        cwd: process.cwd()
    };
    handler(context).then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    });
}
