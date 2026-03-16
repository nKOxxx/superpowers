# Playwright Configuration Guide

## Overview

Playwright is used by the `/browse` skill for browser automation and visual testing.

## Installation

```bash
# Install Playwright browsers
npx playwright install chromium

# Or install all browsers
npx playwright install
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PLAYWRIGHT_BROWSERS_PATH` | Custom browser installation path | System default |
| `SCREENSHOT_DIR` | Output directory for screenshots | `./screenshots` |
| `PLAYWRIGHT_HEADLESS` | Run in headless mode | `true` |

### Viewport Sizes

Default viewports configured in `superpowers.config.json`:

```json
{
  "browser": {
    "viewports": {
      "mobile": { "width": 375, "height": 667 },
      "tablet": { "width": 768, "height": 1024 },
      "desktop": { "width": 1280, "height": 720 }
    }
  }
}
```

## Usage Examples

### Basic Screenshot

```bash
/browse https://example.com
```

### Mobile Viewport

```bash
/browse https://example.com --viewport=mobile
```

### Custom Size

```bash
/browse https://example.com --width=1920 --height=1080
```

### Flow Testing

```bash
/browse https://example.com --flows=critical,auth
```

## Selectors

Playwright supports multiple selector engines:

- **CSS**: `#id`, `.class`, `div[attr="value"]`
- **Text**: `text=Click me`
- **XPath**: `xpath=//button`
- **Role**: `role=button[name="Submit"]`

## Best Practices

1. **Use semantic selectors** - Prefer `role=` and text over CSS classes
2. **Wait for elements** - Use `--wait-for` to ensure dynamic content loads
3. **Hide dynamic content** - Use `--hide` for ads, timestamps, etc.
4. **Consistent viewports** - Define standard sizes in config

## Troubleshooting

### Browsers not found

```bash
npx playwright install chromium
```

### Screenshots differ between runs

- Use `--delay` to wait for animations
- Hide dynamic elements with `--hide`
- Ensure consistent viewport

### Timeout errors

- Increase delay with `--delay 2000`
- Use `--wait-for` for specific elements
- Check network connectivity
