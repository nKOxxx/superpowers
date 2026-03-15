import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface TestFramework {
  name: string;
  configFiles: string[];
  testCommands: Record<string, string>;
}

const TEST_FRAMEWORKS: TestFramework[] = [
  { name: 'vitest', configFiles: ['vitest.config.ts', 'vitest.config.js'], testCommands: { targeted: 'npx vitest run', smoke: 'npx vitest run --testNamePattern=smoke', full: 'npx vitest run', coverage: 'npx vitest run --coverage' } },
  { name: 'jest', configFiles: ['jest.config.ts', 'jest.config.js', 'package.json'], testCommands: { targeted: 'npx jest', smoke: 'npx jest --testNamePattern=smoke', full: 'npx jest', coverage: 'npx jest --coverage' } },
  { name: 'mocha', configFiles: ['.mocharc.json', 'package.json'], testCommands: { targeted: 'npx mocha', smoke: 'npx mocha --grep smoke', full: 'npx mocha', coverage: 'npx c8 npx mocha' } }
];

function detectFramework(): TestFramework | null {
  for (const fw of TEST_FRAMEWORKS) {
    for (const configFile of fw.configFiles) {
      if (existsSync(join(process.cwd(), configFile))) {
        if (configFile === 'package.json') {
          const pkg = JSON.parse(readFileSync(join(process.cwd(), configFile), 'utf-8'));
          if (pkg.devDependencies?.[fw.name] || pkg.dependencies?.[fw.name]) return fw;
        } else return fw;
      }
    }
  }
  return null;
}

function getGitDiff(): string[] {
  try {
    return execSync('git diff HEAD~1 --name-only', { encoding: 'utf-8', cwd: process.cwd() }).trim().split('\n').filter(Boolean);
  } catch {
    try { return execSync('git diff --name-only', { encoding: 'utf-8', cwd: process.cwd() }).trim().split('\n').filter(Boolean); }
    catch { return []; }
  }
}

function mapFilesToTests(files: string[]): string[] {
  const testFiles: string[] = [];
  for (const file of files) {
    if (file.includes('.test.') || file.includes('.spec.')) continue;
    const base = file.replace(/^src\//, '').replace(/\.[^.]+$/, '');
    const exts = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
    for (const ext of exts) {
      const tests = [`${base}${ext}`, `test/${base}${ext}`, `tests/${base}${ext}`, file.replace(/\.[^.]+$/, ext)];
      for (const t of tests) if (existsSync(join(process.cwd(), t))) { testFiles.push(t); break; }
    }
  }
  return [...new Set(testFiles)];
}

async function runQAMode(mode: string, coverage: boolean): Promise<void> {
  const spinner = ora(`Running ${mode}...`).start();
  try {
    const fw = detectFramework();
    if (!fw) { spinner.fail('No test framework detected'); process.exit(1); }
    spinner.text = `Framework: ${fw.name}`;
    let cmd = fw.testCommands[mode] || fw.testCommands.full;
    if (mode === 'targeted') {
      const files = getGitDiff();
      if (files.length === 0) { spinner.warn('No changes, running full suite'); cmd = fw.testCommands.full; }
      else {
        const tests = mapFilesToTests(files);
        if (tests.length === 0) { spinner.warn('No tests found, running full suite'); cmd = fw.testCommands.full; }
        else cmd += ' ' + tests.join(' ');
      }
    }
    if (coverage) cmd = fw.testCommands.coverage;
    spinner.text = 'Running tests...';
    const start = Date.now();
    try {
      execSync(cmd, { encoding: 'utf-8', cwd: process.cwd(), stdio: 'pipe' });
      spinner.succeed(chalk.green(`Tests passed (${Date.now() - start}ms)`));
    } catch (e: any) {
      spinner.fail(chalk.red('Tests failed'));
      console.log(e.stdout || e.message);
      process.exit(1);
    }
  } catch (e) { spinner.fail(String(e)); process.exit(1); }
}

const program = new Command();
program.name('qa').description('Systematic testing').version('1.0.0');
program.option('-m, --mode <mode>', 'Mode: targeted, smoke, full', 'targeted').option('-c, --coverage', 'Enable coverage')
  .action((opts) => runQAMode(opts.mode, opts.coverage));
program.command('targeted').option('-c, --coverage', 'Enable coverage').action((opts) => runQAMode('targeted', opts.coverage));
program.command('smoke').option('-c, --coverage', 'Enable coverage').action((opts) => runQAMode('smoke', opts.coverage));
program.command('full').option('-c, --coverage', 'Enable coverage').action((opts) => runQAMode('full', opts.coverage));
program.command('frameworks').action(() => {
  const fw = detectFramework();
  console.log(fw ? chalk.green(`Found: ${fw.name}`) : chalk.red('No framework detected'));
});
program.parse();