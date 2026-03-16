# OpenClaw Superpowers

TypeScript skill collection for OpenClaw - browser automation, QA testing, release management, and product strategy.

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| browse | `browse <url>` | Browser automation with Playwright - screenshots, UI testing, flow validation |
| qa | `qa` | Systematic testing - targeted, smoke, and full test modes |
| ship | `ship <version>` | One-command release pipeline - version bump, changelog, GitHub release |
| plan-ceo-review | `plan-ceo-review <feature>` | Product strategy using BAT framework (Brand, Attention, Trust) |

## Installation

```bash
npm install -g @nko/superpowers
```

## Quick Start

```bash
# Screenshot a website
browse screenshot https://example.com --viewport=mobile

# Run targeted tests
qa run --mode=targeted

# Release a new version
ship release patch

# Evaluate a feature idea
plan-ceo-review review "AI assistant" --audience="Developers"
```

## Individual Skills

### browse - Browser Automation

Powered by Playwright. Take screenshots, test URLs, interact with UI elements, and validate web flows.

```bash
# Take a screenshot
browse screenshot https://example.com

# Test a URL
browse test-url https://example.com --expect-text "Welcome"

# Run a flow
browse flow ./login-flow.json
```

### qa - Systematic Testing

QA Lead intelligence. Automatically analyzes code changes and runs appropriate tests.

```bash
# Analyze and run targeted tests
qa run

# Run smoke tests
qa run --mode=smoke

# Run with coverage
qa run --mode=full --coverage
```

### ship - Release Pipeline

One-command releases with semantic versioning, changelog generation, and GitHub/npm publishing.

```bash
# Release patch version
ship release patch

# Dry run to preview
ship release minor --dry-run

# Check status
ship status
```

### plan-ceo-review - Product Strategy

BAT framework and 10-star methodology for product decisions.

```bash
# Review a feature
plan-ceo-review review "Mobile app" --audience="developers"

# Compare features
plan-ceo-review compare "Feature A" "Feature B"

# Learn the framework
plan-ceo-review framework
```

## Requirements

- Node.js >= 18.0.0
- Git (for qa and ship skills)
- Playwright browsers (installed automatically)

## Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| GH_TOKEN | ship | GitHub personal access token |
| NPM_TOKEN | ship | npm authentication token |
| TELEGRAM_BOT_TOKEN | ship | Telegram bot token |
| TELEGRAM_CHAT_ID | ship | Telegram chat ID |

## BAT Framework

The CEO Review skill uses the BAT framework for product decisions:

- **Brand** (0-5): Does this strengthen our brand?
- **Attention** (0-5): Will users actually use this?
- **Trust** (0-5): Does this build user trust?

Scoring:
- 12-15 ⭐: **BUILD** - Strong signal
- 10-11 ⭐: **BUILD** - Good signal
- 8-9 ⭐: **CONSIDER** - Mixed signal
- 0-7 ⭐: **DON'T BUILD** - Weak signal

## Development

```bash
# Install dependencies
npm install

# Build all skills
npm run build

# Test all skills
npm test

# Package skills for distribution
npm run package:all
```

## License

MIT
