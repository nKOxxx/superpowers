import { chromium, type Browser, type Page } from 'playwright';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import fs from 'fs/promises';
import path from 'path';

interface BrowseOptions {
  viewport: string;
  width?: string;
  height?: string;
  fullPage: boolean;
  output: string;
  flows?: string;
  waitFor?: string;
  actions?: string;
  timeout: string;
}

interface ViewportPreset {
  width: number;
  height: number;
}

const VIEWPORT_PRESETS: Record<string, ViewportPreset> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 }
};

interface Action {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover' | 'screenshot';
  selector?: string;
  text?: string;
  delay?: number;
}

function parseActions(actionsStr: string): Action[] {
  const actions: Action[] = [];
  const parts = actionsStr.split(',');
  
  for (const part of parts) {
    const [type, ...params] = part.split(':');
    const trimmedType = type.trim() as Action['type'];
    
    switch (trimmedType) {
      case 'click':
        actions.push({ type: 'click', selector: params.join(':') });
        break;
      case 'type': {
        const typeParams = params.join(':').split('|');
        actions.push({ type: 'type', selector: typeParams[0], text: typeParams[1] || '' });
        break;
      }
      case 'wait':
        actions.push({ type: 'wait', delay: parseInt(params[0], 10) || 1000 });
        break;
      case 'scroll':
        actions.push({ type: 'scroll' });
        break;
      case 'hover':
        actions.push({ type: 'hover', selector: params.join(':') });
        break;
      case 'screenshot':
        actions.push({ type: 'screenshot' });
        break;
    }
  }
  
  return actions;
}

async function loadConfig(): Promise<Record<string, unknown>> {
  try {
    const configPath = path.resolve(process.cwd(), 'superpowers.config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function browseCommand(url: string, options: BrowseOptions): Promise<void> {
  const spinner = ora('Launching browser...').start();
  let browser: Browser | undefined;
  
  try {
    // Ensure output directory exists
    await fs.mkdir(options.output, { recursive: true });
    
    // Load config for flows if specified
    const config = await loadConfig();
    const browserConfig = (config.browser || {}) as Record<string, unknown>;
    
    // Determine viewport
    let viewport: ViewportPreset;
    if (options.width && options.height) {
      viewport = { 
        width: parseInt(options.width, 10), 
        height: parseInt(options.height, 10) 
      };
    } else {
      viewport = VIEWPORT_PRESETS[options.viewport] || VIEWPORT_PRESETS.desktop;
    }
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: process.env.BROWSE_HEADLESS !== 'false' 
    });
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    
    // Handle flows if specified
    if (options.flows) {
      const flows = (browserConfig.flows || {}) as Record<string, Array<{name: string; url: string; actions?: Action[]}> | undefined>;
      const flowNames = options.flows.split(',').map(f => f.trim());
      
      for (const flowName of flowNames) {
        const flow = flows[flowName];
        if (!flow) {
          spinner.warn(`Flow "${flowName}" not found in config`);
          continue;
        }
        
        for (const step of flow) {
          spinner.text = `Flow "${flowName}": ${step.name}...`;
          const stepUrl = step.url.startsWith('http') ? step.url : new URL(step.url, url).toString();
          await page.goto(stepUrl, { waitUntil: 'networkidle', timeout: parseInt(options.timeout, 10) });
          
          if (step.actions) {
            await executeActions(page, step.actions, spinner);
          }
          
          await captureScreenshot(page, options, flowName, step.name, viewport);
        }
      }
    } else {
      // Single page navigation
      spinner.text = `Navigating to ${url}...`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: parseInt(options.timeout, 10) });
      
      // Wait for element if specified
      if (options.waitFor) {
        spinner.text = `Waiting for ${options.waitFor}...`;
        await page.waitForSelector(options.waitFor, { timeout: parseInt(options.timeout, 10) });
      }
      
      // Execute custom actions if specified
      if (options.actions) {
        const actions = parseActions(options.actions);
        await executeActions(page, actions, spinner);
      }
      
      // Capture screenshot
      await captureScreenshot(page, options, null, null, viewport);
    }
    
    spinner.succeed(chalk.green('Browser automation complete'));
    
  } catch (error) {
    spinner.fail(chalk.red(`Browser automation failed: ${error instanceof Error ? error.message : String(error)}`));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function executeActions(page: Page, actions: Action[], spinner: Ora): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'click':
        if (action.selector) {
          spinner.text = `Clicking ${action.selector}...`;
          await page.click(action.selector);
        }
        break;
      case 'type':
        if (action.selector && action.text !== undefined) {
          spinner.text = `Typing into ${action.selector}...`;
          await page.fill(action.selector, action.text);
        }
        break;
      case 'wait':
        spinner.text = `Waiting ${action.delay}ms...`;
        await page.waitForTimeout(action.delay || 1000);
        break;
      case 'scroll':
        spinner.text = 'Scrolling...';
        await page.mouse.wheel(0, 600);
        await page.waitForTimeout(500);
        break;
      case 'hover':
        if (action.selector) {
          spinner.text = `Hovering over ${action.selector}...`;
          await page.hover(action.selector);
        }
        break;
      case 'screenshot':
        // Screenshot is handled separately
        break;
    }
  }
}

async function captureScreenshot(
  page: Page, 
  options: BrowseOptions, 
  flowName: string | null, 
  stepName: string | null,
  viewport: ViewportPreset
): Promise<string> {
  const hostname = new URL(page.url()).hostname.replace(/[^a-z0-9]/gi, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const viewportName = `${viewport.width}x${viewport.height}`;
  
  let filename: string;
  if (flowName && stepName) {
    filename = `${hostname}_${flowName}_${stepName.replace(/\s+/g, '_')}_${viewportName}_${timestamp}.png`;
  } else {
    filename = `${hostname}_${viewportName}_${timestamp}.png`;
  }
  
  const filepath = path.join(options.output, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: options.fullPage 
  });
  
  console.log(chalk.green(`✓ Screenshot saved: ${filepath}`));
  return filepath;
}
