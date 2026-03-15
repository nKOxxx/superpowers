import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
export function detectFramework() {
    // Check for vitest
    if (fs.existsSync('vitest.config.ts') || fs.existsSync('vitest.config.js')) {
        return 'vitest';
    }
    // Check for jest
    if (fs.existsSync('jest.config.ts') || fs.existsSync('jest.config.js') || fs.existsSync('jest.config.json')) {
        return 'jest';
    }
    // Check package.json for test scripts
    if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (pkg.devDependencies?.vitest)
            return 'vitest';
        if (pkg.devDependencies?.jest)
            return 'jest';
        if (pkg.dependencies?.mocha || pkg.devDependencies?.mocha)
            return 'mocha';
    }
    return 'npm';
}
export function getChangedFiles() {
    try {
        const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch {
        return [];
    }
}
export function mapToTestFiles(sourceFiles) {
    const testFiles = [];
    for (const file of sourceFiles) {
        // Skip test files themselves
        if (file.includes('.test.') || file.includes('.spec.'))
            continue;
        // Map source files to test files
        const dir = path.dirname(file);
        const basename = path.basename(file, path.extname(file));
        const extensions = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
        for (const ext of extensions) {
            const testFile = path.join(dir, basename + ext);
            if (fs.existsSync(testFile)) {
                testFiles.push(testFile);
            }
            // Check in __tests__ directory
            const testDir = path.join(dir, '__tests__', basename + ext);
            if (fs.existsSync(testDir)) {
                testFiles.push(testDir);
            }
        }
    }
    return [...new Set(testFiles)];
}
export function runTests(options) {
    const framework = detectFramework();
    let command = '';
    switch (framework) {
        case 'vitest':
            command = buildVitestCommand(options);
            break;
        case 'jest':
            command = buildJestCommand(options);
            break;
        case 'mocha':
            command = buildMochaCommand(options);
            break;
        default:
            command = buildNpmCommand(options);
    }
    let output = '';
    let exitCode = 0;
    try {
        output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    }
    catch (error) {
        output = error.stdout || error.message;
        exitCode = error.status || 1;
    }
    return {
        framework,
        command,
        exitCode,
        output,
        summary: generateSummary(output, exitCode)
    };
}
function buildVitestCommand(options) {
    let cmd = 'npx vitest run';
    if (options.mode === 'targeted' && options.files) {
        cmd += ` ${options.files}`;
    }
    else if (options.mode === 'targeted') {
        const changedFiles = getChangedFiles();
        const testFiles = mapToTestFiles(changedFiles);
        if (testFiles.length > 0) {
            cmd += ` ${testFiles.join(' ')}`;
        }
    }
    else if (options.mode === 'smoke') {
        cmd += ' --grep="smoke"';
    }
    if (options.coverage) {
        cmd += ' --coverage';
    }
    return cmd;
}
function buildJestCommand(options) {
    let cmd = 'npx jest';
    if (options.mode === 'targeted' && options.files) {
        cmd += ` ${options.files}`;
    }
    else if (options.mode === 'targeted') {
        const changedFiles = getChangedFiles();
        const testFiles = mapToTestFiles(changedFiles);
        if (testFiles.length > 0) {
            cmd += ` ${testFiles.join(' ')}`;
        }
    }
    else if (options.mode === 'smoke') {
        cmd += ' --testNamePattern="smoke"';
    }
    if (options.coverage) {
        cmd += ' --coverage';
    }
    return cmd;
}
function buildMochaCommand(options) {
    let cmd = 'npx mocha';
    if (options.files) {
        cmd += ` ${options.files}`;
    }
    return cmd;
}
function buildNpmCommand(options) {
    let cmd = 'npm test';
    if (options.coverage) {
        cmd += ' -- --coverage';
    }
    return cmd;
}
function generateSummary(output, exitCode) {
    if (exitCode === 0) {
        return '✅ All tests passed';
    }
    else {
        const failMatch = output.match(/(\d+) failed/);
        const failedCount = failMatch ? failMatch[1] : 'Some';
        return `❌ ${failedCount} test(s) failed`;
    }
}
//# sourceMappingURL=index.js.map