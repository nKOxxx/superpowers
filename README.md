# @nko/superpowers

OpenClaw Superpowers - AI-powered workflows for development, testing, and product decisions.

## Skills

### `/browse` - Browser Automation
Capture screenshots with Playwright-powered browser automation.

```bash
superpowers browse https://example.com --viewport=mobile
superpowers browse https://example.com --full-page
superpowers browse https://example.com --selector="#hero"
```

**Features:**
- Viewport presets (mobile, tablet, desktop)
- Full page or element-specific screenshots
- Action sequences (click, type, wait, scroll, hover)
- Base64 output for Telegram integration

### `/qa` - Systematic Testing
Auto-detects test frameworks and runs relevant tests.

```bash
superpowers qa --mode=targeted    # Run tests for changed files
superpowers qa --mode=smoke       # Quick smoke tests
superpowers qa --mode=full        # Full test suite
superpowers qa --coverage         # With coverage report
```

**Supported frameworks:** Vitest, Jest, Mocha

### `/ship` - Release Pipeline
One-command release with versioning, changelog, and GitHub release.

```bash
superpowers ship --version=patch     # Bump patch version
superpowers ship --version=minor     # Bump minor version
superpowers ship --version=major     # Bump major version
superpowers ship --dry-run           # Preview changes
```

**Features:**
- Semantic versioning
- Conventional commit changelog
- Git tag creation
- GitHub release (via GH_TOKEN)

### `/plan-ceo-review` - Product Strategy
BAT framework evaluation for product decisions.

```bash
superpowers plan-ceo-review "Feature Name" --brand=4 --attention=5 --trust=3
superpowers plan-ceo-review "Feature Name" --auto
```

**BAT Framework:**
- **Brand** (0-5): Alignment with brand identity
- **Attention** (0-5): Virality/growth potential
- **Trust** (0-5): User trust building

**Scoring:**
- 10+ stars: Build
- 8-9 stars: Consider/Validate
- <8 stars: Don't build

## Installation

```bash
npm install -g @nko/superpowers
```

## Requirements

- Node.js 18+
- Playwright (installed automatically)
- GH_TOKEN environment variable (for GitHub releases)

## OpenClaw Integration

These skills are designed for OpenClaw. Install them:

```bash
openclaw skill install dist-skills/browse.skill
openclaw skill install dist-skills/qa.skill
openclaw skill install dist-skills/ship.skill
openclaw skill install dist-skills/plan-ceo-review.skill
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Package skills
npm run package

# Test
npm test
```

## License

MIT
