# @nko/superpowers

OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions.

## Installation

```bash
npm install -g @nko/superpowers
```

## Skills

### `/browse` - Browser Automation

Capture screenshots and automate browser interactions with Playwright.

```bash
# Screenshot a website
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page screenshot
superpowers browse https://example.com --full-page

# Screenshot specific element
superpowers browse https://example.com --selector="#hero"

# Save to file
superpowers browse https://example.com --output=screenshot.png
```

**Viewports:** `mobile` (375x667), `tablet` (768x1024), `desktop` (1920x1080), or custom `WxH`

### `/qa` - Systematic Testing

Run tests intelligently as a QA Lead.

```bash
# Targeted - run tests for changed files only
superpowers qa --mode=targeted

# Smoke tests - quick validation
superpowers qa --mode=smoke

# Full regression suite
superpowers qa --mode=full

# With coverage
superpowers qa --coverage
```

**Auto-detects:** vitest, jest, mocha

### `/ship` - Release Pipeline

One-command release with versioning, changelog, and GitHub releases.

```bash
# Auto-detect version bump from commits
superpowers ship

# Explicit version bump
superpowers ship --version=patch
superpowers ship --version=minor
superpowers ship --version=major

# Dry run (preview only)
superpowers ship --dry-run

# Skip GitHub release
superpowers ship --skip-github-release
```

**Requirements:** `GH_TOKEN` env var for GitHub releases

### `/plan-ceo-review` - Product Strategy

BAT framework for product decisions (Brand, Attention, Trust).

```bash
# Auto-score a feature
superpowers plan-ceo-review "Dark Mode: Allow users to switch to dark theme" --auto-score

# Manual scoring
superpowers plan-ceo-review "AI Assistant: Chat-based help" --brand=4 --attention=5 --trust=3

# JSON output
superpowers plan-ceo-review "New Feature: Description" --auto-score --json
```

**Scoring:** 0-5 for each dimension, 10+ stars total = build recommendation

## BAT Framework

Evaluates features on three dimensions:

| Dimension | Question | Score |
|-----------|----------|-------|
| **Brand** | Does this strengthen our brand? | 0-5 |
| **Attention** | Will this capture market attention? | 0-5 |
| **Trust** | Can we execute this well? | 0-5 |

**Thresholds:**
- **12-15 stars:** Build it
- **8-11 stars:** Consider with caveats
- **0-7 stars:** Don't build

## OpenClaw Integration

These skills are packaged for OpenClaw. Install as skill packages:

```bash
# Each skill is packaged in dist-skills/
openclaw skills install ./dist-skills/browse.skill.tar.gz
openclaw skills install ./dist-skills/qa.skill.tar.gz
openclaw skills install ./dist-skills/ship.skill.tar.gz
openclaw skills install ./dist-skills/plan-ceo-review.skill.tar.gz
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Package skills
npm run package:skills

# Run tests
npm test
```

## Requirements

- Node.js 18+
- Playwright (for /browse)
- Git (for /ship)
- GH_TOKEN environment variable (for GitHub releases)

## License

MIT