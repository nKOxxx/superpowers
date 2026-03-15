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
exports.QASkill = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class QASkill {
    detectFramework(projectPath = process.cwd()) {
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return 'unknown';
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        if (deps.vitest)
            return 'vitest';
        if (deps.jest)
            return 'jest';
        if (deps.mocha)
            return 'mocha';
        if (deps.ava)
            return 'ava';
        if (deps['tap'])
            return 'tap';
        // Check for config files
        if (fs.existsSync(path.join(projectPath, 'vitest.config.ts')) ||
            fs.existsSync(path.join(projectPath, 'vitest.config.js'))) {
            return 'vitest';
        }
        if (fs.existsSync(path.join(projectPath, 'jest.config.ts')) ||
            fs.existsSync(path.join(projectPath, 'jest.config.js'))) {
            return 'jest';
        }
        if (fs.existsSync(path.join(projectPath, '.mocharc.js')) ||
            fs.existsSync(path.join(projectPath, '.mocharc.json'))) {
            return 'mocha';
        }
        return 'unknown';
    }
    getChangedFiles() {
        try {
            const output = (0, child_process_1.execSync)('git diff --name-only HEAD~1', { encoding: 'utf-8' });
            return output.trim().split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        }
        catch {
            return [];
        }
    }
    findTestFiles(sourceFiles) {
        const testFiles = [];
        for (const file of sourceFiles) {
            const dir = path.dirname(file);
            const base = path.basename(file, path.extname(file));
            // Common test file patterns
            const patterns = [
                path.join(dir, `${base}.test.ts`),
                path.join(dir, `${base}.test.js`),
                path.join(dir, `${base}.spec.ts`),
                path.join(dir, `${base}.spec.js`),
                path.join(dir, '__tests__', `${base}.test.ts`),
                path.join('test', `${base}.test.ts`),
                path.join('tests', `${base}.test.ts`),
            ];
            for (const pattern of patterns) {
                if (fs.existsSync(pattern)) {
                    testFiles.push(pattern);
                    break;
                }
            }
        }
        return [...new Set(testFiles)];
    }
    buildCommand(framework, options, testFiles) {
        const coverageFlag = options.coverage ? '--coverage' : '';
        switch (framework) {
            case 'vitest': {
                let cmd = `npx vitest run ${coverageFlag}`;
                if (testFiles && testFiles.length > 0) {
                    cmd += ' ' + testFiles.join(' ');
                }
                return cmd;
            }
            case 'jest': {
                let cmd = `npx jest ${coverageFlag}`;
                if (testFiles && testFiles.length > 0) {
                    cmd += ' ' + testFiles.join(' ');
                }
                return cmd;
            }
            case 'mocha': {
                let cmd = 'npx mocha';
                if (testFiles && testFiles.length > 0) {
                    cmd += ' ' + testFiles.join(' ');
                }
                else {
                    cmd += ' "test/**/*.test.js"';
                }
                return cmd;
            }
            default:
                throw new Error(`Unsupported test framework: ${framework}`);
        }
    }
    async runTests(options) {
        const framework = this.detectFramework();
        if (framework === 'unknown') {
            throw new Error('Could not detect test framework. Please ensure vitest, jest, or mocha is installed.');
        }
        let testFiles;
        // Determine which tests to run based on mode
        if (options.mode === 'targeted') {
            const changedFiles = this.getChangedFiles();
            if (changedFiles.length > 0) {
                testFiles = this.findTestFiles(changedFiles);
                console.log(`Detected changes in: ${changedFiles.join(', ')}`);
                console.log(`Mapped to test files: ${testFiles.join(', ') || 'None found'}`);
            }
        }
        else if (options.mode === 'smoke') {
            // Run only smoke tests or a subset
            testFiles = ['test/smoke.test.ts', 'test/smoke.test.js'].filter(f => fs.existsSync(f));
        }
        // 'full' mode runs all tests (no filter)
        const command = this.buildCommand(framework, options, testFiles);
        console.log(`Running: ${command}`);
        const startTime = Date.now();
        let output = '';
        let success = false;
        let testsRun = 0;
        let testsPassed = 0;
        let testsFailed = 0;
        try {
            output = (0, child_process_1.execSync)(command, {
                encoding: 'utf-8',
                stdio: 'pipe',
                timeout: 300000, // 5 minute timeout
            });
            success = true;
            // Parse test results
            const resultMatch = output.match(/(\d+)\s+passed|Tests:\s+(\d+)\s+passed/);
            if (resultMatch) {
                testsPassed = parseInt(resultMatch[1] || resultMatch[2], 10);
                testsRun = testsPassed;
            }
        }
        catch (error) {
            output = error.stdout || error.message;
            success = false;
            // Parse failed results
            const failMatch = output.match(/(\d+)\s+failed|(\d+)\s+passed/);
            if (failMatch) {
                testsFailed = parseInt(failMatch[1], 10) || 0;
                testsPassed = parseInt(failMatch[2], 10) || 0;
                testsRun = testsPassed + testsFailed;
            }
        }
        const duration = Date.now() - startTime;
        return {
            success,
            framework,
            mode: options.mode,
            testsRun,
            testsPassed,
            testsFailed,
            duration,
            output,
        };
    }
}
exports.QASkill = QASkill;
// CLI entry point
if (require.main === module) {
    async function main() {
        const args = process.argv.slice(2);
        const options = {
            mode: 'targeted',
        };
        // Parse arguments
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '--mode=targeted' || arg === '-m=targeted') {
                options.mode = 'targeted';
            }
            else if (arg === '--mode=smoke') {
                options.mode = 'smoke';
            }
            else if (arg === '--mode=full') {
                options.mode = 'full';
            }
            else if (arg === '--coverage' || arg === '-c') {
                options.coverage = true;
            }
            else if (arg.startsWith('--path=')) {
                options.testPath = arg.split('=')[1];
            }
        }
        const skill = new QASkill();
        try {
            const result = await skill.runTests(options);
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        }
        catch (error) {
            console.error(JSON.stringify({
                success: false,
                error: error.message
            }, null, 2));
            process.exit(1);
        }
    }
    main();
}
//# sourceMappingURL=index.js.map