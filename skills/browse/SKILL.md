---
name: browse
description: Browser automation for visual testing and QA with Playwright. Use when user needs to test web applications, capture screenshots, validate UI flows, or perform automated browser actions. Triggers on requests like /browse URL, visual testing, screenshot capture, flow testing, or UI automation.
metadata:
  openclaw:
    requires:
      bins: ["node", "npx"]
      npm: ["@nko/superpowers"]
    primaryEnv: null
    modelCompatibility: ["kimi-k2.5", "claude-opus-4", "gpt-4"]
    skillType: "typescript"
    entryPoint: "dist/index.js"
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

### Custom actions

```bash
superpowers browse https://example.com --actions="click:.btn,wait:1000,type:#input|hello"
```

## Options

- `--viewport=<name>` - Viewport preset (mobile, tablet, desktop, wide). Default: desktop
- `--full-page` - Capture full page screenshot. Default: false
- `--output=<path>` - Save screenshot to file path
- `--wait=<ms>` - Wait time in ms after page load. Default: 1000
- `--selector=<selector>` - CSS selector to capture specific element
- `--actions=<actions>` - Comma-separated actions

## Viewport Presets

- `mobile`: 375x667 @ 2x
- `tablet`: 768x1024 @ 2x
- `desktop`: 1280x720 @ 1x
- `wide`: 1920x1080 @ 1x

## Action Syntax

Actions are comma-separated with colon-separated parameters:

- `click:<selector>` - Click element
- `type:<selector>|<text>` - Type text into element
- `wait:<ms>` - Wait milliseconds
- `scroll` - Scroll down one viewport
- `hover:<selector>` - Hover over element
- `navigate:<url>` - Navigate to URL
- `screenshot` - Take screenshot at this point

Example: `click:.menu,wait:500,hover:.dropdown-item,screenshot`

## Flow Mode

For complex multi-step flows:

```bash
superpowers flow https://example.com --actions='[{"type":"click","selector":".btn"},{"type":"wait","delay":1000}]'
```

## Output

- Base64 output to stdout by default
- File output with `--output` flag
- Screenshot data available for OpenClay canvas display

## Requirements

- Node.js >= 18.0.0
- Playwright browsers (installed automatically)
