/**
 * Configuration loader for ship skill
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ShipConfig {
  ship?: {
    requireCleanWorkingDir?: boolean;
    runTestsBeforeRelease?: boolean;
    testCommand?: string;
    changelog?: {
      preset?: 'conventional' | 'angular' | 'atom';
      includeContributors?: boolean;
    };
  };
  github?: {
    defaultOrg?: string;
    token?: string;
  };
  telegram?: {
    notifyOnShip?: boolean;
    target?: string;
  };
}

export async function loadConfig(): Promise<ShipConfig> {
  const configPaths = [
    './superpowers.config.json',
    './.superpowers.json',
    path.join(process.env.HOME || '', '.config/superpowers/config.json')
  ];
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(`Warning: Failed to parse config at ${configPath}`);
      }
    }
  }
  
  return {};
}
