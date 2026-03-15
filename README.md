# @nko/superpowers

OpenClaw superpowers - A collection of TypeScript CLI tools for browser automation, QA testing, release management, and product strategy.

## Installation

```bash
npm install -g @nko/superpowers
```

Or use directly with npx:
```bash
npx @nko/superpowers <command>
```

## Commands

### `/browse` - Browser Automation

Capture screenshots and automate browser actions with Playwright.

```bash
# Screenshot a website
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page screenshot
superpowers browse https://example.com --full-page

# Custom viewport size
superpowers browse https://example.com --width=1920 --height=1080

# Wait for element and capture
superpowers browse https://example.com --wait-for=".content"

# Action sequence
superpowers browse https://example.com --actions="click:.menu,wait:500,screenshot"
```

### `/qa` - Systematic Testing

Run tests as a QA Lead with targeted, smoke, or full test modes.

```bash
# Run targeted tests (based on git diff)
superpowers qa

# Smoke tests
superpowers qa --mode=smoke

# Full test suite
superpowers qa --mode=full

# With coverage
superpowers qa --coverage

# Custom diff range
superpowers qa --diff=HEAD~3
```

Auto-detects: vitest, jest, mocha

### `/ship` - Release Pipeline

One-command release: version bump, changelog, tag, push, and GitHub release.

```bash
# Patch release
superpowers ship --version=patch

# Minor release
superpowers ship --version=minor

# Major release
superpowers ship --version=major

# Specific version
superpowers ship --version=1.2.3

# Dry run (preview only)
superpowers ship --version=patch --dry-run

# Skip tests
superpowers ship --version=patch --skip-tests

# Prerelease
superpowers ship --version=minor --prerelease
```

Requires:
- Clean git working directory
- `GH_TOKEN` environment variable for GitHub releases

### `/plan-ceo-review` - Product Strategy

Evaluate features using the BAT (Brand, Attention, Trust) framework.

```bash
# Basic evaluation
superpowers ceo-review --feature="mobile app"

# Full context
superpowers ceo-review \
  --feature="AI code review" \
  --goal="Reduce review time 50%" \
  --audience="Dev teams" \
  --competition="GitHub Copilot" \
  --trust="SOC2 certified"

# Manual scoring
superpowers ceo-review \
  --feature="Dark mode" \
  --brand=3 \
  --attention=4 \
  --trust-score=2
```

#### BAT Framework Scoring

- **Brand** (0-5): Does this strengthen our brand?
- **Attention** (0-5): Will users actually use this?
- **Trust** (0-5): Does this build user trust?

#### 10-Star Methodology

- **12-15 ⭐**: BUILD - Strong signal, proceed with confidence
- **10-11 ⭐**: BUILD - Good signal, validate assumptions
- **8-9 ⭐**: CONSIDER - Mixed signal, need more data
- **0-7 ⭐**: DON'T BUILD - Weak signal, focus elsewhere

## Requirements

- Node.js >= 18.0.0
- Git (for /qa and /ship)
- GH_TOKEN environment variable (for GitHub releases)

## License

MIT
