# Superpowers for OpenClaw

AI-powered development workflows for OpenClaw agents.

## Installation

```bash
npm install -g @nko/superpowers
```

## Commands

### `/browse` - Browser Automation
Visual testing and browser automation using Playwright.

```bash
# Screenshot a URL
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page screenshot
superpowers browse https://example.com --full-page

# Custom actions
superpowers browse https://example.com --actions="click:.btn,wait:1000,screenshot"
```

### `/qa` - Systematic Testing
Acts as QA Lead to analyze code changes and run appropriate tests.

```bash
# Run targeted tests (default)
superpowers qa

# Smoke test - quick validation
superpowers qa --mode=smoke

# Full regression test suite
superpowers qa --mode=full

# With coverage
superpowers qa --coverage
```

### `/ship` - Release Pipeline
One-command release: version bump, changelog generation, git tag, push, and GitHub release.

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

**Requires:** `GH_TOKEN` environment variable for GitHub releases.

### `/plan-ceo-review` - Product Strategy
Product strategy evaluation using the BAT framework (Brand, Attention, Trust).

```bash
# Basic evaluation
superpowers ceo-review --feature="mobile app"

# Full context
superpowers ceo-review \
  --feature="AI code review" \
  --goal="Reduce review time 50%" \
  --audience="Dev teams"
```

## The BAT Framework

Three dimensions scored 0-5 stars:

- **Brand** - Does this strengthen our brand?
- **Attention** - Will users actually use this?
- **Trust** - Does this build user trust?

### 10-Star Methodology

- **12-15 ⭐ BUILD** - Strong signal, proceed with confidence
- **10-11 ⭐ BUILD** - Good signal, validate assumptions
- **8-9 ⭐ CONSIDER** - Mixed signal, need more data
- **0-7 ⭐ DON'T BUILD** - Weak signal, focus elsewhere

## Requirements

- Node.js >= 18.0.0
- Git (for ship and qa commands)
- Playwright browsers (installed automatically)
- GH_TOKEN environment variable (for GitHub releases)

## Skills

This package provides 4 OpenClaw skills:

1. **browse** - Browser automation with Playwright
2. **qa** - Systematic testing as QA Lead
3. **ship** - One-command release pipeline
4. **plan-ceo-review** - BAT framework for product decisions

## Repository

https://github.com/nKOxxx/superpowers

## License

MIT
