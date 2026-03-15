/**
 * QA Skill - Systematic testing as QA Lead
 * 
 * Usage: /qa [--mode=targeted|smoke|full] [--coverage] [--pattern=<glob>]
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { QAOptions, QAMode, TestResult, SkillResult } from '../types.js';
import { success, failure, streamCommand, detectPackageManager, formatDuration, execCommandSilent } from '../utils.js';

interface TestFramework {
  name: string;
  configFiles: string[];
  testCommands: string[];
}

const FRAMEWORKS: TestFramework[] = [
  {
    name: 'vitest',
    configFiles: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs'],
    testCommands: ['vitest run', 'npx vitest run']
  },
  {
    name: 'jest',
    configFiles: ['jest.config.ts', 'jest.config.js', 'jest.config.json'],
    testCommands: ['jest', 'npx jest', 'npm test']
  },
  {
    name: 'mocha',
    configFiles: ['.mocharc.js', '.mocharc.json', 'mocha.opts'],
    testCommands: ['mocha', 'npx mocha']
  }
];

export class QASkill {
  private cwd: string;
  private framework?: TestFramework;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    detectPackageManager(cwd); // Validate environment
  }

  async execute(options: QAOptions): Promise<SkillResult> {
    const startTime = Date.now();

    try {
      // Detect test framework
      this.framework = this.detectFramework();
      if (!this.framework) {
        return failure('No test framework detected. Supported: vitest, jest, mocha');
      }

      // Get relevant test files based on mode
      const testFiles = await this.getTestFiles(options);
      if (testFiles.length === 0) {
        return failure('No test files found');
      }

      // Build and run test command
      const result = await this.runTests(options, testFiles);
      const duration = formatDuration(Date.now() - startTime);

      if (result.failed === 0) {
        return success(
          `✅ All tests passed (${result.passed}) in ${duration}\n` +
          `🧪 Framework: ${this.framework.name}\n` +
          `📁 Files: ${result.files.length}`,
          result
        );
      } else {
        return failure(
          `❌ Tests failed: ${result.failed}/${result.passed + result.failed}`,
          [`Duration: ${duration}`, `Files: ${result.files.join(', ')}`]
        );
      }
    } catch (error) {
      return failure(`QA run failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private detectFramework(): TestFramework | undefined {
    for (const framework of FRAMEWORKS) {
      for (const configFile of framework.configFiles) {
        if (existsSync(join(this.cwd, configFile))) {
          return framework;
        }
      }
    }

    // Check package.json for test scripts
    const pkgPath = join(this.cwd, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const testScript = pkg.scripts?.test || '';
      
      for (const framework of FRAMEWORKS) {
        if (framework.testCommands.some(cmd => testScript.includes(cmd.split(' ')[0]))) {
          return framework;
        }
      }
    }

    return undefined;
  }

  private async getTestFiles(options: QAOptions): Promise<string[]> {
    switch (options.mode) {
      case 'targeted':
        return this.getTargetedTests(options);
      case 'smoke':
        return this.getSmokeTests();
      default:
        return this.getAllTests();
    }
  }

  private async getTargetedTests(_options: QAOptions): Promise<string[]> {
    // Get git diff to find changed files
    const { stdout: diffOutput } = execCommandSilent('git diff --name-only HEAD~1', this.cwd);
    const changedFiles = diffOutput.split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.js'));

    if (changedFiles.length === 0) {
      return this.getAllTests();
    }

    // Find corresponding test files
    const testFiles: string[] = [];
    for (const file of changedFiles) {
      const testFile = this.findTestFile(file);
      if (testFile) {
        testFiles.push(testFile);
      }
    }

    return testFiles.length > 0 ? testFiles : this.getAllTests();
  }

  private findTestFile(sourceFile: string): string | undefined {
    const base = sourceFile.replace(/\.(ts|js)$/, '');
    const candidates = [
      `${base}.test.ts`,
      `${base}.test.js`,
      `${base}.spec.ts`,
      `${base}.spec.js`,
      sourceFile.replace(/\.(ts|js)$/, '.test.$1'),
      sourceFile.replace(/\.(ts|js)$/, '.spec.$1')
    ];

    for (const candidate of candidates) {
      if (existsSync(join(this.cwd, candidate))) {
        return candidate;
      }
    }

    return undefined;
  }

  private getSmokeTests(): string[] {
    // Look for smoke tests or basic tests
    const { stdout } = execCommandSilent('find . -name "*.test.*" -o -name "*.spec.*" | grep -i smoke || find . -name "*.test.*" -o -name "*.spec.*" | head -5', this.cwd);
    return stdout.split('\n').filter(Boolean);
  }

  private getAllTests(): string[] {
    const { stdout } = execCommandSilent('find . -name "*.test.*" -o -name "*.spec.*"', this.cwd);
    return stdout.split('\n').filter(Boolean);
  }

  private async runTests(_options: QAOptions, testFiles: string[]): Promise<TestResult> {
    const cmd = this.buildTestCommand(_options, testFiles);
    const { stdout, stderr } = await streamCommand(cmd, [], this.cwd);

    // Parse test results
    const result = this.parseTestOutput(stdout + stderr, testFiles);
    result.files = testFiles;

    return result;
  }

  private buildTestCommand(options: QAOptions, testFiles: string[]): string {
    const baseCmd = this.framework?.testCommands[0] || 'npm test';
    
    let cmd = baseCmd;
    
    if (this.framework?.name === 'vitest') {
      cmd += ' --reporter=verbose';
      if (options.coverage) cmd += ' --coverage';
      if (testFiles.length > 0 && testFiles.length < 10) {
        cmd += ' ' + testFiles.join(' ');
      }
    } else if (this.framework?.name === 'jest') {
      cmd += ' --verbose';
      if (options.coverage) cmd += ' --coverage';
      if (testFiles.length > 0 && testFiles.length < 10) {
        cmd += ' ' + testFiles.join(' ');
      }
    }

    return cmd;
  }

  private parseTestOutput(output: string, files: string[]): TestResult {
    const result: TestResult = {
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      files
    };

    // Parse vitest output
    const vitestMatch = output.match(/(\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);
    if (vitestMatch) {
      result.passed = parseInt(vitestMatch[1], 10) || 0;
      result.failed = parseInt(vitestMatch[2], 10) || 0;
      result.skipped = parseInt(vitestMatch[3], 10) || 0;
    }

    // Parse jest output
    const jestMatch = output.match(/Tests:\s+(\d+) passed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);
    if (jestMatch) {
      result.passed = parseInt(jestMatch[1], 10) || 0;
      result.failed = parseInt(jestMatch[2], 10) || 0;
      result.skipped = parseInt(jestMatch[3], 10) || 0;
    }

    // Parse duration
    const durationMatch = output.match(/(?:Duration|Time):\s+([\d.]+)(ms|s|m)/);
    if (durationMatch) {
      const value = parseFloat(durationMatch[1]);
      const unit = durationMatch[2];
      result.duration = unit === 'ms' ? value : unit === 's' ? value * 1000 : value * 60000;
    }

    return result;
  }
}

// CLI entry point
export async function run(args: string[], cwd?: string): Promise<SkillResult> {
  const options = parseQAArgs(args);
  const skill = new QASkill(cwd);
  return skill.execute(options);
}

function parseQAArgs(args: string[]): QAOptions {
  const options: QAOptions = { mode: 'targeted' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--mode' || arg.startsWith('--mode=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : args[++i];
      if (['targeted', 'smoke', 'full'].includes(value)) {
        options.mode = value as QAMode;
      }
    } else if (arg === '--coverage') {
      options.coverage = true;
    } else if (arg === '--pattern' || arg.startsWith('--pattern=')) {
      options.testPattern = arg.includes('=') ? arg.split('=')[1] : args[++i];
    }
  }

  return options;
}
