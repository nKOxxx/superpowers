import { Command } from 'commander';
import chalk from 'chalk';
import { BrowseController } from './controller';

const program = new Command();

program
  .name('browse')
  .description('Browser automation with Playwright for visual testing and accessibility audits')
  .version('1.0.0')
  .argument('<url>', 'URL to navigate to')
  .option('-s, --screenshot', 'Capture full-page screenshot')
  .option('-v, --viewport <WxH>', 'Set viewport size (default: 1280x720)')
  .option('-a, --audit', 'Run accessibility audit (axe-core)')
  .option('-w, --wait-for <selector>', 'Wait for element before capturing')
  .option('-t, --timeout <ms>', 'Navigation timeout (default: 30000)', '30000')
  .option('-c, --compare <path>', 'Compare against baseline image')
  .option('-m, --mobile', 'Emulate mobile device')
  .option('-d, --dark-mode', 'Enable dark mode')
  .option('-o, --output <path>', 'Output directory for screenshots')
  .action(async (url: string, options: BrowseOptions) => {
    const controller = new BrowseController();
    
    try {
      console.log(chalk.blue(`🔍 Browsing ${url}...`));
      
      const result = await controller.browse(url, {
        screenshot: options.screenshot,
        viewport: options.viewport,
        audit: options.audit,
        waitFor: options.waitFor,
        timeout: options.timeout,
        compare: options.compare,
        mobile: options.mobile,
        darkMode: options.darkMode,
        output: options.output
      });

      if (result.success) {
        console.log(chalk.green('✅ Browse completed successfully'));
        
        if (result.screenshotPath) {
          console.log(chalk.gray(`📸 Screenshot: ${result.screenshotPath}`));
        }
        
        if (result.auditResults) {
          printAuditResults(result.auditResults);
        }
        
        if (result.comparisonResult) {
          printComparisonResult(result.comparisonResult);
        }
      } else {
        console.error(chalk.red('❌ Browse failed'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      await controller.close();
    }
  });

function printAuditResults(results: AuditResult): void {
  console.log(chalk.blue('\n📋 Accessibility Audit Results'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const { violations, passes, incomplete } = results;
  
  console.log(chalk.green(`✓ Passes: ${passes.length}`));
  console.log(chalk.yellow(`⚠ Incomplete: ${incomplete.length}`));
  
  if (violations.length === 0) {
    console.log(chalk.green('✓ No violations found!'));
  } else {
    console.log(chalk.red(`✗ Violations: ${violations.length}`));
    
    violations.forEach((violation, index) => {
      console.log(chalk.red(`\n  ${index + 1}. ${violation.description}`));
      console.log(chalk.gray(`     Impact: ${violation.impact}`));
      console.log(chalk.gray(`     Help: ${violation.helpUrl}`));
      console.log(chalk.gray(`     Nodes: ${violation.nodes.length}`));
    });
  }
}

function printComparisonResult(result: ComparisonResult): void {
  console.log(chalk.blue('\n📊 Visual Comparison Results'));
  console.log(chalk.gray('─'.repeat(40)));
  
  if (result.diffPercentage === 0) {
    console.log(chalk.green('✓ No visual differences detected'));
  } else {
    console.log(chalk.yellow(`⚠ Visual difference: ${result.diffPercentage.toFixed(2)}%`));
    if (result.diffPath) {
      console.log(chalk.gray(`  Diff image: ${result.diffPath}`));
    }
  }
}

program.parse();

export interface BrowseOptions {
  screenshot?: boolean;
  viewport?: string;
  audit?: boolean;
  waitFor?: string;
  timeout: string;
  compare?: string;
  mobile?: boolean;
  darkMode?: boolean;
  output?: string;
}

export interface AuditResult {
  violations: Violation[];
  passes: Pass[];
  incomplete: Incomplete[];
}

export interface Violation {
  description: string;
  impact: string;
  helpUrl: string;
  nodes: Node[];
}

export interface Pass {
  description: string;
  impact: null;
  helpUrl: string;
  nodes: Node[];
}

export interface Incomplete {
  description: string;
  impact: string;
  helpUrl: string;
  nodes: Node[];
}

export interface Node {
  target: string[];
  html: string;
}

export interface ComparisonResult {
  diffPercentage: number;
  diffPath?: string;
  passed: boolean;
}
