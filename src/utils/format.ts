import chalk from 'chalk';

export function printHeader(title: string): void {
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.bold.white(title));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log();
}

export function printSection(title: string): void {
  console.log();
  console.log(chalk.yellow('─'.repeat(50)));
  console.log(chalk.bold(title));
  console.log(chalk.yellow('─'.repeat(50)));
}

export function printSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

export function printError(message: string): void {
  console.error(chalk.red(`✗ ${message}`));
}

export function printInfo(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`));
}

export function printWarning(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

export function printStars(score: number, max = 5): string {
  const filled = '⭐'.repeat(score);
  const empty = '○'.repeat(max - score);
  return filled + empty;
}