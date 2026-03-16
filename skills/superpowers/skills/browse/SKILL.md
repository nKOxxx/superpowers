---
name: browse
description: Browser automation for visual testing, QA, and web scraping with Playwright. Use when the user needs to test web applications, capture screenshots, validate UI elements, crawl websites, or perform automated browser interactions. Supports screenshot comparison, responsive testing, and accessibility checks.
user-invocable: true
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["node", "npx"] },
        "emoji": "🌐",
        "install": [{ "kind": "node", "package": "playwright", "bins": ["playwright"], "label": "Install Playwright" }],
      },
  }
---

# Browse - Browser Automation & Visual Testing

Orchestrate browser automation workflows using Playwright for visual testing, QA validation, and web scraping.

## Quick Start

### Take a Screenshot
```bash
/browse screenshot <url> [--full-page] [--viewport=1920x1080] [--wait-for=<selector>]
```

### Run Visual Tests
```bash
/browse test <url> [--compare-to=baseline.png] [--threshold=0.2]
```

### Crawl & Validate
```bash
/browse crawl <url> [--depth=2] [--validate-links] [--screenshot-each]
```

### Accessibility Audit
```bash
/browse a11y <url> [--standard=wcag2aa]
```

## Commands

### `/browse screenshot <url>`
Capture a screenshot of a webpage.

**Options:**
- `--full-page` - Capture full scrollable page
- `--viewport=<width>x<height>` - Set viewport size (default: 1920x1080)
- `--wait-for=<selector>` - Wait for element before screenshot
- `--wait-time=<ms>` - Additional wait time in milliseconds
- `--output=<path>` - Save screenshot to specific path
- `--selector=<css>` - Screenshot specific element only
- `--dark-mode` - Use dark color scheme
- `--mobile` - Use mobile viewport (iPhone 14 Pro)
- `--tablet` - Use tablet viewport (iPad Pro)

### `/browse test <url>`
Run visual regression tests.

**Options:**
- `--compare-to=<path>` - Compare against baseline image
- `--threshold=<0-1>` - Pixel difference threshold (default: 0.1)
- `--mask-selectors=<css>` - CSS selectors to mask (comma-separated)
- `--update-baseline` - Update baseline with current screenshot

### `/browse crawl <start-url>`
Crawl website and validate pages.

**Options:**
- `--depth=<n>` - Maximum crawl depth (default: 2)
- `--max-pages=<n>` - Maximum pages to crawl (default: 50)
- `--validate-links` - Check for broken links
- `--screenshot-each` - Screenshot each page
- `--include=<pattern>` - URL patterns to include (regex)
- `--exclude=<pattern>` - URL patterns to exclude (regex)
- `--same-origin` - Stay within same origin only

### `/browse a11y <url>`
Run accessibility audit.

**Options:**
- `--standard=<wcag2a|wcag2aa|wcag21aa>` - Accessibility standard (default: wcag2aa)
- `--output=<json|html|text>` - Output format (default: text)

### `/browse pdf <url>`
Generate PDF from webpage.

**Options:**
- `--format=<A4|Letter|Legal>` - Paper format (default: A4)
- `--landscape` - Landscape orientation
- `--margin=<top,right,bottom,left>` - Margins in mm (default: 10,10,10,10)
- `--print-background` - Include background graphics

### `/browse metrics <url>`
Capture web performance metrics.

**Options:**
- `--runs=<n>` - Number of runs for averaging (default: 3)
- `--output=<json|table>` - Output format (default: table)

## Implementation

The browse skill uses Playwright for browser automation. The TypeScript implementation provides:

1. **Screenshot Engine** - High-fidelity captures with device emulation
2. **Visual Diff** - Pixel-perfect comparison with configurable thresholds
3. **Crawler** - Intelligent page discovery with deduplication
4. **A11y Scanner** - axe-core integration for accessibility
5. **Metrics Collector** - Core Web Vitals and performance data

## Environment Variables

- `PLAYWRIGHT_BROWSERS_PATH` - Custom browser installation path
- `PLAYWRIGHT_HEADLESS` - Run browsers in headless mode (default: true)

## Example Workflows

### Visual Regression Test
```bash
/browse screenshot https://example.com --output=baseline.png
# ... make changes ...
/browse test https://example.com --compare-to=baseline.png --threshold=0.05
```

### Responsive Testing
```bash
/browse screenshot https://example.com --mobile --output=mobile.png
/browse screenshot https://example.com --tablet --output=tablet.png
/browse screenshot https://example.com --viewport=1920x1080 --output=desktop.png
```

### QA Validation Flow
```bash
/browse crawl https://staging.example.com --depth=3 --validate-links --screenshot-each
```

## Error Handling

- Network timeouts: Retries with exponential backoff
- Element not found: Detailed error with available selectors
- Comparison failures: Generates diff image highlighting changes

## Output Artifacts

All outputs are saved to `./browse-results/`:
- Screenshots: `./browse-results/screenshots/`
- Diffs: `./browse-results/diffs/`
- Crawl reports: `./browse-results/crawl-reports/`
- A11y reports: `./browse-results/a11y-reports/`
