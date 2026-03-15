# /browse - Browser Automation Skill

Browser automation with Playwright for visual testing and QA.

## Features

- **Screenshot capture**: Single URL, full page, or element-specific
- **Viewport presets**: Mobile (375x667), Tablet (768x1024), Desktop (1920x1080)
- **Custom viewport**: Specify exact dimensions
- **Action sequences**: Click, type, wait, scroll, hover
- **Base64 output**: For Telegram integration

## Usage

```bash
# Capture desktop screenshot
browse https://example.com

# Mobile viewport
browse https://example.com --viewport=mobile

# Full page screenshot
browse https://example.com --full-page

# Specific element
browse https://example.com --selector="#hero"

# Custom viewport
browse https://example.com --width=1400 --height=900

# Action sequence
browse https://example.com --actions="click:#button,wait:1000,type:#input:hello"
```

## Options

| Option | Description |
|--------|-------------|
| `--viewport` | Preset: mobile, tablet, desktop |
| `--width` | Custom viewport width |
| `--height` | Custom viewport height |
| `--full-page` | Capture full scrollable page |
| `--selector` | Screenshot specific CSS element |
| `--actions` | Action sequence (comma-separated) |
| `--output` | Output file path |

## Action Syntax

Actions are comma-separated with colon delimiters:
- `click:selector` - Click element
- `type:selector:text` - Type text into element
- `wait:ms` - Wait milliseconds
- `scroll:selector` - Scroll to element
- `hover:selector` - Hover over element

## Requirements

- Node.js 18+
- Playwright (auto-installed)

## Installation

```bash
openclaw skill install browse.skill.tar.gz
```
