# @nko/superpowers

OpenClaw superpowers - AI-powered workflows for development, testing, and product decisions.

## Installation

```bash
npm install -g @nko/superpowers
```

## Skills

### `/browse` - Browser Automation

Playwright-based screenshot capture with viewport presets, action sequences, and full-page support.

```bash
# Screenshot with desktop viewport
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport mobile

# Custom dimensions
superpowers browse https://example.com --width 1200 --height 800

# Full page screenshot
superpowers browse https://example.com --full-page

# Capture specific element
superpowers browse https://example.com --selector "#header"

# Action sequence: click, type, wait, scroll, hover, press
superpowers browse https://example.com \
  --action "click:#login,type:#username:john,wait:1000,press:Enter"

# Save to file
superpowers browse https://example.com --output ./screenshot.png
```

**Options:**
- `-v, --viewport` - Viewport preset: mobile (375x667), tablet (768x1024), desktop (1920x1080)
- `-w, --width` - Custom viewport width
- `-h, --height` - Custom viewport height
- `-f, --full-page` - Capture full page screenshot
- `-s, --selector` - Capture specific element only
- `-o, --output` - Save screenshot to file path
- `-t, --timeout` - Navigation timeout in ms (default: 30000)
- `-a, --action` - Action sequence (comma-separated)

---

### `/qa` - Systematic Testing

Auto-detects test framework and runs targeted, smoke, or full regression tests.

```bash
# Run targeted tests (based on git diff)
superpowers qa

# Run smoke tests
superpowers qa --mode smoke

# Full regression
superpowers qa --mode full

# With coverage
superpowers qa --coverage

# Detect framework only
superpowers qa --detect

# Show git diff analysis
superpowers qa --diff
```

**Modes:**
- `targeted` - Analyze git diff, run only relevant tests
- `smoke` - Quick validation suite
- `full` - Complete regression

**Options:**
- `-m, --mode` - Test mode (targeted/smoke/full)
- `-c, --coverage` - Enable coverage reporting
- `-v, --verbose` - Verbose output
- `-u, --update-snapshot` - Update snapshots

---

### `/ship` - Release Pipeline

Semantic versioning with conventional commit changelog generation and GitHub releases.

```bash
# Auto-detect version bump from commits
superpowers ship

# Explicit bump
superpowers ship patch
superpowers ship minor
superpowers ship major

# Explicit version
superpowers ship 1.2.3

# Analyze commits without releasing
superpowers ship --analyze

# Dry run (preview changes)
superpowers ship --dry-run

# With GitHub release (requires GH_TOKEN env var)
superpowers ship --repo owner/repo
```

**Options:**
- `-r, --repo` - GitHub repository (owner/repo)
- `-b, --branch` - Target branch
- `--dry-run` - Preview changes without applying
- `--skip-changelog` - Skip changelog generation
- `--skip-github` - Skip GitHub release
- `--skip-tag` - Skip git tag creation
- `--analyze` - Analyze commits and suggest version bump

---

### `/plan-ceo-review` - BAT Framework

Product strategy review with Brand, Attention, Trust scoring.

```bash
# Manual scoring
superpowers plan-ceo-review "Feature: AI-powered summaries" \
  --brand=4 --attention=5 --trust=3

# Auto-calculate scores
superpowers plan-ceo-review "Feature: AI-powered summaries" --auto

# With context for auto-scoring
superpowers plan-ceo-review "Feature: AI-powered summaries" \
  --auto --context "Uses GPT-4 for document summarization"

# Show scoring criteria
superpowers plan-ceo-review --criteria

# JSON output
superpowers plan-ceo-review "Feature name" --json
```

**BAT Scoring (0-5 each):**
- **Brand**: Does it strengthen our brand identity?
- **Attention**: Will it capture and hold user attention?
- **Trust**: Does it build trust with users?

**Thresholds:**
- 12-15 stars: STRONG SIGNAL → Build
- 8-11 stars: MIXED → Consider carefully
- 0-7 stars: WEAK → Don't build

---

## Development

```bash
# Install dependencies
npm install

# Build all skills
npm run build

# Package skills
npm run package
```

## License

MIT
