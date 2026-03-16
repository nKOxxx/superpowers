# @superpowers/browse

Browser automation and visual testing with Playwright.

## Usage

```bash
superpowers browse <url> [options]
```

## Options

- `--viewport=<preset>` - Viewport preset (mobile, tablet, desktop, wide)
- `--full-page` - Capture full page screenshot
- `--output=<path>` - Save screenshot to file path
- `--wait=<ms>` - Wait time in ms after page load
- `--selector=<selector>` - CSS selector to capture specific element
- `--actions=<actions>` - Comma-separated actions

## Examples

```bash
superpowers browse https://example.com
superpowers browse https://example.com --viewport=mobile
superpowers browse https://example.com --full-page --output=screenshot.png
superpowers browse https://example.com --actions="click:.btn,wait:1000"
```
