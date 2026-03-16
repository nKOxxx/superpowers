#!/usr/bin/env node
import { Command } from 'commander';
import { runTests, printAnalysis, getConfig, initConfig, showConfig, setConfig, detectRunner } from './runner.js';
import { fileURLToPath } from 'url';

const program = new Command();

program
  .name('qa')
  .description('Systematic testing - targeted, smoke, and full test modes')
  .version('1.0.0');

program
  .command('run')
  .description('Run tests based on mode')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-r, --runner <runner>', 'Test runner: jest, vitest, playwright, mocha')
  .option('-w, --watch', 'Watch mode')
  .option('-c, --coverage', 'Generate coverage report')
  .option('-u, --update-snapshots', 'Update snapshots')
  .option('-p, --pattern <pattern>', 'Test name pattern')
  .option('-b, --bail', 'Stop on first failure')
  .option('-v, --verbose', 'Verbose output')
  .option('--ci', 'CI mode (non-interactive)')
  .option('--workers <n>', 'Number of parallel workers', parseInt)
  .option('-t, --timeout <ms>', 'Test timeout', parseInt)
  .action(async (options) => {
    const success = await runTests({
      mode: options.mode,
      runner: options.runner,
      watch: options.watch,
      coverage: options.coverage,
      updateSnapshots: options.updateSnapshots,
      pattern: options.pattern,
      bail: options.bail,
      verbose: options.verbose,
      ci: options.ci,
      workers: options.workers,
      timeout: options.timeout
    });
    process.exit(success ? 0 : 1);
  });

program
  .command('analyze')
  .description('Analyze code changes and recommend test mode')
  .action(async () => {
    await printAnalysis();
  });

program
  .command('config')
  .description('Manage QA configuration')
  .option('--init', 'Initialize config file')
  .option('--show', 'Show current config')
  .option('--set <key>', 'Set config key')
  .option('--value <value>', 'Value to set')
  .action(async (options) => {
    if (options.init) {
      await initConfig();
    } else if (options.show) {
      await showConfig();
    } else if (options.set && options.value) {
      await setConfig(options.set as keyof Awaited<ReturnType<typeof getConfig>>, options.value);
    } else {
      console.log('Use --init, --show, or --set with --value');
    }
  });

program
  .command('detect')
  .description('Detect test runner used in current project')
  .action(() => {
    const runner = detectRunner();
    console.log(`Detected runner: ${runner}`);
  });

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  program.parse();
}

export { program };
