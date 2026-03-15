# @nko/superpowers

OpenClaw superpowers skills - Browser automation, QA testing, Release pipeline, and BAT framework.

## Skills

### `/browse` - Browser Automation
Playwright-based screenshot capture and UI testing.

```bash
# Capture screenshot
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page capture
superpowers browse https://example.com --full-page

# Action sequence
superpowers browse https://example.com --actions="click:#btn,wait:1000,type:#input=hello"
```

**Features:**
- Viewport presets (mobile, tablet, desktop)
- Custom viewport dimensions
- Action sequences (click, type, wait, scroll, hover, press)
- Full-page or element-specific captures
- Base64 output for Telegram

---

### `/qa` - Systematic Testing
Auto-detect test framework and run appropriate tests.

```bash
# Run tests for changed files only
superpowers qa --mode=targeted

# Quick smoke tests
superpowers qa --mode=smoke

# Full regression suite
superpowers qa --mode=full --coverage
```

**Modes:**
- `targeted`: Analyze git diff, run only relevant tests
- `smoke`: Quick validation (tags: smoke, basic, sanity)
- `full`: Complete regression suite

**Frameworks:** Vitest, Jest, Mocha (auto-detected)

---

### `/ship` - Release Pipeline
One-command semantic versioning and release.

```bash
# Patch release
superpowers ship patch

# Minor release with dry-run
superpowers ship minor --dry-run

# Explicit version
superpowers ship 1.2.3

# Skip GitHub release
superpowers ship patch --skip-release
```

**Features:**
- Semantic versioning (patch, minor, major, explicit)
- Conventional commit changelog generation
- Git tag creation and push
- GitHub release creation (requires GH_TOKEN)
- Dry-run preview mode

---

### `/plan-ceo-review` - Product Strategy
BAT framework for product decisions.

```bash
# Auto-score based on description
superpowers plan-ceo-review "AI-powered code review with social sharing" --auto

# Manual scoring
superpowers plan-ceo-review "Feature Name" --brand=4 --attention=5 --trust=3

# JSON output
superpowers plan-ceo-review "Idea" --auto --output=json
```

**BAT Framework:**
- **Brand (0-5)**: Differentiation, uniqueness, positioning
- **Attention (0-5)**: Viral potential, shareability, growth mechanics
- **Trust (0-5)**: Security, transparency, credibility

**10-Star Methodology:**
- 8-10 stars: BUILD (strong across all dimensions)
- 6-7 stars: CONSIDER (gaps exist, refine before committing)
- 0-5 stars: DON'T BUILD (significant concerns)

Minimum threshold: 2/3 dimensions above 3/5 to proceed.

---

## Installation

```bash
npm install -g @nko/superpowers
```

## Requirements

- Node.js 18+
- For `/browse`: Playwright browsers (`npx playwright install`)
- For `/ship`: GitHub token in `GH_TOKEN` env var (optional)

## License

MIT