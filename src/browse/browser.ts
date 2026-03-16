import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { mkdir } from 'fs/promises';
import { ScreenshotOptions, TestUrlOptions, ClickOptions, TypeOptions, FlowOptions, FlowStep } from '../shared/types.js';
import { getOutputPath, log } from '../shared/utils.js';

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 }
};

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

async function createContext(viewport: { width: number; height: number }, darkMode = false): Promise<BrowserContext> {
  const browser = await getBrowser();
  return browser.newContext({
    viewport,
    colorScheme: darkMode ? 'dark' : 'light'
  });
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

function getViewport(preset: ScreenshotOptions['viewport']) {
  if (typeof preset === 'string') {
    return VIEWPORTS[preset] || VIEWPORTS.desktop;
  }
  return preset || VIEWPORTS.desktop;
}

export async function takeScreenshot(options: ScreenshotOptions): Promise<string> {
  const { url, fullPage, waitFor, waitTime, hideSelectors, outputDir = './screenshots' } = options;
  
  await mkdir(outputDir, { recursive: true });
  
  const viewport = getViewport(options.viewport);
  const context = await createContext(viewport, options.darkMode);
  const page = await context.newPage();
  
  try {
    log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    if (waitTime) {
      log(`Waiting ${waitTime}ms...`);
      await page.waitForTimeout(waitTime);
    }
    
    if (waitFor) {
      log(`Waiting for selector: ${waitFor}...`);
      await page.waitForSelector(waitFor, { timeout: 30000 });
    }
    
    if (hideSelectors && hideSelectors.length > 0) {
      for (const selector of hideSelectors) {
        await page.evaluate((sel) => {
          const elements = document.querySelectorAll(sel);
          elements.forEach(el => (el as HTMLElement).style.display = 'none');
        }, selector);
      }
    }
    
    const outputPath = getOutputPath(outputDir, options.filename, 'png');
    
    await page.screenshot({
      path: outputPath,
      fullPage: fullPage || false
    });
    
    log(`Screenshot saved: ${outputPath}`, 'success');
    return outputPath;
  } finally {
    await context.close();
  }
}

export async function testUrl(options: TestUrlOptions): Promise<{ success: boolean; errors: string[] }> {
  const { url, expectStatus = 200, expectText, expectSelector, timeout = 30000, darkMode } = options;
  const errors: string[] = [];
  
  const context = await createContext(VIEWPORTS.desktop, darkMode);
  const page = await context.newPage();
  
  try {
    log(`Testing ${url}...`);
    
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout 
    });
    
    if (!response) {
      errors.push('Failed to get response');
      return { success: false, errors };
    }
    
    const status = response.status();
    if (status !== expectStatus) {
      errors.push(`Expected status ${expectStatus}, got ${status}`);
    }
    
    if (expectText) {
      const hasText = await page.locator(`text=${expectText}`).first().isVisible().catch(() => false);
      if (!hasText) {
        errors.push(`Expected text "${expectText}" not found`);
      }
    }
    
    if (expectSelector) {
      const hasSelector = await page.locator(expectSelector).first().isVisible().catch(() => false);
      if (!hasSelector) {
        errors.push(`Expected selector "${expectSelector}" not found`);
      }
    }
    
    const success = errors.length === 0;
    if (success) {
      log('URL test passed', 'success');
    } else {
      for (const err of errors) {
        log(err, 'error');
      }
    }
    
    return { success, errors };
  } finally {
    await context.close();
  }
}

export async function clickElement(options: ClickOptions): Promise<boolean> {
  const { url, selector, screenshot, waitForNavigation, viewport = 'desktop' } = options;
  
  const context = await createContext(VIEWPORTS[viewport]);
  const page = await context.newPage();
  
  try {
    log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    log(`Clicking element: ${selector}...`);
    
    if (waitForNavigation) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.locator(selector).click()
      ]);
    } else {
      await page.locator(selector).click();
    }
    
    if (screenshot) {
      const outputPath = getOutputPath('./screenshots', `click-${Date.now()}.png`);
      await page.screenshot({ path: outputPath });
      log(`Screenshot saved: ${outputPath}`, 'success');
    }
    
    log('Click successful', 'success');
    return true;
  } catch (err) {
    log(`Click failed: ${err}`, 'error');
    return false;
  } finally {
    await context.close();
  }
}

export async function typeText(options: TypeOptions): Promise<boolean> {
  const { url, selector, text, clear, submit, delay, screenshot } = options;
  
  const context = await createContext(VIEWPORTS.desktop);
  const page = await context.newPage();
  
  try {
    log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    const input = page.locator(selector);
    
    if (clear) {
      await input.clear();
    }
    
    log(`Typing into ${selector}...`);
    await input.type(text, { delay: delay || 0 });
    
    if (submit) {
      await input.press('Enter');
    }
    
    if (screenshot) {
      const outputPath = getOutputPath('./screenshots', `type-${Date.now()}.png`);
      await page.screenshot({ path: outputPath });
      log(`Screenshot saved: ${outputPath}`, 'success');
    }
    
    log('Type successful', 'success');
    return true;
  } catch (err) {
    log(`Type failed: ${err}`, 'error');
    return false;
  } finally {
    await context.close();
  }
}

export async function runFlow(flow: FlowOptions): Promise<{ success: boolean; screenshots: string[] }> {
  const { steps, viewport = 'desktop', outputDir = './screenshots' } = flow;
  const screenshots: string[] = [];
  
  await mkdir(outputDir, { recursive: true });
  
  const context = await createContext(VIEWPORTS[viewport]);
  const page = await context.newPage();
  
  try {
    log(`Running flow: ${flow.name || 'unnamed'}`);
    
    for (const step of steps) {
      await executeStep(page, step, outputDir, screenshots);
    }
    
    log('Flow completed', 'success');
    return { success: true, screenshots };
  } catch (err) {
    log(`Flow failed: ${err}`, 'error');
    return { success: false, screenshots };
  } finally {
    await context.close();
  }
}

async function executeStep(
  page: Page,
  step: FlowStep,
  outputDir: string,
  screenshots: string[]
): Promise<void> {
  switch (step.action) {
    case 'navigate':
      if (!step.url) throw new Error('navigate requires url');
      log(`Navigating to ${step.url}...`);
      await page.goto(step.url, { waitUntil: 'networkidle' });
      break;
      
    case 'click':
      if (!step.selector) throw new Error('click requires selector');
      log(`Clicking ${step.selector}...`);
      await page.locator(step.selector).click();
      break;
      
    case 'type':
      if (!step.selector || step.text === undefined) throw new Error('type requires selector and text');
      log(`Typing into ${step.selector}...`);
      await page.locator(step.selector).type(step.text);
      break;
      
    case 'wait':
      if (!step.time) throw new Error('wait requires time');
      log(`Waiting ${step.time}ms...`);
      await page.waitForTimeout(step.time);
      break;
      
    case 'scroll':
      log('Scrolling...');
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      break;
      
    case 'screenshot':
      const filename = step.filename || `step-${screenshots.length}-${Date.now()}.png`;
      const outputPath = getOutputPath(outputDir, filename);
      await page.screenshot({ path: outputPath });
      screenshots.push(outputPath);
      log(`Screenshot: ${outputPath}`);
      break;
      
    default:
      throw new Error(`Unknown action: ${(step as FlowStep).action}`);
  }
}
