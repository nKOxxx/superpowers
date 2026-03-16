---
name: superpowers
description: OpenClaw superpowers - opinionated workflow skills for AI agents. Includes /browse (browser automation), /qa (systematic testing), /ship (release pipeline), and /plan-ceo-review (product strategy with BAT framework). Use for web testing, QA automation, releases, and product decisions.
user-invocable: true
metadata:
  { "openclaw": { 
    "requires": { "bins": ["node", "npm", "git"], "npm": ["@nko/superpowers"] },
    "primaryEnv": "GH_TOKEN"
  } }
---

# Superpowers - Opinionated Workflow Skills

AI-powered workflows for development, testing, and product decisions.

## Available Skills

### 1. /browse - Browser Automation
Visual testing and QA with Playwright.

```bash
superpowers browse https://example.com
superpowers browse https://example.com --viewport=mobile
superpowers browse https://app.com --flows=critical,auth
```

**Use when:** Testing web apps, capturing screenshots, validating UI flows
**See:** `skills/browse/SKILL.md`

### 2. /qa - Systematic Testing
QA Lead that analyzes changes and runs appropriate tests.

```bash
superpowers qa                          # Targeted tests (default)
superpowers qa --mode=smoke            # Quick validation
superpowers qa --mode=full             # Full regression
```

**Use when:** Code testing, quality assurance, regression testing
**See:** `skills/qa/SKILL.md`

### 3. /ship - Release Pipeline
One-command release: version bump, changelog, GitHub release.

```bash
superpowers ship --version=patch
superpowers ship --version=minor --dry-run
superpowers ship --version=1.2.0
```

**Use when:** Releasing new versions, publishing packages
**See:** `skills/ship/SKILL.md`

### 4. /plan-ceo-review - Product Strategy
BAT framework (Brand, Attention, Trust) for build decisions.

```bash
superpowers ceo-review "Should we build X?"
superpowers ceo-review --feature="mobile app" --goal="increase engagement"
```

**Use when:** Feature evaluation, product decisions, prioritization
**See:** `skills/plan-ceo-review/SKILL.md`

## Installation

```bash
npm install -g @nko/superpowers
```

Or use directly with npx:
```bash
npx @nko/superpowers browse https://example.com
```

## Configuration

Create `superpowers.config.json` in your project root:

```json
{
  "browser": {
    "defaultViewport": "desktop",
    "screenshotDir": "./screenshots",
    "viewports": {
      "mobile": { "width": 375, "height": 667 },
      "tablet": { "width": 768, "height": 1024 },
      "desktop": { "width": 1280, "height": 720 }
    },
    "flows": {
      "critical": ["/", "/about", "/contact"],
      "auth": ["/login", "/dashboard", "/profile"]
    }
  },
  "qa": {
    "defaultMode": "targeted",
    "coverageThreshold": 80,
    "testCommand": "npm test",
    "testPatterns": {
      "unit": ["**/*.test.ts", "**/*.spec.ts"],
      "integration": ["**/*.integration.test.ts"],
      "e2e": ["**/e2e/**/*.spec.ts"]
    }
  },
  "ship": {
    "requireCleanWorkingDir": true,
    "runTestsBeforeRelease": true,
    "testCommand": "npm test",
    "changelog": {
      "preset": "conventional",
      "includeContributors": true
    },
    "github": {
      "defaultOrg": "nKOxxx"
    },
    "telegram": {
      "notifyOnShip": true
    }
  },
  "ceoReview": {
    "minimumScore": 10,
    "requireAllBAT": false,
    "autoGenerateNextSteps": true,
    "marketAnalysis": true
  }
}
```

## Requirements

- Node.js >= 18.0.0
- Git (for /qa and /ship)
- Playwright browsers (for /browse) - installed automatically
- GH_TOKEN environment variable (for /ship GitHub releases)

## Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `GH_TOKEN` | /ship | GitHub personal access token with `repo` scope |
| `PLAYWRIGHT_BROWSERS_PATH` | /browse | Custom browser installation path |
| `SCREENSHOT_DIR` | /browse | Default screenshot output directory |

## Quick Reference

| Task | Command |
|------|---------|
| Screenshot a URL | `superpowers browse <url>` |
| Test recent changes | `superpowers qa` |
| Release patch version | `superpowers ship --version=patch` |
| Evaluate feature idea | `superpowers ceo-review "<question>"` |

## Architecture

```
superpowers/
├── src/
│   ├── skills/          # Core skill implementations
│   │   ├── browse.ts    # Browser automation
│   │   ├── qa.ts        # Testing logic
│   │   ├── ship.ts      # Release pipeline
│   │   └── plan-ceo-review.ts  # BAT framework
│   ├── lib/             # Shared utilities
│   │   ├── config.ts    # Configuration loading
│   │   ├── git.ts       # Git operations
│   │   ├── github.ts    # GitHub API
│   │   ├── telegram.ts  # Telegram notifications
│   │   └── format.ts    # Output formatting
│   └── cli.ts           # Command-line interface
├── skills/              # OpenClaw SKILL.md files
│   ├── browse/
│   ├── qa/
│   ├── ship/
│   └── plan-ceo-review/
└── dist/                # Compiled JavaScript
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in dev mode
npm run dev browse https://example.com

# Run tests
npm test
```

## License

MIT
