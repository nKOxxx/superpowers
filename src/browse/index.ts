import { chromium, type Browser, type Page } from 'playwright';
import chalk from 'chalk';

export interface Viewport {
  width: number;
  height: number;
}

export interface BrowseOptions {
  url: string;
  viewport?: Viewport | 'mobile' | 'tablet' | 'desktop';
  fullPage?: boolean;
  selector?: string;
  actions?: Action[];
  output?: 'base64' | 'file' | 'buffer';
  outputPath?: string;
}

export interface Action {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  target?: string;
  value?: string;
  duration?: number;
}

const viewportPresets = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

export function parseViewport(viewport: string): Viewport {
  if (viewport in viewportPresets) {
    return viewportPresets[viewport as keyof typeof viewportPresets];
  }
  // Parse custom dimensions like "1200x800"
  const match = viewport.match(/^(\d+)x(\d+)$/);
  if (match) {
    return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
  }
  return viewportPresets.desktop;
}

export function parseActions(actionsStr: string): Action[] {
  if (!actionsStr) return [];
  
  const actions: Action[] = [];
  const parts = actionsStr.split(',');
  
  for (const part of parts) {
    const [type, ...rest] = part.trim().split(':');
    
    switch (type) {
      case 'click':
        actions.push({ type: 'click', target: rest[0] });
        break;
      case 'type':
        actions.push({ type: 'type', target: rest[0], value: rest[1] || '' });
        break;
      case 'wait':
        actions.push({ type: 'wait', duration: parseInt(rest[0], 10) || 1000 });
        break;
      case 'scroll':
        actions.push({ type: 'scroll', target: rest[0] });
        break;
      case 'hover':
        actions.push({ type: 'hover', target: rest[0] });
        break;
    }
  }
  
  return actions;
}

export async function executeActions(page: Page, actions: Action[]): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'click':
        if (action.target) {
          await page.click(action.target);
          console.log(chalk.gray(`  Clicked: ${action.target}`));
        }
        break;
      case 'type':
        if (action.target && action.value !== undefined) {
          await page.fill(action.target, action.value);
          console.log(chalk.gray(`  Typed in: ${action.target}`));
        }
        break;
      case 'wait':
        await page.waitForTimeout(action.duration || 1000);
        console.log(chalk.gray(`  Waited: ${action.duration}ms`));
        break;
      case 'scroll':
        if (action.target) {
          await page.locator(action.target).scrollIntoViewIfNeeded();
          console.log(chalk.gray(`  Scrolled to: ${action.target}`));
        } else {
          await page.evaluate(() => {
            const w = globalThis as any;
            const d = w.document as any;
            w.scrollTo(0, d.body.scrollHeight);
          });
          console.log(chalk.gray('  Scrolled to bottom'));
        }
        break;
      case 'hover':
        if (action.target) {
          await page.hover(action.target);
          console.log(chalk.gray(`  Hovered: ${action.target}`));
        }
        break;
    }
  }
}

export interface BrowseResult {
  screenshot: Buffer;
  url: string;
  viewport: Viewport;
  title: string;
  duration: number;
}

export async function browse(options: BrowseOptions): Promise<BrowseResult> {
  const startTime = Date.now();
  
  let viewportSize: Viewport;
  if (typeof options.viewport === 'string') {
    viewportSize = parseViewport(options.viewport);
  } else if (options.viewport) {
    viewportSize = options.viewport;
  } else {
    viewportSize = viewportPresets.desktop;
  }
  
  console.log(chalk.blue(`🌐 Navigating to: ${options.url}`));
  console.log(chalk.gray(`   Viewport: ${viewportSize.width}x${viewportSize.height}`));
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      viewport: viewportSize,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Navigate to URL
    await page.goto(options.url, { waitUntil: 'networkidle' });
    const title = await page.title();
    console.log(chalk.gray(`   Page title: ${title}`));
    
    // Execute actions if provided
    if (options.actions && options.actions.length > 0) {
      console.log(chalk.blue(`🎬 Executing ${options.actions.length} action(s)...`));
      await executeActions(page, options.actions);
    }
    
    // Take screenshot
    let screenshot: Buffer;
    
    if (options.selector) {
      // Screenshot specific element
      const element = page.locator(options.selector).first();
      await element.waitFor({ state: 'visible' });
      screenshot = await element.screenshot();
      console.log(chalk.gray(`   Captured element: ${options.selector}`));
    } else if (options.fullPage) {
      screenshot = await page.screenshot({ fullPage: true });
      console.log(chalk.gray('   Captured full page'));
    } else {
      screenshot = await page.screenshot();
      console.log(chalk.gray('   Captured viewport'));
    }
    
    const duration = Date.now() - startTime;
    console.log(chalk.green(`✅ Screenshot captured in ${duration}ms`));
    
    // Save to file if requested
    if (options.output === 'file' && options.outputPath) {
      const fs = await import('fs');
      fs.writeFileSync(options.outputPath, screenshot);
      console.log(chalk.gray(`   Saved to: ${options.outputPath}`));
    }
    
    return {
      screenshot,
      url: options.url,
      viewport: viewportSize,
      title,
      duration
    };
  } finally {
    await browser.close();
  }
}

export function screenshotToBase64(screenshot: Buffer): string {
  return screenshot.toString('base64');
}