import chalk from 'chalk';
import fs from 'fs/promises';

interface InitOptions {
  defaultBump?: string;
  changelogPath?: string;
  releaseBranch?: string;
}

const defaultConfig = {
  defaultBump: 'patch',
  changelogPath: 'CHANGELOG.md',
  packageFiles: ['package.json', 'package-lock.json'],
  tagPrefix: 'v',
  releaseBranch: 'main',
  requireCleanWorkingDir: true,
  runTests: true,
  testCommand: 'npm test',
  buildCommand: 'npm run build',
  preReleaseHooks: [],
  postReleaseHooks: [],
  githubRepo: '',
  npmRegistry: 'https://registry.npmjs.org/',
  npmAccess: 'public',
  telegram: {
    botToken: '${TELEGRAM_BOT_TOKEN}',
    chatId: '${TELEGRAM_CHAT_ID}',
  },
};

export async function init(options: InitOptions): Promise<void> {
  console.log(chalk.blue('⚓ Initializing Ship\n'));
  
  const config = {
    ...defaultConfig,
    ...(options.defaultBump && { defaultBump: options.defaultBump }),
    ...(options.changelogPath && { changelogPath: options.changelogPath }),
    ...(options.releaseBranch && { releaseBranch: options.releaseBranch }),
  };
  
  try {
    await fs.writeFile('.ship.config.json', JSON.stringify(config, null, 2));
    console.log(chalk.green('✓ Created .ship.config.json'));
  } catch (error) {
    throw new Error(`Failed to create config: ${error}`);
  }
  
  console.log(chalk.gray('\nConfiguration:'));
  console.log(JSON.stringify(config, null, 2));
  
  console.log(chalk.gray('\nEnvironment variables to set:'));
  console.log('  GH_TOKEN - GitHub personal access token');
  console.log('  NPM_TOKEN - npm authentication token');
  console.log('  TELEGRAM_BOT_TOKEN - Telegram bot token (optional)');
  console.log('  TELEGRAM_CHAT_ID - Telegram chat ID (optional)');
}
