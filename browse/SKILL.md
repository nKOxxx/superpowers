---
name: browse
description: "Browser automation with Playwright - screenshots, UI testing, click/type interactions, and flow validation. Use when: (1) taking website screenshots for visual testing, (2) validating web UI elements and flows, (3) testing URL availability and content, (4) automating browser interactions."
metadata:
  {
    "openclaw":
      {
        "emoji": "🌐",
        "requires": { "bins": ["npx"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "@superpowers/browse",
              "bins": ["browse"],
              "label": "Install Browse skill (npm)",
            },
          ],
      },
  }
---

# Browse Skill

Browser automation powered by Playwright. Take screenshots, test URLs, interact with UI elements, and validate web flows.

## Quick Start

```bash
# Take a screenshot
browse screenshot https://example.com

# Test a URL
browse test-url https://example.com --expect-text "Welcome"

# Click an element
browse click https://example.com --selector "#submit-btn"

# Type into a form
browse type https://example.com --selector "#email" --text "user@example.com"
```

## Commands

### screenshot <url>

Take a screenshot of a webpage.

**Options:**
- `-v, --viewport <preset>` - Viewport preset: `desktop` (default), `mobile`, `tablet`
- `-W, --width <number>` - Custom viewport width
- `-H, --height <number>` - Custom viewport height
- `-o, --output <dir>` - Output directory (default: `./screenshots`)
- `-f, --filename <name>` - Custom filename
- `--full-page` - Capture full page (not just viewport)
- `--wait-for <selector>` - Wait for element before screenshot
- `--wait-time <ms>` - Wait time before screenshot
- `--hide <selectors...>` - Hide elements (e.g., cookie banners)
- `--dark-mode` - Enable dark mode

**Examples:**
```bash
# Mobile screenshot
browse screenshot https://example.com --viewport mobile

# Full page with custom output
browse screenshot https://example.com --full-page -o ./output

# Wait for element and hide cookie banner
browse screenshot https://example.com --wait-for "#content" --hide "#cookie-banner"
```

### test-url <url>

Test a URL for availability and content validation.

**Options:**
- `--expect-status <code>` - Expected HTTP status (default: 200)
- `--expect-text <text>` - Text that should appear on page
- `--expect-selector <selector>` - CSS selector that should exist
- `-t, --timeout <ms>` - Page load timeout
- `--dark-mode` - Enable dark mode

**Examples:**
```bash
# Basic health check
browse test-url https://example.com

# Check for specific content
browse test-url https://example.com --expect-text "Sign Up" --expect-selector ".hero"

# Custom timeout
browse test-url https://example.com --timeout 10000
```

### click <url>

Click an element on a webpage.

**Options:**
- `-s, --selector <selector>` - (Required) Element selector to click
- `--screenshot` - Take screenshot after click
- `--wait-for-navigation` - Wait for navigation after click
- `-v, --viewport <preset>` - Viewport preset

**Examples:**
```bash
# Click a button
browse click https://example.com --selector "#submit-btn"

# Click and wait for navigation
browse click https://example.com --selector "a.next" --wait-for-navigation --screenshot
```

### type <url>

Type text into an input field.

**Options:**
- `-s, --selector <selector>` - (Required) Input field selector
- `-t, --text <text>` - (Required) Text to type
- `--clear` - Clear field before typing
- `--submit` - Submit form after typing (press Enter)
- `--delay <ms>` - Delay between keystrokes
- `--screenshot` - Take screenshot after typing

**Examples:**
```bash
# Fill a form field
browse type https://example.com --selector "#email" --text "user@example.com"

# Fill and submit
browse type https://example.com --selector "#search" --text "query" --submit
```

### flow <flow-file>

Run a multi-step browser flow from a JSON file.

**Flow JSON format:**
```json
{
  "name": "Login flow",
  "viewport": "desktop",
  "outputDir": "./screenshots",
  "steps": [
    { "action": "navigate", "url": "https://example.com/login" },
    { "action": "type", "selector": "#email", "text": "user@example.com" },
    { "action": "type", "selector": "#password", "text": "secret" },
    { "action": "click", "selector": "#login-btn" },
    { "action": "wait", "time": 2000 },
    { "action": "screenshot", "filename": "logged-in.png" }
  ]
}
```

**Step types:**
- `navigate` - Navigate to URL (requires `url`)
- `click` - Click element (requires `selector`)
- `type` - Type text (requires `selector` and `text`)
- `wait` - Wait for time (requires `time` in ms)
- `scroll` - Scroll down one viewport
- `screenshot` - Take screenshot (optional `filename`)

## Viewport Presets

| Preset | Width | Height |
|--------|-------|--------|
| desktop | 1920 | 1080 |
| mobile | 375 | 667 |
| tablet | 768 | 1024 |

## Output

All screenshots are saved to the specified output directory with timestamps:
```
screenshots/
├── screenshot-2024-01-15T10-30-00-000Z.png
└── ...
```

## CI/CD Integration

The `test-url` command exits with code 1 on test failure, making it suitable for CI pipelines:

```bash
# In your CI workflow
browse test-url https://staging.example.com --expect-text "Dashboard"
```

## Environment Variables

No required environment variables. Playwright browsers are installed automatically on first run.
