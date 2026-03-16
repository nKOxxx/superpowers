---
name: browse
description: Browser automation for visual testing and UI flows using Playwright. Use when user needs screenshots, web testing, flow validation, or browser automation. Triggers on /browse, screenshot requests, visual testing, or UI automation tasks.
triggers:
  - /browse
  - screenshot
  - visual testing
  - browser automation
  - web testing
  - capture page
  - test UI flow
model: kimi-k2.5
---

# 🌐 /browse - Browser Automation Superpower

Visual testing and browser automation powered by Playwright. Part of the OpenClaw Superpowers collection.

## Philosophy (gstack-inspired)

Following Garry Tan's gstack philosophy:
- **Fast**: Parallel screenshot capture, optimized selectors
- **Simple**: One command to test entire flows
- **Reliable**: Automatic retries, network idle waiting
- **Visual**: Screenshots as source of truth

## Quick Start

```bash
# Basic screenshot
/browse https://example.com

# Mobile viewport
/browse https://example.com --viewport=mobile

# Test critical flows
/browse https://example.com --flows=critical,auth

# Full visual regression
/browse https://example.com --viewport=mobile,tablet,desktop
```

## Capabilities

### 1. Screenshot Capture
- Full page or element-specific screenshots
- Multiple viewport sizes (mobile, tablet, desktop, 4K)
- Automatic timestamp and naming
- PNG output with high quality

### 2. Flow Testing
- Configurable user journey validation
- Multi-page flow capture
- Error detection and reporting
- Flow timing metrics

### 3. Visual Regression
- Baseline comparison
- Diff highlighting
- Side-by-side review
- CI/CD integration

### 4. Element Interaction
- Click, type, scroll automation
- Form submission
- Waiting for elements
- JavaScript execution

## Usage

### Basic Commands

```bash
# Single page screenshot
/browse https://example.com

# Mobile viewport
/browse https://example.com --viewport=mobile

# Multiple viewports
/browse https://example.com --viewport=mobile,desktop

# Custom dimensions
/browse https://example.com --width=1440 --height=900

# Screenshot specific element
/browse https://example.com --selector="#hero"

# Wait for animations
/browse https://example.com --wait=2000
```

### Flow Testing

```bash
# Run configured flows
/browse https://example.com --flows=critical

# Multiple flows
/browse https://example.com --flows=critical,auth,checkout

# Full site testing
/browse https://example.com --flows=all
```

### Visual Regression

```bash
# Compare against baseline
/browse https://example.com --compare-baseline

# Update baseline
/browse https://example.com --update-baseline

# Threshold configuration
/browse https://example.com --threshold=0.1
```

## Configuration

Create `superpowers.config.json`:

```json
{
  "browser": {
    "browserType": "chromium",
    "defaultViewport": "desktop",
    "viewports": {
      "mobile": { "width": 375, "height": 667 },
      "tablet": { "width": 768, "height": 1024 },
      "desktop": { "width": 1280, "height": 720 },
      "1440p": { "width": 2560, "height": 1440 },
      "4k": { "width": 3840, "height": 2160 }
    },
    "flows": {
      "critical": ["/", "/about", "/pricing"],
      "auth": ["/login", "/dashboard", "/profile"],
      "checkout": ["/cart", "/checkout", "/confirmation"]
    },
    "selectors": {
      "cookieBanner": "[data-testid='cookie-banner']",
      "modal": ".modal-overlay"
    }
  },
  "telegram": {
    "enabled": true,
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "chatId": "${TELEGRAM_CHAT_ID}"
  }
}
```

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--viewport` | `-v` | Viewport preset | `desktop` |
| `--width` | `-W` | Custom width | - |
| `--height` | `-H` | Custom height | - |
| `--flows` | `-f` | Flow names to run | - |
| `--selector` | `-s` | CSS selector for element | - |
| `--fullPage` | - | Capture full page | `true` |
| `--output` | `-o` | Output directory | `./screenshots` |
| `--wait` | `-w` | Wait time after load | `0` |
| `--telegram` | `-t` | Send Telegram notification | `false` |
| `--config` | `-c` | Config file path | - |

## Output

```
🚀 Browse - Browser Automation
URL: https://example.com
Viewport: 1280x720
Output: ./screenshots

📸 Capturing: https://example.com/
✓ Screenshot saved: ./screenshots/example-com-2024-01-15T10-30-00.png

✅ Browse Complete
Screenshots captured: 1
  • ./screenshots/example-com-2024-01-15T10-30-00.png
```

## Telegram Integration

When enabled, browse sends:
- Screenshot count and URLs
- First screenshot as image
- Execution summary

## Environment Variables

- `PLAYWRIGHT_BROWSERS_PATH` - Custom browser path
- `SCREENSHOT_DIR` - Default output directory
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Telegram chat ID

## Examples

### E-commerce Testing
```bash
/browse https://shop.example.com --flows=critical,checkout
```

### Responsive Design Check
```bash
/browse https://example.com --viewport=mobile,tablet,desktop
```

### Form Validation
```bash
/browse https://example.com/contact --selector="#contact-form" --wait=1000
```

## Dependencies

- `playwright` - Browser automation
- `commander` - CLI framework
- `chalk` - Terminal colors

## References

- [Playwright Docs](https://playwright.dev/)
- [Visual Testing Guide](references/visual-testing.md)
- [Flow Configuration](references/flows.md)

---

**Part of OpenClaw Superpowers** | [GitHub](https://github.com/nKOxxx/superpowers)
