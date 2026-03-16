# 🦸 OpenClaw Superpowers

Opinionated workflow skills for AI agents. Based on Garry Tan's gstack philosophy, adapted for OpenClaw.

## Installation

```bash
# Install all superpowers globally
npm install -g @openclaw/superpowers

# Or install individually
npm install -g @openclaw/superpowers-browse
npm install -g @openclaw/superpowers-qa
npm install -g @openclaw/superpowers-ship
npm install -g @openclaw/superpowers-plan-ceo-review
```

## Superpowers

### 🌐 /browse - Browser Automation
Visual testing and browser automation powered by Playwright.

```bash
# Basic screenshot
browse https://example.com

# Multiple viewports
browse https://example.com --viewports=mobile,tablet,desktop

# Test critical flows
browse https://example.com --flows=critical,auth
```

### 🧪 /qa - Systematic Testing
Smart test selection and execution as a QA Lead.

```bash
# Targeted tests (based on git diff)
qa

# Quick smoke tests
qa --mode=smoke

# Full regression suite
qa --mode=full

# With coverage
qa --mode=full --coverage
```

### 🚀 /ship - Release Pipeline
One-command release: version bump, changelog, GitHub release.

```bash
# Patch release (bug fixes)
ship --version=patch

# Minor release (new features)
ship --version=minor

# Dry run
ship --version=patch --dry-run
```

### 📊 /plan-ceo-review - Product Strategy
BAT framework (Brand, Attention, Trust) for build decisions.

```bash
# Evaluate feature
plan-ceo-review "AI Chat Feature" --brand=4 --attention=5 --trust=4

# With context
plan-ceo-review "Mobile App" \
  --goal="Increase engagement 50%" \
  --market="B2B SaaS" \
  --brand=5 --attention=5 --trust=3

# See examples
plan-ceo-review --examples
```

## Configuration

Create a `superpowers.config.json` in your project root:

```json
{
  "browser": {
    "viewports": {
      "mobile": { "width": 375, "height": 667 },
      "desktop": { "width": 1280, "height": 720 }
    },
    "flows": {
      "critical": ["/", "/pricing", "/contact"]
    }
  },
  "qa": {
    "coverageThreshold": 80,
    "testCommand": "npm test"
  },
  "ship": {
    "requireCleanWorkingDir": true,
    "runTestsBeforeRelease": true
  },
  "telegram": {
    "enabled": true,
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "chatId": "${TELEGRAM_CHAT_ID}"
  }
}
```

See `superpowers.config.json.example` for full configuration options.

## BAT Framework

Every feature is scored on 3 dimensions (0-5 stars each):

| Dimension | Description | Examples |
|-----------|-------------|----------|
| **Brand** | Does it strengthen our brand? | 5⭐ = Iconic (Face ID), 3⭐ = Expected (OAuth) |
| **Attention** | Will users actually use this? | 5⭐ = Daily use, 1⭐ = Never used |
| **Trust** | Does this build user trust? | 5⭐ = Critical security, 1⭐ = Dark patterns |

**Scoring:**
- **12-15 ⭐**: BUILD - High priority
- **10-11 ⭐**: BUILD - Proceed with confidence
- **8-9 ⭐**: CONSIDER - Gather more data
- **0-7 ⭐**: DON'T BUILD - Focus elsewhere

## Environment Variables

```bash
# GitHub releases
export GH_TOKEN=ghp_xxx

# Telegram notifications
export TELEGRAM_BOT_TOKEN=xxx
export TELEGRAM_CHAT_ID=xxx
```

## OpenClaw Integration

These skills are designed to work seamlessly with OpenClaw. Trigger them via:

- `/browse <url>` - Screenshot and visual testing
- `/qa` - Run tests intelligently
- `/ship --version=patch` - Create release
- `/plan-ceo-review "Feature Name"` - Product strategy review

## License

MIT

---

**Made for OpenClaw** | [GitHub](https://github.com/nKOxxx/superpowers)
