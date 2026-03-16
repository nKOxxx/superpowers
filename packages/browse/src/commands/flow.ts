import { chromium } from 'playwright';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

interface FlowStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'scroll' | 'screenshot';
  url?: string;
  selector?: string;
  text?: string;
  time?: number;
  filename?: string;
}

interface FlowConfig {
  name?: string;
  viewport?: string;
  outputDir?: string;
  steps: FlowStep[];
}

const viewports: Record<string, { width: number; height: number }> = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
};

export async function flow(filePath: string): Promise<void> {
  console.log(chalk.blue('📋 Running flow:'), chalk.cyan(filePath));
  
  const content = await fs.readFile(filePath, 'utf-8');
  const config: FlowConfig = JSON.parse(content);
  
  console.log(chalk.gray(`Flow: ${config.name || 'unnamed'}`));
  console.log(chalk.gray(`Steps: ${config.steps.length}`));
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      viewport: viewports[config.viewport || 'desktop'] || viewports.desktop,
    });
    
    const page = await context.newPage();
    const outputDir = config.outputDir || './screenshots';
    await fs.mkdir(outputDir, { recursive: true });
    
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];
      console.log(chalk.gray(`  Step ${i + 1}: ${step.action}`));
      
      switch (step.action) {
        case 'navigate':
          if (!step.url) throw new Error('navigate step requires url');
          await page.goto(step.url, { waitUntil: 'networkidle' });
          break;
          
        case 'click':
          if (!step.selector) throw new Error('click step requires selector');
          await page.click(step.selector);
          break;
          
        case 'type':
          if (!step.selector || !step.text) throw new Error('type step requires selector and text');
          await page.fill(step.selector, step.text);
          break;
          
        case 'wait':
          if (!step.time) throw new Error('wait step requires time');
          await page.waitForTimeout(step.time);
          break;
          
        case 'scroll':
          await page.evaluate(() => (window as Window).scrollBy(0, window.innerHeight));
          break;
          
        case 'screenshot':
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = step.filename || `flow-step-${i + 1}-${timestamp}.png`;
          const outputPath = path.join(outputDir, filename);
          await page.screenshot({ path: outputPath });
          console.log(chalk.green(`  ✓ Screenshot: ${filename}`));
          break;
          
        default:
          console.log(chalk.yellow(`  ⚠ Unknown action: ${step.action}`));
      }
    }
    
    console.log(chalk.green('\n✓ Flow completed'));
  } finally {
    await browser.close();
  }
}
