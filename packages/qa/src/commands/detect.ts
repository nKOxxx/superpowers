import fs from 'fs/promises';
import chalk from 'chalk';

export async function detect(): Promise<void> {
  console.log(chalk.blue('🔍 Detecting test runner...\n'));
  
  const files: string[] = await fs.readdir('.').catch(() => [] as string[]);
  const pkg = await fs.readFile('package.json', 'utf-8')
    .then(c => JSON.parse(c))
    .catch(() => ({}));
  
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  const runners = [];
  
  if (deps.vitest || files.includes('vitest.config.ts') || files.includes('vitest.config.js')) {
    runners.push({ name: 'Vitest', detected: true, files: ['vitest.config.ts', 'vitest.config.js'] });
  }
  
  if (deps.jest || files.includes('jest.config.js') || files.includes('jest.config.ts')) {
    runners.push({ name: 'Jest', detected: true, files: ['jest.config.js', 'jest.config.ts'] });
  }
  
  if (deps['@playwright/test'] || files.includes('playwright.config.ts') || files.includes('playwright.config.js')) {
    runners.push({ name: 'Playwright', detected: true, files: ['playwright.config.ts', 'playwright.config.js'] });
  }
  
  if (deps.mocha) {
    runners.push({ name: 'Mocha', detected: true, files: [] });
  }
  
  if (runners.length === 0) {
    console.log(chalk.yellow('No test runner detected.'));
    console.log(chalk.gray('Install one of: vitest, jest, @playwright/test, mocha'));
    return;
  }
  
  console.log(chalk.bold('Detected test runners:'));
  for (const runner of runners) {
    console.log(chalk.green(`  ✓ ${runner.name}`));
    if (runner.files.length > 0) {
      console.log(chalk.gray(`    Config: ${runner.files.join(', ')}`));
    }
  }
  
  console.log(chalk.gray(`\nRecommended: ${runners[0].name}`));
}
