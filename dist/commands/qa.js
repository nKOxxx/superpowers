import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
export async function qaCommand(options) {
    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log(`QA Mode: ${options.mode.toUpperCase()}`);
    console.log('══════════════════════════════════════════════════');
    console.log('');
    try {
        // Detect test framework
        const framework = detectTestFramework();
        console.log(`Framework: ${framework}`);
        console.log('');
        // Get changed files based on mode
        let testFiles = [];
        if (options.mode === 'targeted') {
            const changedFiles = getChangedFiles(options.diff);
            console.log(`Files Changed: ${changedFiles.length}`);
            changedFiles.forEach(f => console.log(`  - ${f}`));
            console.log('');
            testFiles = mapToTestFiles(changedFiles, framework);
        }
        else if (options.mode === 'smoke') {
            testFiles = findSmokeTests(framework);
        }
        else {
            testFiles = findAllTests(framework);
        }
        if (testFiles.length === 0) {
            console.log('No tests found to run.');
            return;
        }
        console.log(`Tests Selected: ${testFiles.length}`);
        testFiles.forEach(f => console.log(`  - ${f}`));
        console.log('');
        // Run tests
        const results = runTests(testFiles, framework, options);
        // Display results
        console.log('Results:');
        let passedCount = 0;
        let failedCount = 0;
        for (const result of results) {
            const icon = result.passed ? '✓' : '✗';
            console.log(`  ${icon} ${result.file} (${result.duration}ms)`);
            if (result.passed)
                passedCount++;
            else
                failedCount++;
        }
        console.log('');
        console.log('──────────────────────────────────────────────────');
        console.log(`Passed: ${passedCount}/${results.length} (${Math.round(passedCount / results.length * 100)}%)`);
        console.log(`Failed: ${failedCount}/${results.length}`);
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        console.log(`Duration: ${(totalDuration / 1000).toFixed(1)}s`);
        const status = failedCount === 0 ? 'PASSED' : 'FAILED';
        console.log(`Status: ${status}`);
        console.log('');
        if (failedCount > 0) {
            process.exit(1);
        }
    }
    catch (error) {
        console.error('');
        console.error('✗ Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
function detectTestFramework() {
    const packageJsonPath = resolve('package.json');
    if (!existsSync(packageJsonPath)) {
        return 'unknown';
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (deps.vitest)
        return 'vitest';
    if (deps.jest)
        return 'jest';
    if (deps.mocha)
        return 'mocha';
    if (deps['@playwright/test'])
        return 'playwright';
    return 'npm';
}
function getChangedFiles(diffRange) {
    try {
        const output = execSync(`git diff --name-only ${diffRange}`, { encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f && existsSync(f));
    }
    catch {
        return [];
    }
}
function mapToTestFiles(changedFiles, framework) {
    const testFiles = new Set();
    const extensions = framework === 'playwright' ? ['.spec.ts', '.spec.js'] : ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
    for (const file of changedFiles) {
        // Skip test files themselves
        if (extensions.some(ext => file.endsWith(ext))) {
            testFiles.add(file);
            continue;
        }
        // Map source files to test files
        const dir = file.replace(/^src\//, 'tests/').replace(/^lib\//, 'test/');
        const base = dir.replace(/\.[^.]+$/, '');
        for (const ext of extensions) {
            const testFile = `${base}${ext}`;
            if (existsSync(testFile)) {
                testFiles.add(testFile);
            }
        }
        // Try alternate locations
        const altLocations = [
            file.replace(/\.[^.]+$/, `.test.${file.endsWith('.ts') ? 'ts' : 'js'}`),
            file.replace(/\.[^.]+$/, `.spec.${file.endsWith('.ts') ? 'ts' : 'js'}`),
            join('__tests__', file.replace(/\.[^.]+$/, `.test.${file.endsWith('.ts') ? 'ts' : 'js'}`)),
        ];
        for (const alt of altLocations) {
            if (existsSync(alt)) {
                testFiles.add(alt);
            }
        }
    }
    return Array.from(testFiles);
}
function findSmokeTests(framework) {
    const patterns = [
        '**/*.smoke.test.{ts,js}',
        '**/smoke/**/*.test.{ts,js}',
        '**/tests/smoke/**/*.{ts,js}'
    ];
    try {
        const files = [];
        for (const pattern of patterns) {
            const output = execSync(`find . -path '${pattern}' -type f 2>/dev/null | head -20`, { encoding: 'utf-8' });
            files.push(...output.trim().split('\n').filter(f => f));
        }
        return [...new Set(files)];
    }
    catch {
        return [];
    }
}
function findAllTests(framework) {
    const extensions = ['test.ts', 'test.js', 'spec.ts', 'spec.js'];
    const files = [];
    try {
        for (const ext of extensions) {
            const output = execSync(`find . -name '*.${ext}' -type f 2>/dev/null | grep -v node_modules | head -50`, { encoding: 'utf-8' });
            files.push(...output.trim().split('\n').filter(f => f));
        }
        return [...new Set(files)];
    }
    catch {
        return [];
    }
}
function runTests(testFiles, framework, options) {
    const results = [];
    if (framework === 'vitest') {
        try {
            const testPattern = testFiles.length > 0 ? testFiles.join(' ') : '';
            const coverageFlag = options.coverage ? ' --coverage' : '';
            const parallelFlag = options.parallel ? ' --parallel' : '';
            const startTime = Date.now();
            execSync(`npx vitest run${coverageFlag}${parallelFlag} ${testPattern}`, {
                stdio: 'inherit',
                encoding: 'utf-8'
            });
            results.push({
                file: 'All tests',
                passed: true,
                duration: Date.now() - startTime
            });
        }
        catch {
            results.push({
                file: 'Test suite',
                passed: false,
                duration: 0
            });
        }
    }
    else if (framework === 'jest') {
        try {
            const testPattern = testFiles.length > 0 ? ` --testPathPattern="${testFiles.join('|')}"` : '';
            const coverageFlag = options.coverage ? ' --coverage' : '';
            const startTime = Date.now();
            execSync(`npx jest${coverageFlag}${testPattern}`, {
                stdio: 'inherit',
                encoding: 'utf-8'
            });
            results.push({
                file: 'All tests',
                passed: true,
                duration: Date.now() - startTime
            });
        }
        catch {
            results.push({
                file: 'Test suite',
                passed: false,
                duration: 0
            });
        }
    }
    else {
        // Generic npm test
        try {
            const startTime = Date.now();
            execSync('npm test', {
                stdio: 'inherit',
                encoding: 'utf-8'
            });
            results.push({
                file: 'npm test',
                passed: true,
                duration: Date.now() - startTime
            });
        }
        catch {
            results.push({
                file: 'npm test',
                passed: false,
                duration: 0
            });
        }
    }
    return results;
}
//# sourceMappingURL=qa.js.map