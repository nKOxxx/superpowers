---
name: browse
description: Browser automation with Playwright for visual testing, accessibility audits, and QA workflows. Triggers on /browse, screenshot requests, visual testing, accessibility audit, or page navigation commands.
---

# Browse Skill

Browser automation for OpenClaw using Playwright.

## Commands

### /browse

Navigate to a URL and optionally capture screenshots or run audits.

```
/browse <url> [options]
```

**Options:**
- `--screenshot` - Capture full-page screenshot
- `--viewport <WxH>` - Set viewport size (default: 1280x720)
- `--audit` - Run accessibility audit (axe-core)
- `--wait-for <selector>` - Wait for element before capturing
- `--timeout <ms>` - Navigation timeout (default: 30000)
- `--compare <path>` - Compare against baseline image
- `--mobile` - Emulate mobile device
- `--dark-mode` - Enable dark mode

## Usage Examples

```bash
# Basic navigation
/browse https://example.com

# Screenshot with custom viewport
/browse https://mysite.com --screenshot --viewport 1920x1080

# Accessibility audit
/browse https://app.com --audit --screenshot

# Visual regression testing
/browse https://staging.com --screenshot --compare baseline/home.png

# Mobile testing
/browse https://mobile.app --mobile --dark-mode --screenshot
```

## Dependencies

- playwright
- axe-core
- pixelmatch (optional, for visual comparison)
