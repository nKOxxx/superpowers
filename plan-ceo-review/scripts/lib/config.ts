/**
 * Configuration loader for plan-ceo-review skill
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CEOConfig {
  ceoReview?: {
    minimumScore?: number;
    requireAllBAT?: boolean;
    autoGenerateNextSteps?: boolean;
    marketAnalysis?: boolean;
  };
}

export async function loadConfig(): Promise<CEOConfig> {
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
