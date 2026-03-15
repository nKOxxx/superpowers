import { program } from 'commander';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const FRAMEWORKS = {
    vitest: {
        name: 'Vitest',
        testCommand: 'npx vitest run',
        coverageCommand: 'npx vitest run --coverage',
        configFiles: ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts']
    },
    jest: {
        name: 'Jest',
        testCommand: 'npx jest',
        coverageCommand: 'npx jest --coverage',
        configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json']
    },
    mocha: {
        name: 'Mocha',
        testCommand: 'npx mocha',
        coverageCommand: 'npx nyc mocha',
        configFiles: ['.mocharc.js', '.mocharc.json', 'mocha.opts']
    }
};
function detectFramework() {
    const packageJsonPath = join(process.cwd(), 'package.json');
    if (!existsSync(packageJsonPath))
        return null;
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    // Check for config files first
    for (const [fw, config] of Object.entries(FRAMEWORKS)) {
        for (const file of config.configFiles) {
            if (existsSync(join(process.cwd(), file)))
                return fw;
        }
    }
    // Check dependencies
    if (deps.vitest)
        return 'vitest';
    if (deps.jest)
        return 'jest';
    if (deps.mocha)
        return 'mocha';
    return null;
}
function getChangedFiles() {
    try {
        const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f);
    }
    catch {
        return [];
    }
}
function mapSourceToTest(sourceFile) {
    const patterns = [
        { from: /src\/(.*)\.ts$/, to: 'test/$1.test.ts' },
        { from: /src\/(.*)\.js$/, to: 'test/$1.test.js' },
        { from: /src\/(.*)\.ts$/, to: 'src/$1.test.ts' },
        { from: /src\/(.*)\.js$/, to: 'src/$1.test.js' },
        { from: /lib\/(.*)\.rb$/, to: 'spec/$1_spec.rb' },
        { from: /app\/(.*)\.py$/, to: 'tests/test_$1.py' },
    ];
    for (const pattern of patterns) {
        const match = sourceFile.match(pattern.from);
        if (match) {
            return sourceFile.replace(pattern.from, pattern.to);
        }
    }
    // Common test file patterns
    const base = sourceFile.replace(/\.(ts|js|tsx|jsx)$/, '');
    const candidates = [
        `${base}.test.ts`, `${base}.test.js`,
        `${base}.spec.ts`, `${base}.spec.js`,
        sourceFile.replace('/src/', '/__tests__/'),
        sourceFile.replace('/src/', '/test/')
    ];
    for (const candidate of candidates) {
        if (existsSync(join(process.cwd(), candidate)))
            return candidate;
    }
    return null;
}
async function runTests(options) {
    const framework = options.framework || detectFramework() || 'vitest';
    const fwConfig = FRAMEWORKS[framework];
    if (!fwConfig) {
        throw new Error(`Unknown framework: ${framework}`);
    }
    console.log(chalk.blue(`🧪 QA Mode: ${options.mode.toUpperCase()}`));
    console.log(chalk.gray(`   Framework: ${fwConfig.name}`));
    let command;
    let args = [];
    switch (options.mode) {
        case 'smoke':
            // Quick smoke tests only
            command = fwConfig.testCommand;
            args = ['--testNamePattern="smoke|basic|sanity"', '--passWithNoTests'];
            break;
        case 'targeted':
            // Run tests for changed files
            const changed = getChangedFiles();
            console.log(chalk.gray(`   Changed files: ${changed.length}`));
            const testFiles = changed
                .map(mapSourceToTest)
                .filter((f) => f !== null && existsSync(join(process.cwd(), f)));
            if (testFiles.length === 0) {
                console.log(chalk.yellow('   No test files found for changes'));
                return { success: true, output: 'No tests to run' };
            }
            console.log(chalk.gray(`   Test files: ${testFiles.join(', ')}`));
            command = fwConfig.testCommand;
            args = testFiles;
            break;
        case 'full':
        default:
            // Full test suite
            command = options.coverage ? fwConfig.coverageCommand : fwConfig.testCommand;
            break;
    }
    return new Promise((resolve) => {
        const parts = command.split(' ');
        const cmd = parts[0];
        const baseArgs = parts.slice(1);
        const child = spawn(cmd, [...baseArgs, ...args], {
            stdio: 'pipe',
            shell: true,
            cwd: process.cwd()
        });
        let output = '';
        child.stdout?.on('data', (data) => {
            const str = data.toString();
            output += str;
            process.stdout.write(str);
        });
        child.stderr?.on('data', (data) => {
            const str = data.toString();
            output += str;
            process.stderr.write(str);
        });
        child.on('close', (code) => {
            // Parse coverage if available
            let coverage;
            const coverageMatch = output.match(/(?:All files|Statements)\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*([\d.]+)/);
            if (coverageMatch) {
                coverage = parseFloat(coverageMatch[1]);
            }
            if (code === 0) {
                console.log(chalk.green(`\n✅ Tests passed${coverage ? ` (${coverage}% coverage)` : ''}`));
                resolve({ success: true, output, coverage });
            }
            else {
                console.log(chalk.red(`\n❌ Tests failed (exit code: ${code})`));
                resolve({ success: false, output });
            }
        });
    });
}
export { runTests, detectFramework, getChangedFiles, mapSourceToTest };
export default runTests;
// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    program
        .name('qa')
        .description('Systematic testing as QA Lead')
        .version('1.0.0')
        .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
        .option('-c, --coverage', 'Enable coverage reporting', false)
        .option('-w, --watch', 'Watch mode', false)
        .option('-f, --framework <fw>', 'Test framework: vitest, jest, mocha')
        .action(async (opts) => {
        const result = await runTests(opts);
        process.exit(result.success ? 0 : 1);
    });
    program.parse();
}
