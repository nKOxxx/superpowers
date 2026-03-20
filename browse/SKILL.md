---
name: browse
description: Browser automation skill using Playwright for visual testing, QA, and accessibility audits. Capture screenshots across multiple viewports, run accessibility audits with axe-core, perform visual regression testing, and validate responsive designs. Triggers on screenshot requests, visual testing commands, browser automation, UI testing, or when asked to capture a webpage.
---

# Browse Skill

Browser automation for visual testing and QA with Playwright.

## Capabilities

- **Screenshot Capture**: Full page or element-specific screenshots across multiple viewports
- **Accessibility Audits**: Automated WCAG compliance checking with axe-core
- **Visual Regression**: Compare screenshots between versions
- **Responsive Testing**: Validate designs across mobile, tablet, and desktop

## Usage

```bash
# Capture screenshot
browse https://example.com

# Multi-viewport screenshots
browse https://example.com --viewports mobile,tablet,desktop

# Accessibility audit
browse https://example.com --audit

# Visual comparison
browse compare https://v1.example.com https://v2.example.com
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--viewport` | Viewport preset or custom size | desktop |
| `--full-page` | Capture full page | false |
| `--audit` | Run accessibility audit | false |
| `--wait` | Wait time in ms after load | 0 |
| `--selector` | Capture specific element | - |
| `--dark-mode` | Use dark color scheme | false |

## Viewport Presets

- `mobile`: 375x667 (iPhone SE)
- `tablet`: 768x1024 (iPad Mini)
- `desktop`: 1280x720
- `wide`: 1920x1080
- `4k`: 3840x2160

## Output

- Screenshots saved to `./browse-results/`
- Returns `MEDIA: path/to/screenshot.png` for Telegram
- Accessibility reports include violation details and recommendations

## Telegram Integration

Screenshots are automatically sent via Telegram using OpenClaw's MEDIA: output protocol:

```
MEDIA: ./browse-results/desktop-1710900000000.png
```

## Environment Variables

- `PLAYWRIGHT_BROWSERS_PATH` - Custom browser installation path
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` - Skip browser downloads in CI

## Reference

See [references/playwright.md](references/playwright.md) for:
- Advanced Playwright configuration
- Mobile device emulation
- Browser context options
- Wait strategies
- Axe-core configuration
