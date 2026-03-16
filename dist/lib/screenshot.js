/**
 * Screenshot utilities for browser automation
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
    if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
    }
}
/**
 * Generate filename from URL and timestamp
 */
function generateFilename(url, suffix) {
    const date = new Date();
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    // Extract domain and path from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '-');
    const path = urlObj.pathname.replace(/\//g, '-').replace(/^-|-$/g, '') || 'index';
    const baseName = `${domain}-${path}`;
    const suffixStr = suffix ? `-${suffix}` : '';
    return `${baseName}${suffixStr}_${timeStr}.png`;
}
/**
 * Take a screenshot of a URL
 */
export async function takeScreenshot(url, options = {}) {
    const { fullPage = true, selector, outputPath, viewport = { width: 1280, height: 720 }, hideSelectors = [], waitForSelector, waitForNetworkIdle = true, delay = 0 } = options;
    let browser;
    try {
        // Launch browser
        browser = await chromium.launch({
            headless: true
        });
        // Create context with viewport
        const context = await browser.newContext({
            viewport: viewport
        });
        const page = await context.newPage();
        // Navigate to URL
        await page.goto(url, {
            waitUntil: waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
            timeout: 30000
        });
        // Wait for specific selector if provided
        if (waitForSelector) {
            await page.waitForSelector(waitForSelector, { timeout: 10000 });
        }
        // Hide elements
        for (const hideSelector of hideSelectors) {
            await page.addStyleTag({
                content: `${hideSelector} { visibility: hidden !important; }`
            });
        }
        // Additional delay
        if (delay > 0) {
            await page.waitForTimeout(delay);
        }
        // Determine output path
        const finalOutputPath = outputPath || join('./screenshots', new Date().toISOString().split('T')[0], generateFilename(url));
        // Ensure directory exists
        await ensureDir(dirname(finalOutputPath));
        // Take screenshot
        if (selector) {
            const element = await page.locator(selector).first();
            await element.screenshot({ path: finalOutputPath });
        }
        else {
            await page.screenshot({
                path: finalOutputPath,
                fullPage
            });
        }
        // Get file size
        const stats = await import('fs/promises').then(fs => fs.stat(finalOutputPath));
        return {
            path: finalOutputPath,
            url,
            viewport,
            size: stats.size,
            timestamp: new Date().toISOString()
        };
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
/**
 * Take multiple screenshots at different viewports
 */
export async function takeResponsiveScreenshots(url, viewports, baseDir) {
    const results = [];
    for (const [name, viewport] of Object.entries(viewports)) {
        const outputPath = baseDir
            ? join(baseDir, `${name}-${generateFilename(url)}`)
            : undefined;
        const result = await takeScreenshot(url, {
            viewport,
            outputPath,
            fullPage: true
        });
        results.push(result);
    }
    return results;
}
/**
 * Create a screenshot comparison report
 */
export async function createComparisonReport(screenshots, outputPath) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Screenshot Comparison</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
    .screenshot { margin-bottom: 40px; background: white; padding: 20px; border-radius: 8px; }
    .screenshot h3 { margin-top: 0; color: #333; }
    .screenshot img { max-width: 100%; border: 1px solid #ddd; }
    .meta { color: #666; font-size: 14px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Screenshot Report - ${new Date().toLocaleString()}</h1>
  ${screenshots.map(s => `
    <div class="screenshot">
      <h3>${s.url}</h3>
      <img src="${s.path}" alt="Screenshot of ${s.url}">
      <div class="meta">
        Viewport: ${s.viewport.width}x${s.viewport.height} | 
        Size: ${(s.size / 1024).toFixed(1)} KB |
        Time: ${new Date(s.timestamp).toLocaleTimeString()}
      </div>
    </div>
  `).join('')}
</body>
</html>`;
    await ensureDir(dirname(outputPath));
    await writeFile(outputPath, html, 'utf-8');
}
//# sourceMappingURL=screenshot.js.map