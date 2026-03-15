import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
function detectTestFramework() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return 'npm';
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const devDeps = Object.keys(packageJson.devDependencies || {});
    if (devDeps.includes('vitest'))
        return 'vitest';
    if (devDeps.includes('jest'))
        return 'jest';
    if (devDeps.includes('mocha'))
        return 'mocha';
    return 'npm';
}
function getChangedFiles(diffRange) {
    try {
        const output = execSync(`git diff --name-only ${diffRange}`, { encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch {
        return [];
    }
}
function mapToTestFiles(changedFiles) {
    const testFiles = new Set();
    for (const file of changedFiles) {
        // Skip test files themselves
        if (file.includes('.test.') || file.includes('.spec.')) {
            testFiles.add(file);
            continue;
        }
        // Map source files to test files
        const ext = path.extname(file);
        const base = file.replace(ext, '');
        const possibleTests = [
            `${base}.test${ext}`,
            `${base}.spec${ext}`,
            file.replace('src/', 'tests/').replace(ext, `.test${ext}`),
            file.replace('src/', 'test/').replace(ext, `.test${ext}`),
        ];
        for (const testFile of possibleTests) {
            if (fs.existsSync(testFile)) {
                testFiles.add(testFile);
            }
        }
        // If it's a component, try to find component tests
        if (file.includes('components/')) {
            const componentName = path.basename(base);
            const componentTests = [
                `tests/components/${componentName}.test${ext}`,
                `src/components/__tests__/${componentName}.test${ext}`,
            ];
            for (const ct of componentTests) {
                if (fs.existsSync(ct)) {
                    testFiles.add(ct);
                }
            }
        }
    }
    return Array.from(testFiles);
}
function runTests(testFiles, framework, coverage) {
    const results = [];
    const coverageFlag = coverage ? ' --coverage' : '';
    const testPattern = testFiles.length > 0 ? ` -- ${testFiles.join(' ')}` : '';
    let command;
    switch (framework) {
        case 'vitest':
            command = `npx vitest run${coverageFlag}${testPattern}`;
            break;
        case 'jest':
            command = `npx jest${coverageFlag}${testPattern}`;
            break;
        case 'mocha':
            command = `npx mocha${testPattern}`;
            break;
        default:
            command = `npm test${testPattern ? ' -- ' + testPattern : ''}`;
    }
    const startTime = Date.now();
    try {
        execSync(command, {
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 300000 // 5 minutes
        });
        for (const file of testFiles) {
            results.push({
                file: path.basename(file),
                passed: true,
                duration: (Date.now() - startTime) / testFiles.length
            });
        }
    }
    catch (error) {
        const output = error.stdout || error.message || '';
        for (const file of testFiles) {
            const fileName = path.basename(file);
            const fileInOutput = output.includes(fileName) || output.includes(file);
            results.push({
                file: fileName,
                passed: !fileInOutput || !output.includes('FAIL'),
                duration: 0,
                error: fileInOutput ? 'Test failed' : undefined
            });
        }
    }
    return results;
}
function runSmokeTests(framework) {
    console.log(chalk.blue('\nℹ Running smoke tests...'));
    let command;
    switch (framework) {
        case 'vitest':
            command = 'npx vitest run --reporter=verbose -t "smoke|basic|critical"';
            break;
        case 'jest':
            command = 'npx jest --testNamePattern="smoke|basic|critical"';
            break;
        default:
            command = 'npm test -- --grep="smoke"';
    }
    const startTime = Date.now();
    try {
        execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
        return [{ file: 'smoke tests', passed: true, duration: Date.now() - startTime }];
    }
    catch (error) {
        return [{
                file: 'smoke tests',
                passed: false,
                duration: Date.now() - startTime,
                error: 'Smoke tests failed'
            }];
    }
}
function runFullSuite(framework, coverage) {
    console.log(chalk.blue('\nℹ Running full test suite...'));
    const coverageFlag = coverage ? ' --coverage' : '';
    let command;
    switch (framework) {
        case 'vitest':
            command = `npx vitest run${coverageFlag}`;
            break;
        case 'jest':
            command = `npx jest${coverageFlag}`;
            break;
        default:
            command = 'npm test';
    }
    const startTime = Date.now();
    try {
        execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
        return [{ file: 'full suite', passed: true, duration: Date.now() - startTime }];
    }
    catch (error) {
        return [{
                file: 'full suite',
                passed: false,
                duration: Date.now() - startTime,
                error: 'Tests failed'
            }];
    }
}
export async function run(options) {
    console.log(chalk.cyan('══════════════════════════════════════════════════'));
    console.log(chalk.cyan(`QA Mode: ${options.mode.toUpperCase()}`));
    console.log(chalk.cyan('══════════════════════════════════════════════════\n'));
    const framework = detectTestFramework();
    console.log(chalk.gray(`Framework: ${framework}`));
    console.log(chalk.gray(`Mode: ${options.mode}`));
    console.log(chalk.gray(`Coverage: ${options.coverage ? 'enabled' : 'disabled'}\n`));
    let results = [];
    if (options.mode === 'targeted') {
        const changedFiles = getChangedFiles(options.diff);
        console.log(chalk.blue(`Files Changed: ${changedFiles.length}`));
        changedFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
        if (changedFiles.length === 0) {
            console.log(chalk.yellow('\n⚠ No files changed, running smoke tests instead'));
            results = runSmokeTests(framework);
        }
        else {
            const testFiles = mapToTestFiles(changedFiles);
            console.log(chalk.blue(`\nTests Selected: ${testFiles.length}`));
            testFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
            if (testFiles.length === 0) {
                console.log(chalk.yellow('\n⚠ No test files found, running smoke tests'));
                results = runSmokeTests(framework);
            }
            else {
                results = runTests(testFiles, framework, options.coverage);
            }
        }
    }
    else if (options.mode === 'smoke') {
        results = runSmokeTests(framework);
    }
    else {
        results = runFullSuite(framework, options.coverage);
    }
    // Display results
    console.log(chalk.cyan('\n──────────────────────────────────────────────────'));
    console.log(chalk.bold('Results:'));
    let passed = 0;
    let failed = 0;
    for (const result of results) {
        if (result.passed) {
            console.log(chalk.green(`  ✓ ${result.file} (${Math.round(result.duration)}ms)`));
            passed++;
        }
        else {
            console.log(chalk.red(`  ✗ ${result.file}${result.error ? ` - ${result.error}` : ''}`));
            failed++;
        }
    }
    console.log(chalk.cyan('──────────────────────────────────────────────────'));
    console.log(chalk.bold(`Passed: ${passed}/${passed + failed}`));
    if (failed === 0) {
        console.log(chalk.green('\n✓ All tests passed'));
        console.log(chalk.cyan('══════════════════════════════════════════════════'));
    }
    else {
        console.log(chalk.red(`\n✗ ${failed} test(s) failed`));
        console.log(chalk.cyan('══════════════════════════════════════════════════'));
        process.exit(1);
    }
}
