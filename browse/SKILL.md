---
name: browse
description: Browser automation for visual testing and QA with Playwright. Use when user needs to test web applications, capture screenshots, validate UI flows, or perform automated browser actions. Triggers on requests like /browse URL, visual testing, screenshot capture, flow testing, or UI automation.
---

# /browse - Browser Automation

Visual testing and browser automation using Playwright.

## Quick Start

```bash
/browse https://example.com
/browse https://example.com --viewport=mobile
/browse https://example.com --flows=critical,auth
```

## Capabilities

1. **Screenshot Capture** - Full page or element-specific screenshots
2. **Flow Testing** - Validate critical user paths
3. **Visual Regression** - Compare screenshots for changes
4. **Mobile Testing** - Multiple viewport sizes
5. **Element Interaction** - Click, type, scroll automation

## Usage

### Basic Screenshot
```bash
/browse https://example.com
```

### Mobile Viewport
```bash
/browse https://example.com --viewport=mobile
# Options: mobile, tablet, desktop (default)
```

### Flow Testing
```bash
/browse https://example.com --flows=critical
# Flows defined in config: critical, auth, checkout, etc.
```

### Custom Viewport
```bash
/browse https://example.com --width=1280 --height=720
```

## Configuration

Flows are configured in `superpowers.config.json`:

```json
{
  "browser": {
    "flows": {
      "critical": ["/", "/about", "/contact"],
      "auth": ["/login", "/dashboard", "/profile"],
      "checkout": ["/cart", "/checkout", "/payment"]
    },
    "viewports": {
      "mobile": { "width": 375, "height": 667 },
      "tablet": { "width": 768, "height": 1024 },
      "desktop": { "width": 1280, "height": 720 }
    }
  }
}
```

## Resources

- **scripts/browse.ts** - Main browser automation script
- **scripts/lib/screenshot.ts** - Screenshot utilities
- **scripts/lib/flows.ts** - Flow execution engine
- **references/playwright-config.md** - Playwright configuration guide

## Environment Variables

- `PLAYWRIGHT_BROWSERS_PATH` - Custom browser installation path
- `SCREENSHOT_DIR` - Output directory for screenshots (default: ./screenshots)
