#!/usr/bin/env node
import { Command } from 'commander';
import { QaSkill } from './index.js';
import chalk from 'chalk';

const program = new Command();
const skill = new QaSkill();

program
  .name('qa')
  .description('Systematic testing - QA Lead persona')
  .version('1.0.0');

program
  .command('run')
  .description('Run tests based on the specified mode')
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-r, --runner <runner>', 'Test runner: jest, vitest, playwright, mocha')
  .option('-w, --watch', 'Watch mode')
  .option('-c, --coverage', 'Generate coverage report')
  .option('-u, --update-snapshots', 'Update snapshots')
  .option('-p, --pattern <pattern>', 'Test name pattern to match')
  .option('-b, --bail', 'Stop on first failure')
  .option('-v, --verbose', 'Verbose output')
  .option('--ci', 'CI mode (non-interactive)')
  .option('--workers <n>', 'Number of parallel workers', parseInt)
  .option('-t, --timeout <ms>', 'Test timeout in milliseconds', parseInt)
  .action(async (options) => {
    try {
      await skill.loadConfig();
      
      const mode = options.mode;
      const runner = options.runner || await skill.detectRunner();
      
      console.log(chalk.blue(`🧪 Running ${mode} tests with ${runner}...`));
      
      const result = await skill.run({
        mode,
        runner,
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

      if (result.success) {
        console.log(chalk.green('✓ All tests passed'));
        process.exit(0);
      } else {
        console.error(chalk.red('✗ Tests failed'));
        if (!options.verbose) {
          console.error(result.output);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze code changes and recommend test mode')
  .action(async () => {
    try {
      await skill.loadConfig();
      
      console.log(chalk.blue('🔍 Analyzing code changes...\n'));
      
      const result = await skill.analyze();
      
      const riskColor = result.riskScore >= 61 ? 'red' : result.riskScore >= 31 ? 'yellow' : 'green';
      const riskEmoji = result.riskScore >= 61 ? '🔴' : result.riskScore >= 31 ? '🟡' : '🟢';
      
      console.log(chalk.bold('Risk Assessment:'));
      console.log(`${riskEmoji} Score: ${chalk[riskColor](result.riskScore)}/100\n`);
      
      if (result.riskFactors.length > 0) {
        console.log(chalk.bold('Risk Factors:'));
        for (const factor of result.riskFactors) {
          console.log(`  • ${factor.message}`);
        }
        console.log('');
      }
      
      if (result.changedFiles.length > 0) {
        console.log(chalk.bold('Changed Files:'));
        for (const file of result.changedFiles.slice(0, 10)) {
          console.log(`  • ${file}`);
        }
        if (result.changedFiles.length > 10) {
          console.log(`  ... and ${result.changedFiles.length - 10} more`);
        }
        console.log('');
      }
      
      if (result.affectedTests.length > 0) {
        console.log(chalk.bold('Affected Tests:'));
        for (const test of result.affectedTests) {
          console.log(chalk.green(`  ✓ ${test}`));
        }
        console.log('');
      }
      
      console.log(chalk.bold('Recommendation:'));
      console.log(`  Run: ${chalk.cyan(`qa run --mode=${result.recommendation}`)}`);
      
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Manage QA configuration')
  .option('--init', 'Initialize config file')
  .option('--show', 'Show current config')
  .option('--set <key>', 'Set config value')
  .option('--value <value>', 'Value to set')
  .action(async (options) => {
    try {
      if (options.init) {
        await skill.initConfig();
        console.log(chalk.green('✓ Created .qa.config.json'));
        process.exit(0);
      }
      
      if (options.show) {
        await skill.loadConfig();
        console.log(chalk.blue('Current configuration:'));
        console.log(JSON.stringify(skill.getConfig(), null, 2));
        process.exit(0);
      }
      
      if (options.set && options.value) {
        console.log(chalk.yellow('Config update not yet implemented'));
        process.exit(0);
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('detect')
  .description('Detect the test runner used in the current project')
  .action(async () => {
    try {
      const runner = await skill.detectRunner();
      console.log(chalk.blue(`Detected test runner: ${chalk.cyan(runner)}`));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();
