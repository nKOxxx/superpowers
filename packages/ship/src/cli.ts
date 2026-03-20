import { Command } from 'commander';
import chalk from 'chalk';
import { ShipController } from './controller';

const program = new Command();

program
  .name('ship')
  .description('One-command release pipeline for versioning, changelogs, and publishing')
  .version('1.0.0')
  .argument('<version>', 'Version bump type: patch, minor, or major')
  .option('-d, --dry-run', 'Preview changes without applying')
  .option('--no-publish', 'Skip npm publish')
  .option('--no-github-release', 'Skip GitHub release')
  .option('-b, --branch <name>', 'Target branch (default: main)', 'main')
  .option('-m, --message <msg>', 'Custom release message')
  .option('--skip-tests', 'Skip running tests')
  .option('--skip-build', 'Skip build step')
  .action(async (version: string, options: ShipOptions) => {
    const controller = new ShipController();
    
    try {
      // Validate version type
      if (!['patch', 'minor', 'major'].includes(version)) {
        console.error(chalk.red('❌ Invalid version type. Use: patch, minor, or major'));
        process.exit(1);
      }

      console.log(chalk.blue(`🚀 Shipping ${version} version...\n`));
      
      if (options.dryRun) {
        console.log(chalk.yellow('🔍 DRY RUN - No changes will be applied\n'));
      }

      const result = await controller.ship(version, {
        dryRun: options.dryRun,
        publish: options.publish,
        githubRelease: options.githubRelease,
        branch: options.branch,
        message: options.message,
        skipTests: options.skipTests,
        skipBuild: options.skipBuild
      });

      printResults(result, options.dryRun);

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function printResults(result: ShipResult, dryRun?: boolean): void {
  console.log(chalk.blue('\n📦 Release Summary'));
  console.log(chalk.gray('─'.repeat(40)));
  
  if (result.oldVersion && result.newVersion) {
    console.log(chalk.gray(`Version: ${result.oldVersion} → ${chalk.green(result.newVersion)}`));
  }
  
  if (result.changelogPath) {
    console.log(chalk.gray(`Changelog: ${result.changelogPath}`));
  }
  
  if (result.commits && result.commits.length > 0) {
    console.log(chalk.gray(`\nIncluded commits:`));
    result.commits.forEach(commit => {
      const emoji = getCommitEmoji(commit.type);
      console.log(chalk.gray(`  ${emoji} ${commit.message}`));
    });
  }
  
  if (result.tag) {
    console.log(chalk.gray(`\nTag: ${result.tag}`));
  }
  
  if (result.githubReleaseUrl) {
    console.log(chalk.gray(`GitHub Release: ${result.githubReleaseUrl}`));
  }
  
  if (result.published) {
    console.log(chalk.gray(`npm: Published ${result.packageName}@${result.newVersion}`));
  }
  
  if (dryRun) {
    console.log(chalk.yellow('\n🔍 Dry run complete - no changes made'));
  } else if (result.success) {
    console.log(chalk.green('\n✅ Release completed successfully!'));
  }
}

function getCommitEmoji(type: string): string {
  const emojis: Record<string, string> = {
    feat: '✨',
    fix: '🐛',
    docs: '📚',
    refactor: '♻️',
    perf: '⚡',
    test: '🧪',
    chore: '🔧'
  };
  return emojis[type] || '📝';
}

program.parse();

export interface ShipOptions {
  dryRun?: boolean;
  publish: boolean;
  githubRelease: boolean;
  branch: string;
  message?: string;
  skipTests?: boolean;
  skipBuild?: boolean;
}

export interface ShipResult {
  success: boolean;
  oldVersion?: string;
  newVersion?: string;
  packageName?: string;
  changelogPath?: string;
  commits?: Array<{
    type: string;
    message: string;
    hash: string;
  }>;
  tag?: string;
  githubReleaseUrl?: string;
  published?: boolean;
}
