---
name: browse
description: Browser automation for visual testing and QA with Playwright. Use when user needs to test web applications, capture screenshots, validate UI flows, or perform automated browser actions. Triggers on requests like /browse URL, visual testing, screenshot capture, flow testing, or UI automation.
metadata:
  openclaw:
    requires:
      bins: ["node", "npx"]
      npm: ["@nko/superpowers"]
    primaryEnv: null
---

# Browse - Browser Automation Skill

Visual testing and browser automation using Playwright. Provides screenshot capture, flow testing, and UI validation.

## Capabilities

- Screenshot capture (single URL, full page, element-specific)
- Multiple viewport presets (mobile, tablet, desktop, wide)
- Custom viewport dimensions
- Flow-based testing (sequence of page navigations)
- Custom actions (click, type, wait, scroll, hover)
- Wait for elements before screenshot

## Usage

### Screenshot a URL

```bash
superpowers browse https://example.com
```

### Mobile viewport

```bash
superpowers browse https://example.com --viewport=mobile
```

### Full page screenshot

```bash
superpowers browse https://example.com --full-page
```

### Run predefined flows

```bash
superpowers browse https://example.com --flows=critical,auth
```

### Custom actions

```bash
superpowers browse https://example.com --actions="click:.btn,wait:1000,screenshot"
```

## Options

- `--viewport=<name>` - Viewport preset (mobile, tablet, desktop). Default: desktop
- `--width=<pixels>` - Custom viewport width
- `--height=<pixels>` - Custom viewport height
- `--full-page` - Capture full page screenshot. Default: false
- `--output=<dir>` - Output directory for screenshots. Default: ./screenshots
- `--flows=<names>` - Comma-separated flow names
- `--wait-for=<selector>` - Wait for element before screenshot
- `--actions=<actions>` - Comma-separated actions
- `--timeout=<ms>` - Navigation timeout. Default: 30000

## Viewport Presets

- `mobile`: 375x667
- `tablet`: 768x1024
- `desktop`: 1280x720

## Flows

Predefined flow names (configurable via config):
- `critical`: ['/','/about','/contact']
- `auth`: ['/login','/dashboard','/profile']
- `checkout`: ['/cart','/checkout','/payment']

## Action Syntax

Actions are comma-separated with colon-separated parameters:

- `click:<selector>` - Click element
- `type:<selector>|<text>` - Type text into element
- `wait:<ms>` - Wait milliseconds
- `scroll` - Scroll down one viewport
- `hover:<selector>` - Hover over element
- `screenshot` - Take screenshot at this point

Example: `click:.menu,wait:500,hover:.dropdown-item,screenshot`

## Configuration

Add to `superpowers.config.json`:

```json
{
  "browser": {
    "defaultViewport": "desktop",
    "screenshotDir": "./screenshots",
    "viewports": {
      "custom": { "width": 1440, "height": 900 }
    },
    "flows": {
      "critical": [
        { "name": "Homepage", "url": "/" },
        { "name": "About", "url": "/about" }
      ],
      "auth": [
        { 
          "name": "Login Flow", 
          "url": "/login",
          "actions": [
            { "type": "type", "selector": "#email", "text": "test@example.com" },
            { "type": "type", "selector": "#password", "text": "password" },
            { "type": "click", "selector": "#submit" },
            { "type": "wait", "delay": 2000 }
          ]
        }
      ]
    }
  }
}
```

## Output

Screenshots saved to output directory with filenames:
`<hostname>_<viewport>_<timestamp>.png`

## Examples

```
User: /browse https://myapp.com
Agent: Running browser automation...
✓ Screenshot saved: ./screenshots/myapp-com_desktop_2024-03-15T10-30-00.png
```

## Requirements

- Node.js >= 18.0.0
- Playwright browsers (installed automatically)
