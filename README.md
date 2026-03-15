# @nko/superpowers

OpenClaw Superpowers - AI-powered workflows for development, testing, and product decisions.

## Overview

This repository contains 4 TypeScript-based OpenClaw skills that provide powerful automation capabilities:

| Skill | Description | Package Size |
|-------|-------------|--------------|
| `/browse` | Browser automation with Playwright | ~46KB |
| `/qa` | Systematic testing as QA Lead | ~46KB |
| `/ship` | One-command release pipeline | ~46KB |
| `/plan-ceo-review` | Product strategy with BAT framework | ~46KB |

## Installation

```bash
npm install -g @nko/superpowers
```

Or install individual skills:

```bash
npm install -g superpowers-browse superpowers-qa superpowers-ship superpowers-plan-ceo-review
```

## Usage

### `/browse` - Browser Automation

Screenshot capture and browser automation using Playwright.

```bash
# Basic screenshot
browse https://example.com

# Mobile viewport
browse https://example.com --viewport=mobile

# Full page screenshot
browse https://example.com --full-page

# Custom viewport
browse https://example.com --width=1440 --height=900

# Element-specific screenshot
browse https://example.com --selector="#hero"

# With actions
browse https://example.com --actions='[{"type":"click","selector":"#btn"},{"type":"wait","duration":1000}]'
```

**Options:**
- `-v, --viewport <preset>` - Viewport preset (mobile, tablet, desktop)
- `-W, --width <number>` - Custom viewport width
- `-H, --height <number>` - Custom viewport height
- `-f, --full-page` - Capture full page screenshot
- `-s, --selector <selector>` - CSS selector for element-specific capture
- `-o, --output <path>` - Output file path (default: base64 to stdout)
- `-w, --wait <ms>` - Wait time after load (default: 1000ms)
- `--actions <json>` - JSON array of actions to perform

**Actions:**
- `click` - Click on element (requires `selector`)
- `type` - Type text (requires `selector` and `text`)
- `wait` - Wait duration (requires `duration` in ms)
- `scroll` - Scroll page (optional `x`, `y`)
- `hover` - Hover over element (requires `selector`)

### `/qa` - Systematic Testing

Auto-detects test framework and runs appropriate tests based on code changes.

```bash
# Run tests for changed files (default)
qa

# Full test suite
qa --mode=full

# Smoke tests only
qa --mode=smoke

# With coverage
qa --coverage

# Watch mode
qa --watch

# Update snapshots
qa --update
```

**Modes:**
- `targeted` (default) - Runs tests related to changed files since last commit
- `smoke` - Quick validation tests
- `full` - Complete test suite

**Supported Frameworks:**
- Vitest
- Jest
- Mocha

### `/ship` - Release Pipeline

One-command semantic versioning, changelog generation, and GitHub releases.

```bash
# Patch release (default)
ship

# Minor release
ship --version=minor

# Major release
ship --version=major

# Explicit version
ship --version=2.1.0

# Dry run (preview only)
ship --dry-run

# Skip GitHub release
ship --skip-release
```

**Features:**
- Semantic version bumping (patch, minor, major, or explicit)
- Conventional commit changelog generation
- Git tag creation
- GitHub release (requires `GH_TOKEN`)
- Dry-run preview mode

**Environment Variables:**
- `GH_TOKEN` or `GITHUB_TOKEN` - For GitHub release creation

### `/plan-ceo-review` - Product Strategy

BAT framework evaluation for product decisions using the 10-star methodology.

```bash
# Auto-calculate scores
plan-ceo-review "Feature Name: Feature description here"

# Manual scores
plan-ceo-review "BlackBox AI: AI-powered decision system" --brand=5 --attention=4 --trust=5

# JSON output
plan-ceo-review "Feature Name: Description" --json
```

**BAT Framework:**
- **Brand (0-5)** - Does it strengthen brand positioning?
- **Attention (0-5)** - Will it capture and retain user attention?
- **Trust (0-5)** - Does it build user trust?

**10-Star Methodology:**
- **Build** (≥10/15) - 2/3 criteria met, proceed with confidence
- **Consider** (7.5-10/15) - 1/3 criteria met, evaluate gaps
- **Don't Build** (<7.5/15) - Deprioritize or reject

## Tech Stack

- **TypeScript 5.3.3**
- **Node.js 18+**
- **Playwright** - Browser automation
- **Commander.js** - CLI framework
- **Chalk** - Terminal styling
- **Semver** - Version parsing

## Development

```bash
# Install dependencies
npm install

# Build all skills
npm run build

# Package all skills
npm run package

# Test
npm test
```

## Project Structure

```
superpowers/
├── browse/              # Browser automation skill
│   ├── src/
│   ├── dist/
│   ├── cli.js
│   ├── skill.json
│   └── package.json
├── qa/                  # Testing skill
├── ship/                # Release pipeline skill
├── plan-ceo-review/     # BAT framework skill
├── dist-skills/         # Packaged .skill.tar.gz files
├── package.json
└── tsconfig.json
```

## License

MIT

## Repository

https://github.com/nKOxxx/superpowers
