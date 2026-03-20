---
name: browse
description: Browser automation with Playwright for visual testing, accessibility audits, and visual regression. Triggers on screenshot requests, visual testing, accessibility checks, or browser automation commands.
---

# browse - Browser Automation Skill

Automate browser interactions, capture screenshots across multiple viewports, run accessibility audits, and perform visual regression testing.

## Capabilities

### 1. Multi-Viewport Screenshots
Capture screenshots at standard device sizes:
- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1920x1080 (Full HD)
- **4K**: 3840x2160 (Ultra HD)

### 2. Accessibility Auditing
Run automated accessibility checks using axe-core:
- WCAG 2.1 AA compliance checking
- Detailed violation reports with severity levels
- Remediation suggestions
- Export to JSON or Markdown

### 3. Visual Regression Testing
Compare current state against baselines:
- Pixel-perfect diff detection
- Threshold configuration
- Baseline auto-generation
- Side-by-side comparison reports

### 4. Telegram Integration
Send notifications and reports:
- Screenshot delivery
- Audit summary alerts
- Regression failure notifications

## Usage

### Basic Screenshots
```bash
# Capture all viewport screenshots
/browse --url https://example.com --screenshots

# Specific viewport only
/browse --url https://example.com --viewport desktop

# Multiple specific viewports
/browse --url https://example.com --viewports mobile,tablet

# Custom output directory
/browse --url https://example.com --output ./screenshots
```

### Accessibility Audit
```bash
# Run full accessibility audit
/browse --url https://example.com --accessibility

# Audit with specific rules
/browse --url https://example.com --accessibility --rules wcag2aa,wcag21aa

# Export to JSON
/browse --url https://example.com --accessibility --format json

# Export to Markdown report
/browse --url https://example.com --accessibility --format markdown
```

### Visual Regression
```bash
# Create baseline
/browse --url https://example.com --baseline --name homepage

# Compare against baseline
/browse --url https://example.com --compare --name homepage

# Update baseline after intentional changes
/browse --url https://example.com --baseline --name homepage --update

# Set pixel diff threshold (default: 0.1%)
/browse --url https://example.com --compare --threshold 0.2
```

### Combined Workflow
```bash
# Full audit: screenshots + accessibility + regression
/browse --url https://example.com --full-audit --baseline
```

### Telegram Notifications
```bash
# Send screenshots to Telegram
/browse --url https://example.com --screenshots --telegram

# Notify on accessibility violations
/browse --url https://example.com --accessibility --telegram --notify-failures-only
```

## Configuration

### Environment Variables
```bash
# Playwright browser selection
BROWSER=chromium|firefox|webkit

# Screenshot settings
SCREENSHOT_FULL_PAGE=true
SCREENSHOT_TYPE=png|jpeg
SCREENSHOT_QUALITY=80

# Accessibility settings
AXE_TAGS=wcag2a,wcag2aa,wcag21aa,best-practice
AXE_RULES=color-contrast,heading-order

# Visual regression
BASELINE_DIR=./baselines
DIFF_THRESHOLD=0.1

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Config File (.openclawrc)
```json
{
  "browse": {
    "defaultViewports": ["mobile", "desktop"],
    "screenshotDir": "./screenshots",
    "baselineDir": "./baselines",
    "accessibility": {
      "tags": ["wcag2aa", "best-practice"],
      "rules": []
    },
    "telegram": {
      "enabled": false,
      "notifyOn": ["failure", "violation"]
    }
  }
}
```

## Options Reference

| Option | Description | Default |
|--------|-------------|---------|
| `--url, -u` | Target URL to browse | Required |
| `--screenshots` | Capture screenshots | false |
| `--viewport` | Single viewport | all |
| `--viewports` | Comma-separated viewports | mobile,tablet,desktop,4k |
| `--accessibility, -a` | Run axe audit | false |
| `--baseline` | Create/update baseline | false |
| `--compare` | Compare to baseline | false |
| `--name` | Baseline/test name | url-slug |
| `--threshold` | Pixel diff threshold (%) | 0.1 |
| `--output, -o` | Output directory | ./browse-results |
| `--format` | Report format (json|markdown) | json |
| `--telegram, -t` | Send to Telegram | false |
| `--full-page` | Full page screenshots | true |
| `--wait-for` | Wait for selector/ms | - |
| `--timeout` | Page load timeout (ms) | 30000 |
| `--dry-run` | Preview without executing | false |

## Output Structure

```
browse-results/
├── screenshots/
│   ├── mobile_homepage_2024-01-15.png
│   ├── tablet_homepage_2024-01-15.png
│   ├── desktop_homepage_2024-01-15.png
│   └── 4k_homepage_2024-01-15.png
├── accessibility/
│   ├── report.json
│   └── report.md
├── baselines/
│   └── homepage/
│       ├── mobile.png
│       ├── tablet.png
│       ├── desktop.png
│       └── 4k.png
└── diffs/
    └── homepage/
        ├── mobile_diff.png
        └── mobile_data.json
```

## Error Handling

The skill handles common errors gracefully:
- **Network timeouts**: Configurable retry with exponential backoff
- **Element not found**: Clear error messages with available selectors
- **Baseline missing**: Automatic creation suggestion
- **Telegram failures**: Logs error but doesn't fail the main task

## Best Practices

1. **Use baselines for stable pages** - Don't baseline dynamic content
2. **Set appropriate thresholds** - Some pixel variation is normal
3. **Run accessibility early** - Catch issues before they ship
4. **Use --dry-run first** - Preview multi-step operations
5. **Configure Telegram for CI** - Get notified of failures
