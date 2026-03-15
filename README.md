# OpenClaw Superpowers

AI-powered workflows for development, testing, and product decisions.

## Skills

### 🔍 `/browse` - Browser Automation

Powered by Playwright for screenshots, visual testing, and flow-based interactions.

```bash
# Basic screenshot
/browse https://example.com

# Mobile viewport
/browse https://example.com --viewport=mobile

# Full page screenshot
/browse https://example.com --full-page

# Flow-based testing
/browse https://example.com --flow='[
  { "action": "click", "selector": "#menu" },
  { "action": "wait", "ms": 500 },
  { "action": "click", "selector": "#item-1" }
]'
```

**Features:**
- Screenshots (single, full-page, element-specific)
- Viewport presets (mobile, tablet, desktop)
- Flow-based testing with actions: click, type, wait, scroll, hover
- Telegram integration with inline buttons

---

### 🧪 `/qa` - Systematic Testing

QA Lead mode with targeted, smoke, and full regression testing.

```bash
# Targeted mode (default) - analyze git diff, run relevant tests
/qa

# Smoke tests - quick validation
/qa --mode=smoke

# Full regression with coverage
/qa --mode=full --coverage
```

**Features:**
- Targeted mode: analyze git diff, run relevant tests
- Smoke mode: quick validation
- Full mode: complete regression suite
- Auto-detect vitest/jest/mocha
- Parse test results and report failures

---

### 🚀 `/ship` - One-Command Release

Semantic versioning, changelog generation, and GitHub releases.

```bash
# Patch release
/ship --version=patch

# Minor release with dry run
/ship --version=minor --dry-run

# Major release
/ship --version=major

# Beta prerelease
/ship --version=minor --prerelease=beta
```

**Features:**
- Semantic versioning (patch, minor, major)
- Conventional commit changelog generation
- Git tag + push
- GitHub release creation
- Dry-run mode

---

### 📊 `/plan-ceo-review` - BAT Framework

Product strategy review with Brand, Attention, Trust scoring.

```bash
# Basic review
/plan-ceo-review "Should we build a mobile app?"

# Interactive mode (Telegram)
/plan-ceo-review "Should we add AI features?"
```

**Features:**
- Brand, Attention, Trust scoring (0-5 each)
- 10-star methodology thresholds
- Build/consider/don't build recommendations
- Interactive questionnaire via Telegram

---

## Installation

```bash
cd /Users/ares/.openclaw/workspace/superpowers

# Install dependencies for all skills
for dir in browse qa ship plan-ceo-review; do
  cd $dir && npm install && cd ..
done

# Build all skills
for dir in browse qa ship plan-ceo-review; do
  cd $dir && npm run build && cd ..
done
```

## Configuration

### Environment Variables

```bash
# Browse
export BROWSE_DEFAULT_TIMEOUT=30000
export BROWSE_HEADLESS=true

# QA
export QA_DEFAULT_MODE=targeted
export QA_TIMEOUT=60000

# Ship
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
export SHIP_DEFAULT_BRANCH=main
export SHIP_CHANGELOG_FILE=CHANGELOG.md

# Plan CEO Review
export BAT_DEFAULT_INTERACTIVE=true
```

## OpenClaw Integration

Each skill follows the OpenClaw format:

```
skills/
├── browse/
│   ├── SKILL.md        # Documentation
│   ├── handler.ts      # Entry point
│   └── package.json    # Dependencies
├── qa/
│   └── ...
├── ship/
│   └── ...
└── plan-ceo-review/
    └── ...
```

## Development

```bash
# Run skill directly
node browse/dist/handler.js https://example.com

# With options
node browse/dist/handler.js https://example.com --viewport=mobile --full-page

# QA skill
node qa/dist/handler.js --mode=smoke

# Ship skill
node ship/dist/handler.js --version=patch --dry-run

# Plan CEO Review
node plan-ceo-review/dist/handler.js "Should we build X?"
```

## License

MIT
