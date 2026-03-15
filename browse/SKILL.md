---
name: browse
description: Browser automation for visual testing and QA with Playwright. Use when user needs to test web applications, capture screenshots, validate UI flows, or perform automated browser actions. Triggers on requests like /browse URL, visual testing, screenshot capture, flow testing, or UI automation.
---

# Browse Skill

Browser automation powered by Playwright for screenshots, visual testing, and flow-based interactions.

## Usage

```
/browse <url> [options]
```

### Options

- `--viewport=<preset>` - Viewport preset: `mobile`, `tablet`, `desktop` (default: desktop)
- `--full-page` - Capture full page screenshot
- `--selector=<css>` - Screenshot specific element
- `--flow=<json>` - Execute action flow (click, type, wait, scroll, hover)
- `--wait-for=<selector>` - Wait for element before screenshot
- `--timeout=<ms>` - Timeout in milliseconds (default: 30000)

### Viewport Presets

| Preset | Width | Height | Device |
|--------|-------|--------|--------|
| mobile | 375 | 812 | iPhone X |
| tablet | 768 | 1024 | iPad |
| desktop | 1920 | 1080 | Full HD |

### Flow Actions

Flow is a JSON array of actions:

```json
[
  { "action": "click", "selector": "#button" },
  { "action": "type", "selector": "#input", "text": "Hello" },
  { "action": "wait", "ms": 1000 },
  { "action": "scroll", "selector": "#section" },
  { "action": "hover", "selector": "#dropdown" },
  { "action": "waitForSelector", "selector": ".loaded" }
]
```

## Examples

### Basic Screenshot
```
/browse https://example.com
```

### Mobile Viewport
```
/browse https://example.com --viewport=mobile
```

### Full Page Screenshot
```
/browse https://example.com --full-page
```

### Element Screenshot
```
/browse https://example.com --selector=".hero-section"
```

### Flow-based Testing
```
/browse https://example.com --flow='[
  { "action": "click", "selector": "#menu" },
  { "action": "wait", "ms": 500 },
  { "action": "click", "selector": "#item-1" }
]'
```

## Telegram Integration

When used via Telegram, the skill provides:
- Inline buttons for viewport selection
- Screenshot delivery as image
- Error messages with helpful context

## Configuration

Environment variables:
- `PLAYWRIGHT_BROWSERS_PATH` - Custom browser installation path
- `BROWSE_DEFAULT_TIMEOUT` - Default timeout (default: 30000)
- `BROWSE_HEADLESS` - Run headless (default: true)

## Handler

**Entry:** `handler.ts`
**Runtime:** Node.js with Playwright
