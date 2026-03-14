/**
 * Configuration loader for QA skill
 */

import * as fs from 'fs';
import * as path from 'path';

export interface QAConfig {
  qa?: {
    defaultMode?: 'targeted' | 'smoke' | 'full';
    coverageThreshold?: number;
    testCommand?: string;
    testPatterns?: {
      unit?: string[];
      integration?: string[];
      e2e?: string[];
    };
  };
}

export async function loadConfig(): Promise<QAConfig> {
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
