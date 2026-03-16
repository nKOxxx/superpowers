/**
 * Flow execution engine for browse skill
 */

import { BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export interface FlowStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'scroll';
  target?: string;
  value?: string;
  selector?: string;
  url?: string;
  delay?: number;
}

export interface FlowConfig {
  name: string;
  steps: FlowStep[];
  viewport?: { width: number; height: number };
}

export interface FlowOptions {
  outputDir?: string;
  viewport?: { width: number; height: number };
}

export async function runFlow(
  context: BrowserContext,
  baseUrl: string,
  flow: FlowConfig,
  options: FlowOptions = {}
): Promise<void> {
  const page = await context.newPage();
  const outputDir = options.outputDir || './screenshots';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const flowDir = path.join(outputDir, `${flow.name}_${timestamp}`);
  fs.mkdirSync(flowDir, { recursive: true });

  console.log(`  Running flow: ${flow.name}`);

  try {
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i]!;
      const stepNum = String(i + 1).padStart(2, '0');

      console.log(`    Step ${stepNum}: ${step.action}`);

      switch (step.action) {
        case 'navigate': {
          const url = step.url || (step.target?.startsWith('http') ? step.target : `${baseUrl}${step.target || ''}`);
          await page.goto(url!, { waitUntil: 'networkidle' });
          break;
        }

        case 'click':
          if (step.selector) {
            await page.click(step.selector);
          }
          break;

        case 'type':
          if (step.selector && step.value) {
            await page.fill(step.selector, step.value);
          }
          break;

        case 'wait':
          if (step.selector) {
            await page.waitForSelector(step.selector, { timeout: step.delay || 5000 });
          } else if (step.delay) {
            await page.waitForTimeout(step.delay);
          }
          break;

        case 'screenshot': {
          const screenshotPath = path.join(flowDir, `step_${stepNum}_${step.action}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`      📸 Saved: ${screenshotPath}`);
          break;
        }

        case 'scroll':
          await page.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const w = window as any;
            w.scrollBy(0, w.innerHeight);
          });
          break;
      }
    }

    console.log(`  ✅ Flow complete: ${flow.name}`);
  } catch (error) {
    console.error(`  ❌ Flow failed: ${flow.name}`, error);
    throw error;
  } finally {
    await page.close();
  }
}
