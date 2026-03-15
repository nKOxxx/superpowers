import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
const frameworks = {
    vitest: {
        name: 'Vitest',
        configFiles: ['vitest.config.ts', 'vitest.config.js', 'vite.config.ts', 'vite.config.js'],
        testCommands: {
            targeted: 'npx vitest run --reporter=verbose',
            smoke: 'npx vitest run --reporter=verbose --testTimeout=30000',
            full: 'npx vitest run --reporter=verbose',
        },
    },
    jest: {
        name: 'Jest',
        configFiles: ['jest.config.ts', 'jest.config.js', 'jest.config.mjs'],
        testCommands: {
            targeted: 'npx jest --verbose',
            smoke: 'npx jest --verbose --testTimeout=30000 --maxWorkers=2',
            full: 'npx jest --verbose --coverage',
        },
    },
    mocha: {
        name: 'Mocha',
        configFiles: ['.mocharc.json', '.mocharc.js', 'mocha.opts'],
        testCommands: {
            targeted: 'npx mocha --reporter spec',
            smoke: 'npx mocha --reporter spec --timeout 30000',
            full: 'npx mocha --reporter spec --recursive',
        },
    },
};
export async function qaCommand(options) {
    console.log(chalk.blue('🧪 QA Lead - Starting test run...'));
    console.log(chalk.gray(`Mode: ${options.mode} | Coverage: ${options.coverage ? 'yes' : 'no'}`));
    try {
        // Detect test framework
        const framework = detectTestFramework();
        if (!framework) {
            console.log(chalk.yellow('⚠️ No test framework detected'));
            console.log(chalk.gray('Looking for: Vitest, Jest, or Mocha config files'));
            process.exit(1);
        }
        console.log(chalk.green(`✅ Detected: ${frameworks[framework].name}`));
        // Get test command based on mode
        let testCommand = frameworks[framework].testCommands[options.mode];
        if (!testCommand) {
            console.log(chalk.yellow(`⚠️ Unknown mode: ${options.mode}, using full`));
            testCommand = frameworks[framework].testCommands.full;
        }
        // Add options
        if (options.coverage && !testCommand.includes('--coverage')) {
            testCommand += ' --coverage';
        }
        if (options.watch) {
            testCommand = testCommand.replace('run ', '').replace('--reporter=verbose', '--reporter=verbose');
            if (framework === 'vitest')
                testCommand += ' --watch';
            if (framework === 'jest')
                testCommand += ' --watch';
        }
        if (options.update) {
            if (framework === 'vitest')
                testCommand += ' --update';
            if (framework === 'jest')
                testCommand += ' --updateSnapshot';
        }
        // For targeted mode, get changed files and map to tests
        if (options.mode === 'targeted') {
            const changedFiles = getChangedFiles(options.since);
            if (changedFiles.length > 0) {
                console.log(chalk.blue(`📁 Changed files (${changedFiles.length}):`));
                changedFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
                const testFiles = mapToTestFiles(changedFiles, framework);
                if (testFiles.length > 0) {
                    console.log(chalk.blue(`🧪 Related test files (${testFiles.length}):`));
                    testFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
                    // Add specific test files to command
                    if (framework === 'vitest') {
                        testCommand += ` ${testFiles.join(' ')}`;
                    }
                    else if (framework === 'jest') {
                        testCommand += ` ${testFiles.join(' ')}`;
                    }
                    else if (framework === 'mocha') {
                        testCommand += ` ${testFiles.join(' ')}`;
                    }
                }
            }
            else {
                console.log(chalk.yellow('⚠️ No changed files detected, running all tests'));
            }
        }
        // Run tests
        console.log(chalk.blue('\n▶️ Running tests...\n'));
        execSync(testCommand, {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        console.log(chalk.green('\n✅ All tests passed!'));
    }
    catch (error) {
        console.error(chalk.red('\n❌ Tests failed'));
        process.exit(1);
    }
}
function detectTestFramework() {
    // Check for config files
    for (const [name, config] of Object.entries(frameworks)) {
        for (const configFile of config.configFiles) {
            if (existsSync(resolve(process.cwd(), configFile))) {
                return name;
            }
        }
    }
    // Check package.json for test scripts
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const testScript = packageJson.scripts?.test || '';
        if (testScript.includes('vitest'))
            return 'vitest';
        if (testScript.includes('jest'))
            return 'jest';
        if (testScript.includes('mocha'))
            return 'mocha';
    }
    return null;
}
function getChangedFiles(since) {
    try {
        const output = execSync(`git diff --name-only ${since}`, {
            cwd: process.cwd(),
            encoding: 'utf-8',
        });
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    catch {
        return [];
    }
}
function mapToTestFiles(changedFiles, framework) {
    const testFiles = [];
    const extensions = framework === 'mocha' ? ['.test.js', '.spec.js'] : ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
    for (const file of changedFiles) {
        // Skip test files themselves
        if (extensions.some(ext => file.endsWith(ext))) {
            testFiles.push(file);
            continue;
        }
        // Map source file to test file
        const dir = file.substring(0, file.lastIndexOf('/') + 1) || '';
        const baseName = file.substring(file.lastIndexOf('/') + 1).replace(/\.(ts|js|tsx|jsx)$/, '');
        for (const ext of extensions) {
            const testFile = `${dir}${baseName}${ext}`;
            if (existsSync(resolve(process.cwd(), testFile))) {
                testFiles.push(testFile);
                break;
            }
            // Check __tests__ directory
            const testDirFile = `${dir}__tests__/${baseName}${ext}`;
            if (existsSync(resolve(process.cwd(), testDirFile))) {
                testFiles.push(testDirFile);
                break;
            }
        }
    }
    return [...new Set(testFiles)]; // Remove duplicates
}
