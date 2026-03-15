# @nko/superpowers

OpenClaw superpowers - AI-powered development workflows

## Installation

```bash
npm install -g @nko/superpowers
```

## Skills

### `/browse` - Browser Automation

Playwright-based browser automation for screenshots and visual testing.

```bash
# Basic screenshot
superpowers browse https://example.com

# Full page capture
superpowers browse https://example.com --full-page

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Custom viewport
superpowers browse https://example.com --width=1440 --height=900

# Element screenshot
superpowers browse https://example.com --element="header"

# With actions (click, type, wait, scroll, hover)
superpowers browse https://example.com --actions='[
  {"type": "click", "target": "button"},
  {"type": "wait", "duration": 1000}
]'
```

### `/qa` - Systematic Testing

Auto-detects test framework and runs targeted, smoke, or full tests.

```bash
# Targeted - runs tests for changed files
superpowers qa --mode=targeted

# Smoke tests
superpowers qa --mode=smoke

# Full test suite
superpowers qa --mode=full

# With coverage
superpowers qa --mode=full --coverage
```

Supported frameworks: Vitest, Jest, Mocha

### `/ship` - Release Pipeline

One-command release with semantic versioning and changelog generation.

```bash
# Patch release
superpowers ship --version=patch

# Minor release
superpowers ship --version=minor

# Major release
superpowers ship --version=major

# Specific version
superpowers ship --version=1.2.3

# Dry run (preview)
superpowers ship --version=patch --dry-run

# Skip push/release
superpowers ship --version=patch --skip-push --skip-release
```

Requires `GH_TOKEN` environment variable for GitHub releases.

### `/plan-ceo-review` - Product Strategy

BAT framework evaluation for product decisions.

```bash
# Manual scoring
superpowers plan-ceo-review "Feature Name: Description" \
  --brand=4 --attention=5 --trust=3

# Auto-calculate from description
superpowers plan-ceo-review "Premium secure messaging platform" --auto
```

**BAT Framework:**
- **Brand** (0-5): Does it align with and enhance brand?
- **Attention** (0-5): Does it capture meaningful demand?
- **Trust** (0-5): Does it build user trust?

**10-Star Methodology:** 10/15 minimum to build, 2/3 dimensions strong.

## Repository

https://github.com/nKOxxx/superpowers

## License

MIT
