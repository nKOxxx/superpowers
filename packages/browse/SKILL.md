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

## Installation

```bash
npm install -g @openclaw/superpowers-browse
```

## Quick Start

```bash
# Basic screenshot
browse https://example.com

# Mobile viewport
browse https://example.com --viewport=mobile

# Test critical flows
browse https://example.com --flows=critical,auth

# Full visual regression
browse https://example.com --viewports=mobile,tablet,desktop
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

## Usage

### Basic Commands

```bash
# Single page screenshot
browse https://example.com

# Mobile viewport
browse https://example.com --viewport=mobile

# Multiple viewports
browse https://example.com --viewports=mobile,desktop

# Custom dimensions
browse https://example.com --width=1440 --height=900

# Screenshot specific element
browse https://example.com --selector="#hero"

# Wait for animations
browse https://example.com --wait=2000
```

### Flow Testing

```bash
# Run configured flows
browse https://example.com --flows=critical

# Multiple flows
browse https://example.com --flows=critical,auth,checkout

# Full site testing
browse https://example.com --flows=all
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
| `--viewports` | `-V` | Multiple viewports (comma-separated) | - |
| `--flows` | `-f` | Flow names to run | - |
| `--selector` | `-s` | CSS selector for element | - |
| `--full-page` | `-F` | Capture full page | `true` |
| `--output` | `-o` | Output directory | `./screenshots` |
| `--wait` | `-w` | Wait time after load (ms) | `0` |
| `--telegram` | `-t` | Send Telegram notification | `false` |
| `--config` | `-c` | Config file path | - |

## Examples

### E-commerce Testing
```bash
browse https://shop.example.com --flows=critical,checkout
```

### Responsive Design Check
```bash
browse https://example.com --viewports=mobile,tablet,desktop
```

### Form Validation
```bash
browse https://example.com/contact --selector="#contact-form" --wait=1000
```

## Dependencies

- `playwright` - Browser automation
- `commander` - CLI framework
- `chalk` - Terminal colors

---

**Part of OpenClaw Superpowers** | [GitHub](https://github.com/nKOxxx/superpowers)
