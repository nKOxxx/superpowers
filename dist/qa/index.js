import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
export function detectFramework(cwd = process.cwd()) {
    // Check for package.json
    const packageJsonPath = join(cwd, 'package.json');
    if (!existsSync(packageJsonPath)) {
        throw new Error('No package.json found. Are you in a Node.js project?');
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };
    // Priority: vitest > jest > mocha > npm test
    if (deps.vitest) {
        return {
            framework: 'vitest',
            command: 'npx',
            args: ['vitest', 'run']
        };
    }
    if (deps.jest) {
        return {
            framework: 'jest',
            command: 'npx',
            args: ['jest']
        };
    }
    if (deps.mocha || deps['mocha-chai']) {
        return {
            framework: 'mocha',
            command: 'npx',
            args: ['mocha']
        };
    }
    // Fallback to npm test
    return {
        framework: 'npm',
        command: 'npm',
        args: ['test']
    };
}
export function getGitDiffFiles(cwd = process.cwd()) {
    try {
        const output = execSync('git diff --name-only HEAD', { cwd, encoding: 'utf8' });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch {
        return [];
    }
}
export function getStagedFiles(cwd = process.cwd()) {
    try {
        const output = execSync('git diff --cached --name-only', { cwd, encoding: 'utf8' });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch {
        return [];
    }
}
export function mapSourceToTest(sourceFile) {
    // Common patterns for test file locations
    const patterns = [
        // Same directory: foo.ts -> foo.test.ts
        { regex: /^(.*)\.(ts|tsx|js|jsx)$/, replace: '$1.test.$2' },
        // Same directory: foo.ts -> foo.spec.ts  
        { regex: /^(.*)\.(ts|tsx|js|jsx)$/, replace: '$1.spec.$2' },
        // __tests__ directory: src/foo.ts -> src/__tests__/foo.test.ts
        { regex: /^(.*)\/(.*)\.(ts|tsx|js|jsx)$/, replace: '$1/__tests__/$2.test.$3' },
        // test directory: src/foo.ts -> test/foo.test.ts
        { regex: /^src\/(.*)\.(ts|tsx|js|jsx)$/, replace: 'test/$1.test.$2' },
        // tests directory: src/foo.ts -> tests/foo.test.ts
        { regex: /^src\/(.*)\.(ts|tsx|js|jsx)$/, replace: 'tests/$1.test.$2' },
    ];
    for (const pattern of patterns) {
        const testFile = sourceFile.replace(pattern.regex, pattern.replace);
        if (testFile !== sourceFile && existsSync(testFile)) {
            return testFile;
        }
    }
    return null;
}
export function findRelatedTests(files, cwd = process.cwd()) {
    const tests = [];
    for (const file of files) {
        // Skip non-source files
        if (!/\.(ts|tsx|js|jsx)$/.test(file))
            continue;
        if (file.includes('.test.') || file.includes('.spec.')) {
            tests.push(file);
            continue;
        }
        // Map source file to test file
        const testFile = mapSourceToTest(join(cwd, file));
        if (testFile) {
            tests.push(testFile.replace(cwd + '/', ''));
        }
    }
    return [...new Set(tests)]; // Remove duplicates
}
export async function runTests(options = {}, cwd = process.cwd()) {
    const framework = detectFramework(cwd);
    const mode = options.mode || 'targeted';
    console.log(chalk.blue(`🧪 QA Mode: ${mode.toUpperCase()}`));
    console.log(chalk.gray(`   Framework: ${framework.framework}`));
    let testPattern;
    if (mode === 'targeted') {
        // Analyze git diff to find relevant tests
        const changedFiles = [...getGitDiffFiles(cwd), ...getStagedFiles(cwd)];
        if (changedFiles.length === 0) {
            console.log(chalk.yellow('⚠️  No changed files detected. Falling back to full test suite.'));
        }
        else {
            console.log(chalk.gray(`   Changed files: ${changedFiles.length}`));
            const relatedTests = findRelatedTests(changedFiles, cwd);
            if (relatedTests.length > 0) {
                console.log(chalk.gray(`   Related tests: ${relatedTests.length}`));
                relatedTests.forEach(t => console.log(chalk.gray(`     - ${t}`)));
                // Create test pattern
                testPattern = relatedTests.join('|');
            }
            else {
                console.log(chalk.yellow('⚠️  No test files found for changed sources. Running full suite.'));
            }
        }
    }
    else if (mode === 'smoke') {
        // Run only smoke tests
        testPattern = 'smoke|basic|sanity';
        console.log(chalk.gray('   Running smoke tests only'));
    }
    // 'full' mode runs all tests (no pattern)
    // Build command arguments
    const args = [...framework.args];
    if (testPattern) {
        if (framework.framework === 'vitest') {
            args.push(testPattern);
        }
        else if (framework.framework === 'jest') {
            args.push('--testPathPattern', testPattern);
        }
        else if (framework.framework === 'mocha') {
            args.push('--grep', testPattern);
        }
    }
    if (options.coverage) {
        if (framework.framework === 'vitest') {
            args.push('--coverage');
        }
        else if (framework.framework === 'jest') {
            args.push('--coverage');
        }
        else if (framework.framework === 'mocha') {
            args.push('--require', '@c8y/instrumenter');
        }
    }
    if (options.watch) {
        if (framework.framework === 'vitest') {
            args.push('--watch');
        }
        else if (framework.framework === 'jest') {
            args.push('--watch');
        }
        else if (framework.framework === 'mocha') {
            args.push('--watch');
        }
    }
    console.log(chalk.blue(`\n▶️  Running: ${framework.command} ${args.join(' ')}\n`));
    return new Promise((resolve, reject) => {
        const child = spawn(framework.command, args, {
            cwd,
            stdio: 'inherit',
            shell: true
        });
        child.on('close', (code) => {
            if (code === 0) {
                console.log(chalk.green('\n✅ All tests passed!'));
                resolve();
            }
            else {
                console.error(chalk.red(`\n❌ Tests failed with exit code ${code}`));
                reject(new Error(`Tests failed with exit code ${code}`));
            }
        });
        child.on('error', (err) => {
            reject(err);
        });
    });
}
export { chalk };
//# sourceMappingURL=index.js.map