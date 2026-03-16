import chalk from 'chalk';
import fs from 'fs/promises';

interface ConfigOptions {
  init?: boolean;
  show?: boolean;
  set?: string;
  value?: string;
}

const defaultConfig = {
  defaultRunner: 'vitest',
  testDirs: ['src', 'tests', '__tests__'],
  testPatterns: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
  coverageThreshold: 80,
  smokeTags: ['smoke', 'critical', 'sanity'],
  exclude: ['node_modules/**', 'dist/**'],
  timeout: 30000,
  workers: 4,
};

export async function config(options: ConfigOptions): Promise<void> {
  if (options.init) {
    try {
      await fs.writeFile('.qa.config.json', JSON.stringify(defaultConfig, null, 2));
      console.log(chalk.green('✓ Created .qa.config.json'));
    } catch (error) {
      throw new Error(`Failed to create config: ${error}`);
    }
    return;
  }
  
  if (options.show) {
    try {
      const content = await fs.readFile('.qa.config.json', 'utf-8');
      const cfg = JSON.parse(content);
      console.log(chalk.bold('Current configuration:'));
      console.log(JSON.stringify(cfg, null, 2));
    } catch {
      console.log(chalk.yellow('No .qa.config.json found. Using defaults:'));
      console.log(JSON.stringify(defaultConfig, null, 2));
    }
    return;
  }
  
  if (options.set && options.value) {
    try {
      let cfg: Record<string, unknown> = {};
      try {
        const content = await fs.readFile('.qa.config.json', 'utf-8');
        cfg = JSON.parse(content);
      } catch {
        // File doesn't exist, use defaults
        cfg = { ...defaultConfig };
      }
      
      // Parse value
      let parsedValue: unknown = options.value;
      if (options.value === 'true') parsedValue = true;
      else if (options.value === 'false') parsedValue = false;
      else if (!isNaN(Number(options.value))) parsedValue = Number(options.value);
      else if (options.value.startsWith('[')) {
        try { parsedValue = JSON.parse(options.value); } catch {}
      }
      
      cfg[options.set] = parsedValue;
      await fs.writeFile('.qa.config.json', JSON.stringify(cfg, null, 2));
      console.log(chalk.green(`✓ Set ${options.set} = ${JSON.stringify(parsedValue)}`));
    } catch (error) {
      throw new Error(`Failed to set config: ${error}`);
    }
    return;
  }
  
  console.log(chalk.blue('QA Configuration'));
  console.log(chalk.gray('\nUsage:'));
  console.log('  qa config --init              Create default config file');
  console.log('  qa config --show              Show current config');
  console.log('  qa config --set <key> --value <val>  Set a config value');
}
