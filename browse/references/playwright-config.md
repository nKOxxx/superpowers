# Playwright Configuration Guide

## Overview

The browse skill uses Playwright for browser automation and visual testing.

## Supported Browsers

- **Chromium** (default) - Chrome/Edge compatibility
- **Firefox** - Gecko engine
- **WebKit** - Safari compatibility

## Viewport Presets

| Preset | Width | Height | Use Case |
|--------|-------|--------|----------|
| mobile | 375 | 667 | iPhone SE/similar |
| tablet | 768 | 1024 | iPad/similar |
| desktop | 1280 | 720 | Standard desktop |
| 1440p | 2560 | 1440 | High-res desktop |
| 4k | 3840 | 2160 | 4K displays |

## Flow Configuration

Flows are defined in `superpowers.config.json`:

```json
{
  "browser": {
    "flows": {
      "critical": [
        { "action": "navigate", "target": "/" },
        { "action": "screenshot" },
        { "action": "navigate", "target": "/about" },
        { "action": "screenshot" }
      ],
      "auth": [
        { "action": "navigate", "target": "/login" },
        { "action": "type", "selector": "#email", "value": "user@example.com" },
        { "action": "type", "selector": "#password", "value": "password" },
        { "action": "click", "selector": "button[type='submit']" },
        { "action": "wait", "selector": ".dashboard", "delay": 3000 },
        { "action": "screenshot" }
      ]
    }
  }
}
```

## Available Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| navigate | Go to URL | target, url |
| click | Click element | selector |
| type | Fill input | selector, value |
| wait | Wait for element/delay | selector, delay |
| screenshot | Capture screenshot | - |
| scroll | Scroll page | - |

## Environment Variables

- `PLAYWRIGHT_BROWSERS_PATH` - Custom browser installation path
- `SCREENSHOT_DIR` - Default output directory

## Best Practices

1. **Use data attributes** for selectors: `data-testid="submit-button"`
2. **Wait for elements** before interacting
3. **Use realistic viewports** for mobile testing
4. **Organize flows** by user journey (auth, checkout, etc.)
