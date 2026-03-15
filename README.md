# @nko/superpowers

OpenClaw superpowers - 4 TypeScript skills for browser automation, QA testing, release pipeline, and product strategy.

## Installation

```bash
npm install -g @nko/superpowers
```

## Skills

### `/browse` - Browser Automation

Screenshot capture and visual testing with Playwright.

```bash
# Screenshot a URL
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page screenshot
superpowers browse https://example.com --full-page

# Run predefined flows
superpowers browse https://example.com --flows=critical,auth

# Custom actions
superpowers browse https://example.com --actions="click:.btn,wait:1000,screenshot"
```

### `/qa` - Systematic Testing

QA Lead automation with targeted, smoke, and full test modes.

```bash
# Run targeted tests (based on git diff)
superpowers qa

# Smoke test
superpowers qa --mode=smoke

# Full regression suite
superpowers qa --mode=full

# With coverage
superpowers qa --coverage
```

### `/ship` - Release Pipeline

One-command release: version bump, changelog, git tag, push, GitHub release.

```bash
# Release patch version
superpowers ship --version=patch

# Release minor version
superpowers ship --version=minor

# Release major version
superpowers ship --version=major

# Preview without executing
superpowers ship --version=patch --dry-run
```

**Note:** Set `GH_TOKEN` environment variable for GitHub releases.

### `/plan-ceo-review` - Product Strategy

BAT framework evaluation (Brand, Attention, Trust) with 10-star methodology.

```bash
# Basic evaluation
superpowers ceo-review --feature="mobile app"

# Full context
superpowers ceo-review \
  --feature="AI code review" \
  --goal="Reduce review time 50%" \
  --audience="Dev teams"
```

## Requirements

- Node.js >= 18.0.0
- Git (for ship and qa skills)
- GH_TOKEN environment variable (for ship GitHub releases)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Package skills
npm run package:skills
```

## Repository

https://github.com/nKOxxx/superpowers

## License

MIT
