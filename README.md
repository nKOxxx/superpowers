# @nko/superpowers

OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions.

## Installation

```bash
npm install -g @nko/superpowers
```

## Commands

### `/browse` - Browser Automation

Capture screenshots and automate browser flows with Playwright.

```bash
# Capture desktop screenshot
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page screenshot
superpowers browse https://example.com --full-page

# Specific element
superpowers browse https://example.com --selector="#hero"

# Custom viewport
superpowers browse https://example.com --viewport=800x600
```

### `/qa` - Systematic Testing

Run tests based on code changes.

```bash
# Targeted mode (tests based on git diff)
superpowers qa --mode=targeted

# Smoke tests
superpowers qa --mode=smoke

# Full regression
superpowers qa --mode=full

# With coverage
superpowers qa --coverage

# Watch mode
superpowers qa --watch
```

### `/ship` - Release Pipeline

One-command release: version bump, changelog, tag, and GitHub release.

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
```

Requires `GH_TOKEN` environment variable for GitHub releases.

### `/plan-ceo-review` - BAT Framework

Product strategy review using Brand, Attention, Trust scoring.

```bash
# Auto-score based on description
superpowers ceo-review "Mobile App: User authentication flow"

# With manual scores
superpowers ceo-review "Premium API tier" --brand=5 --attention=4 --trust=5

# With business goal
superpowers ceo-review "AI-powered chat" --goal="Increase user engagement" --brand=4 --attention=5 --trust=3
```

**BAT Scoring (0-5 each):**
- **Brand**: Alignment with brand values and positioning
- **Attention**: Ability to capture and retain attention
- **Trust**: Builds user trust and credibility

**10-Star Methodology:**
- 10+ stars (2/3 categories ≥4): **Build**
- 6-9 stars: **Consider** with modifications
- <6 stars: **Don't build**

## Requirements

- Node.js 18+
- Git (for ship and qa commands)
- Playwright browsers (installed automatically)

## License

MIT
