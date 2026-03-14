/**
 * Configuration loader for browse skill
 */

import * as fs from 'fs';
import * as path from 'path';

export interface BrowseConfig {
  browser?: {
    flows?: Record<string, any>;
    viewports?: Record<string, { width: number; height: number }>;
    defaultTimeout?: number;
  };
}

export async function loadConfig(): Promise<BrowseConfig> {
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

export async function saveConfig(config: BrowseConfig, configPath?: string): Promise<void> {
  const targetPath = configPath || './superpowers.config.json';
  const dir = path.dirname(targetPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(targetPath, JSON.stringify(config, null, 2));
}
