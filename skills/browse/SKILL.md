# browse

Browser automation for visual testing, QA, and web scraping with Playwright.

## Usage

```
/browse <url> [options]
```

## Options

- `--screenshot` - Capture full-page screenshot
- `--selector <sel>` - Capture specific element
- `--viewport <wxh>` - Set viewport size (e.g., 1920x1080)
- `--mobile` - Emulate mobile device
- `--tablet` - Emulate tablet device
- `--dark` - Force dark mode
- `--wait-for <sel>` - Wait for element before capture
- `--delay <ms>` - Delay before capture (ms)
- `--accessibility` - Run accessibility audit
- `--compare <path>` - Compare against baseline image
- `--output <dir>` - Output directory for screenshots
- `--pdf` - Generate PDF instead of screenshot
- `--scroll` - Capture after scrolling to bottom
- `--interactive` - Keep browser open for debugging
- `--telegram` - Send screenshot to Telegram

## Examples

```bash
# Basic screenshot
/browse https://example.com --screenshot

# Mobile viewport with dark mode
/browse https://example.com --mobile --dark

# Compare against baseline
/browse https://example.com --compare ./baseline.png

# Accessibility audit
/browse https://example.com --accessibility

# Send to Telegram
/browse https://example.com --screenshot --telegram
```

## Output

Screenshots saved to `./screenshots/` by default. Accessibility reports are JSON.
