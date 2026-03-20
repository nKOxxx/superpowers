import { Command } from 'commander';
import chalk from 'chalk';
import { QAController } from './controller';

const program = new Command();

program
  .name('qa')
  .description('Systematic testing with smart test selection and coverage analysis')
  .version('1.0.0')
  .option('-c, --changed', 'Run tests only for changed files')
  .option('--coverage', 'Generate coverage report')
  .option('-w, --watch', 'Watch mode')
  .option('-f, --file <path>', 'Run specific test file')
  .option('-g, --grep <pattern>', 'Filter by pattern')
  .option('--framework <name>', 'Force framework (jest, vitest, mocha, pytest)')
  .option('--full', 'Run full test suite')
  .option('--security', 'Run security-focused tests')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: QAOptions) => {
    const controller = new QAController();
    
    try {
      console.log(chalk.blue('🧪 Running QA checks...\n'));
      
      const result = await controller.run({
        changed: options.changed,
        coverage: options.coverage,
        watch: options.watch,
        file: options.file,
        grep: options.grep,
        framework: options.framework,
        full: options.full,
        security: options.security,
        verbose: options.verbose
      });

      printResults(result);

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function printResults(result: QAResult): void {
  console.log(chalk.blue('\n📊 Test Results'));
  console.log(chalk.gray('─'.repeat(40)));
  
  if (result.framework) {
    console.log(chalk.gray(`Framework: ${result.framework}`));
  }
  
  if (result.success) {
    console.log(chalk.green('✅ All tests passed'));
  } else {
    console.log(chalk.red('❌ Tests failed'));
  }
  
  if (result.summary) {
    const { passed, failed, skipped, total } = result.summary;
    console.log(chalk.gray(`\nResults: ${passed} passed, ${failed} failed, ${skipped} skipped (${total} total)`));
  }
  
  if (result.coverage) {
    console.log(chalk.blue('\n📈 Coverage Report'));
    console.log(chalk.gray('─'.repeat(40)));
    
    Object.entries(result.coverage).forEach(([metric, value]) => {
      const percentage = typeof value === 'number' ? value : 0;
      const color = percentage >= 80 ? chalk.green : percentage >= 50 ? chalk.yellow : chalk.red;
      console.log(`${metric}: ${color(percentage.toFixed(2) + '%')}`);
    });
  }
  
  if (result.failures && result.failures.length > 0) {
    console.log(chalk.red('\n❌ Failures:'));
    result.failures.forEach((failure, index) => {
      console.log(chalk.red(`\n  ${index + 1}. ${failure.test}`));
      console.log(chalk.gray(`     ${failure.message}`));
    });
  }
}

program.parse();

export interface QAOptions {
  changed?: boolean;
  coverage?: boolean;
  watch?: boolean;
  file?: string;
  grep?: string;
  framework?: string;
  full?: boolean;
  security?: boolean;
  verbose?: boolean;
}

export interface QAResult {
  success: boolean;
  framework?: string;
  summary?: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
  coverage?: Record<string, number>;
  failures?: Array<{
    test: string;
    message: string;
  }>;
}
