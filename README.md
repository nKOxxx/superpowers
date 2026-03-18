# 🦸 OpenClaw Superpowers

Opinionated workflow skills for AI agents. A collection of TypeScript-based CLI tools for browser automation, systematic testing, release management, and product strategy.

[![npm version](https://img.shields.io/npm/v/@openclaw/superpowers.svg)](https://www.npmjs.com/package/@openclaw/superpowers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📦 Packages

| Package | Description | Install |
|---------|-------------|---------|
| `@openclaw/superpowers-browse` | Browser automation with Playwright | `npm i -g @openclaw/superpowers-browse` |
| `@openclaw/superpowers-qa` | Systematic testing & QA automation | `npm i -g @openclaw/superpowers-qa` |
| `@openclaw/superpowers-ship` | One-command release pipeline | `npm i -g @openclaw/superpowers-ship` |
| `@openclaw/superpowers-plan-ceo-review` | Product strategy with BAT framework | `npm i -g @openclaw/superpowers-plan-ceo-review` |

## 🚀 Quick Start

```bash
# Install all superpowers
npm install -g @openclaw/superpowers-cli

# Or install individual skills
npm install -g @openclaw/superpowers-browse
npm install -g @openclaw/superpowers-qa
npm install -g @openclaw/superpowers-ship
npm install -g @openclaw/superpowers-plan-ceo-review
```

## 🌐 /browse - Browser Automation

Visual testing and browser automation powered by Playwright.

```bash
# Screenshot a website
browse https://example.com

# Mobile viewport
browse https://example.com --viewport=mobile

# Multiple viewports for responsive testing
browse https://example.com --viewports=mobile,tablet,desktop

# Run configured flows
browse https://example.com --flows=critical,auth
```

### Features
- Full-page or element-specific screenshots
- Multiple viewport sizes (mobile, tablet, desktop, 4K)
- Flow-based user journey testing
- Telegram notifications

## 🧪 /qa - Systematic Testing

Acts as QA Lead to analyze changes and run appropriate tests.

```bash
# Targeted testing (default) - only changed files
qa

# Quick smoke tests
qa --mode=smoke

# Full regression suite
qa --mode=full

# With coverage
qa --coverage --threshold=80
```

### Modes
- **targeted**: Analyzes git diff and runs only relevant tests
- **smoke**: Quick validation of core functionality
- **full**: Complete regression test suite

## 🚀 /ship - Release Pipeline

One-command release: version bump, changelog, GitHub release.

```bash
# Patch release (bug fixes)
ship --bump=patch

# Minor release (new features)
ship --bump=minor

# Major release (breaking changes)
ship --bump=major

# Dry run to preview
ship --bump=minor --dry-run
```

### Features
- Semantic versioning
- Conventional commit changelog generation
- GitHub release creation
- Pre-release test execution
- Telegram notifications

## 📊 /plan-ceo-review - Product Strategy

BAT framework (Brand, Attention, Trust) + 10-star methodology for build decisions.

```bash
# Evaluate a feature
plan-ceo-review "AI Chat" --brand=5 --attention=5 --trust=3

# With business context
plan-ceo-review "Mobile App" \
  --goal="Increase engagement 50%" \
  --market="B2B SaaS" \
  --brand=4 --attention=5 --trust=4

# See example evaluations
plan-ceo-review --examples
```

### BAT Framework
Every feature is scored on 3 dimensions (0-5 stars each):

| Dimension | Question | Build Threshold |
|-----------|----------|-----------------|
| 🎨 **Brand** | Does this strengthen our brand? | 3+ stars |
| 👁 **Attention** | Will users actually use this? | 3+ stars |
| 🔐 **Trust** | Does this build user trust? | 3+ stars |

**10+ stars total = BUILD** (out of 15 maximum)

## ⚙️ Configuration

Create `superpowers.config.json` in your project root:

```json
{
  "browser": {
    "defaultViewport": "desktop",
    "viewports": {
      "mobile": { "width": 375, "height": 667 },
      "desktop": { "width": 1280, "height": 720 }
    },
    "flows": {
      "critical": ["/", "/about", "/pricing"]
    }
  },
  "qa": {
    "defaultMode": "targeted",
    "coverageThreshold": 80
  },
  "ship": {
    "requireCleanWorkingDir": true,
    "runTestsBeforeRelease": true
  },
  "ceoReview": {
    "minimumScore": 10
  },
  "telegram": {
    "enabled": true,
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "chatId": "${TELEGRAM_CHAT_ID}"
  }
}
```

## 🔧 Requirements

- Node.js >= 18.0.0
- Git (for /qa and /ship)
- Playwright browsers (for /browse) - installed automatically
- GH_TOKEN environment variable (for /ship GitHub releases)

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build in watch mode
npm run dev

# Run specific skill in dev mode
cd packages/browse && npm run dev
```

## 📁 Monorepo Structure

```
superpowers/
├── packages/
│   ├── cli/              # Main CLI entry point
│   ├── shared/           # Shared utilities
│   ├── browse/           # Browser automation
│   ├── qa/               # Systematic testing
│   ├── ship/             # Release pipeline
│   └── plan-ceo-review/  # Product strategy
├── skills/               # OpenClaw SKILL.md files
└── dist/                 # Compiled output
```

## 📝 License

MIT © OpenClaw
