#!/usr/bin/env tsx
/**
 * /qa - Systematic Testing Skill
 * 
 * Analyzes code changes and runs appropriate tests
 */
import { Command } from 'commander';
import pc from 'picocolors';
import { loadConfig } from './lib/config.js';
import { getChangedFiles, analyzeChanges, generateTestCommand, formatAnalysis } from './lib/analyzer.js';
import { runTests, formatTestResults, checkCoverage } from './lib/test-runner.js';

const program = new Command();

program
  .name('qa')
  .description('Systematic testing - analyze changes and run appropriate tests')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Test mode: targeted, smoke, full', 'targeted')
  .option('-d, --diff <target>', 'Git diff target (e.g., HEAD~1, main)', 'HEAD~1')
  .option('-c, --coverage', 'Check coverage threshold', false)
  .option('-t, --test-command <cmd>', 'Override test command')
  .option('--config <path>', 'Path to config file')
  .option('--dry-run', 'Show what would be tested without running')
  .action(async (options: { mode?: string; diff?: string; coverage?: boolean; testCommand?: string; config?: string; dryRun?: boolean }) => {
    try {
      const config = loadConfig(options.config);
      
      console.log(pc.cyan('🧪 QA: Systematic Testing'));
      console.log(pc.gray(`Mode: ${options.mode}`));
      console.log('');

      const mode = options.mode as 'targeted' | 'smoke' | 'full';

      // Full mode - just run all tests
      if (mode === 'full') {
        console.log(pc.yellow('🔄 Running full test suite...'));
        
        const testCommand = options.testCommand || config.qa.testCommand;
        
        if (options.dryRun) {
          console.log(pc.blue('📋 Would run:'), testCommand);
          return;
        }

        const result = await runTests(testCommand);
        console.log('');
        console.log(formatTestResults([result]));

        // Check coverage
        if (options.coverage) {
          const coverage = checkCoverage([result], config.qa.coverageThreshold);
          console.log('');
          console.log(`Coverage: ${coverage.actual.toFixed(1)}% (threshold: ${coverage.threshold}%)`);
          if (!coverage.passed) {
            console.log(pc.red('❌ Coverage check failed'));
            process.exit(1);
          }
        }

        process.exit(result.passed ? 0 : 1);
      }

      // Smoke mode - quick validation
      if (mode === 'smoke') {
        console.log(pc.yellow('💨 Running smoke tests...'));
        
        const testCommand = generateTestCommand([], config.qa, 'smoke');
        
        if (options.dryRun) {
          console.log(pc.blue('📋 Would run:'), testCommand);
          return;
        }

        const result = await runTests(testCommand);
        console.log('');
        console.log(formatTestResults([result]));
        process.exit(result.passed ? 0 : 1);
      }

      // Targeted mode - analyze and run relevant tests
      console.log(pc.yellow('📊 Analyzing changes...'));
      
      const changedFiles = getChangedFiles(options.diff);
      
      if (changedFiles.length === 0) {
        console.log(pc.green('✅ No changes detected'));
        return;
      }

      const analysis = analyzeChanges(changedFiles, config.qa);
      console.log(formatAnalysis(analysis));
      console.log('');

      // Generate test command
      const testCommand = generateTestCommand(analysis.testSelections, config.qa, 'targeted');
      
      console.log(pc.yellow('🧪 Test Command:'));
      console.log(pc.gray(testCommand));
      console.log('');

      if (options.dryRun) {
        console.log(pc.blue('📋 Dry run - no tests executed'));
        return;
      }

      // Run tests
      if (analysis.testSelections.length === 0) {
        console.log(pc.yellow('⚠️ No specific tests identified, running full suite'));
      }

      const result = await runTests(testCommand);
      console.log('');
      console.log(formatTestResults([result]));

      // Check coverage
      if (options.coverage && result.stats?.coverage !== undefined) {
        const coverageCheck = checkCoverage([result], config.qa.coverageThreshold);
        console.log('');
        if (coverageCheck.passed) {
          console.log(pc.green(`✅ Coverage: ${coverageCheck.actual.toFixed(1)}% (threshold: ${coverageCheck.threshold}%)`));
        } else {
          console.log(pc.red(`❌ Coverage: ${coverageCheck.actual.toFixed(1)}% (threshold: ${coverageCheck.threshold}%)`));
          process.exit(1);
        }
      }

      process.exit(result.passed ? 0 : 1);

    } catch (error) {
      console.error(pc.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
