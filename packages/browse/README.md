# @superpowers/browse

Browser automation for visual testing and QA with Playwright.

## Installation

```bash
npm install @superpowers/browse
```

## Usage

### CLI

```bash
# Basic screenshot of a URL
browse https://example.com

# Mobile viewport
browse https://example.com --viewport mobile

# Custom dimensions
browse https://example.com --width 1280 --height 720

# Full page screenshot
browse https://example.com --full-page

# Screenshot specific element
browse https://example.com --selector "#header"

# Save to file
browse https://example.com --output screenshot.png

# Wait longer for dynamic content
browse https://example.com --wait 5000

# Execute actions before screenshot
browse https://example.com --actions '[{"type":"click","selector":"#menu"},{"type":"wait","duration":1000}]'
```

### Programmatic

```typescript
import { browseCommand } from '@superpowers/browse';

await browseCommand('https://example.com', {
  viewport: 'desktop',
  fullPage: true,
  wait: '2000',
});
```

## Viewport Presets

- `mobile` - 375×667 (iPhone SE)
- `mobile-lg` - 414×896 (iPhone 11 Pro Max)
- `tablet` - 768×1024 (iPad)
- `tablet-lg` - 1024×1366 (iPad Pro)
- `desktop` - 1920×1080 (default)
- `desktop-hd` - 2560×1440
- `desktop-4k` - 3840×2160

## Actions

Actions can be passed as a JSON array to interact with the page before screenshot:

```json
[
  { "type": "click", "selector": "#button" },
  { "type": "type", "selector": "#input", "text": "Hello World" },
  { "type": "wait", "duration": 1000 },
  { "type": "scroll", "x": 0, "y": 500 },
  { "type": "hover", "selector": "#dropdown" },
  { "type": "press", "selector": "#input", "key": "Enter" },
  { "type": "select", "selector": "#select", "value": "option1" }
]
```

## CLI Options

```
Usage: browse [options] <url>

Arguments:
  url                    URL to browse

Options:
  -v, --viewport <preset>  Viewport preset (mobile, tablet, desktop) (default: "desktop")
  -W, --width <number>     Custom viewport width
  -H, --height <number>    Custom viewport height
  -f, --full-page          Capture full page screenshot (default: false)
  -s, --selector <selector>  CSS selector to capture specific element
  -o, --output <path>      Output file path (default: base64 to stdout)
  -w, --wait <ms>          Wait time in ms after load (default: "1000")
  --actions <json>         JSON array of actions to perform before screenshot
  -h, --help              display help for command
```

## License

MIT
