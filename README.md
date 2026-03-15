# 🦞 Superpowers for OpenClaw

AI-powered workflows for development, testing, and product decisions.

## Overview

Superpowers is a collection of TypeScript-based skills for OpenClaw that provide opinionated workflows inspired by [gstack](https://github.com/print) conceived by Garry Tan.

## Skills

### `/browse` - Browser Automation

Visual testing and browser automation using Playwright.

```bash
superpowers browse https://example.com
superpowers browse https://example.com --viewport=mobile
superpowers browse https://example.com --flows=critical,auth
```

**Features:**
- Screenshot capture (single URL, full page, element-specific)
- Multiple viewport presets (mobile, tablet, desktop)
- Flow-based testing (sequence of page navigations)
- Custom actions (click, type, wait, scroll, hover)

### `/qa` - Systematic Testing

Acts as QA Lead to analyze changes and run systematic tests.

```bash
superpowers qa              # Run targeted tests
superpowers qa --mode=smoke # Quick smoke tests
superpowers qa --mode=full  # Full regression suite
```

**Features:**
- Targeted mode: Analyzes git diff and runs relevant tests
- Smoke mode: Quick validation of core functionality
- Full mode: Complete regression test suite
- Coverage reporting

### `/ship` - Release Pipeline

One-command release: version bump, changelog, GitHub release.

```bash
superpowers ship --version=patch
superpowers ship --version=minor --dry-run
superpowers ship --version=1.2.3 --notes="Hotfix release"
```

**Features:**
- Semantic versioning (patch, minor, major, explicit)
- Conventional commit changelog generation
- Git tag creation and push
- GitHub release creation
- Dry-run preview mode

### `/plan-ceo-review` - Product Strategy

BAT framework + 10-star methodology for build decisions.

```bash
superpowers ceo-review --feature="AI code review"
superpowers ceo-review --feature="mobile app" --goal="increase engagement 50%"
```

**Features:**
- BAT framework scoring (Brand, Attention, Trust)
- 10-star methodology thresholds
- Build/consider/don't build recommendations
- Next steps generation

## Installation

```bash
npm install
npm run build
```

## Usage with OpenClaw

Add to your OpenClaw skills directory:

```bash
ln -s $(pwd)/skills ~/.openclaw/workspace/skills/superpowers
```

## Configuration

Create a `superpowers.config.json` file:

```json
{
  "browser": {
    "defaultViewport": "desktop",
    "screenshotDir": "./screenshots",
    "viewports": {
      "custom": { "width": 1440, "height": 900 }
    },
    "flows": {
      "critical": [
        { "name": "Homepage", "url": "/" },
        { "name": "About", "url": "/about" }
      ]
    }
  },
  "qa": {
    "defaultMode": "targeted",
    "testCommand": "npm test",
    "coverageThreshold": 80
  },
  "ship": {
    "requireCleanWorkingDir": true,
    "runTestsBeforeRelease": true,
    "changelogPath": "CHANGELOG.md"
  }
}
```

## Environment Variables

- `GH_TOKEN` - GitHub personal access token (for `/ship`)
- `BROWSE_HEADLESS` - Set to `false` to see browser (for `/browse`)

## Requirements

- Node.js >= 18.0.0
- Playwright browsers installed (`npx playwright install`)

## License

MIT
