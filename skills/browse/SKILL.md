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
superpowers browse https://example.com --actions='[{"type":"click","selector":".btn"},{"type":"wait","duration":1000}]'
```

## Options

- `--viewport=<name>` - Viewport preset (mobile, tablet, desktop, wide). Default: desktop
- `--full-page` - Capture full page screenshot. Default: false
- `--output=<path>` - Save screenshot to file path
- `--wait=<ms>` - Wait time in ms after page load. Default: 1000
- `--selector=<selector>` - CSS selector to capture specific element
- `--actions=<json>` - JSON array of actions to perform

## Viewport Presets

- `mobile`: 375x667 @ 2x
- `tablet`: 768x1024 @ 2x
- `desktop`: 1280x720 @ 1x
- `wide`: 1920x1080 @ 1x

## Action Format

Actions are JSON objects with a `type` field:

```json
[
  { "type": "click", "selector": ".button" },
  { "type": "type", "selector": "#input", "text": "hello" },
  { "type": "wait", "duration": 1000 },
  { "type": "scroll" },
  { "type": "hover", "selector": ".dropdown" }
]
```

## Output

- Base64 output to stdout by default
- File output with `--output` flag
- Screenshot data available for OpenClaw canvas display

## Requirements

- Node.js >= 18.0.0
- Playwright browsers (installed automatically)
