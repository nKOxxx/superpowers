---
name: browse
description: Browser automation for visual testing and QA with Playwright. Use when user needs to test web applications, capture screenshots, validate UI flows, or perform automated browser actions. Triggers on requests like /browse URL, visual testing, screenshot capture, flow testing, or UI automation.
---

# Browse - Browser Automation Skill

Automated browser testing and screenshot capture using Playwright.

## Capabilities

- Screenshot capture (single URL, full page, element-specific)
- Viewport presets (mobile, tablet, desktop)
- Custom viewport dimensions
- Action sequences (click, type, wait, scroll, hover)
- Base64 screenshot output for Telegram integration

## Usage

```bash
# Basic screenshot
/browse https://example.com

# With viewport preset
/browse https://example.com --viewport=mobile

# Full page screenshot
/browse https://example.com --full-page

# Custom viewport
/browse https://example.com --width=1920 --height=1080

# With actions
/browse https://example.com --actions="click:#button,type:#input:text,wait:1000"
```

## CLI Arguments

- `url` - Target URL (required)
- `--viewport` - Preset: mobile | tablet | desktop
- `--width` / `--height` - Custom dimensions
- `--full-page` - Capture full scrollable page
- `--selector` - Screenshot specific element
- `--actions` - Comma-separated action sequence
- `--output` - Output path (default: auto-generated)

## Actions Format

Comma-separated actions in format `action:selector:value`:

- `click:selector` - Click element
- `type:selector:text` - Type text
- `wait:ms` - Wait milliseconds
- `scroll:selector` - Scroll to element
- `hover:selector` - Hover over element

## Output

- Saves screenshot to file
- Returns base64 encoded image for Telegram
- Prints execution summary

## Implementation

Use the bundled CLI in `cli.js` which wraps Playwright operations.