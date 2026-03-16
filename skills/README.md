# Superpowers 🦸

OpenClaw superpowers - TypeScript skill collection for browser automation, QA testing, release management, and product strategy.

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| **browse** | `superpowers browse <url>` | Browser automation with Playwright - screenshots, UI testing, flow validation |
| **qa** | `superpowers qa` | Systematic testing - targeted, smoke, and full test modes |
| **ship** | `superpowers ship <version>` | One-command release pipeline - version bump, changelog, GitHub release |
| **plan-ceo-review** | `superpowers ceo-review <feature>` | Product strategy using BAT framework (Brand, Attention, Trust) |

## Installation

```bash
npm install -g @nko/superpowers
```

## Quick Start

```bash
# Screenshot a website
superpowers browse https://example.com --viewport=mobile

# Run targeted tests
superpowers qa --mode=targeted

# Release a new version
superpowers ship patch

# Evaluate a feature idea
superpowers ceo-review "AI assistant" --audience="Developers"
```

## Requirements

- Node.js >= 18.0.0
- Git (for qa and ship skills)
- Playwright browsers (installed automatically)

## Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `GH_TOKEN` | ship | GitHub personal access token |
| `TELEGRAM_BOT_TOKEN` | ship | Telegram bot token for notifications |
| `TELEGRAM_CHAT_ID` | ship | Telegram chat ID for notifications |

## BAT Framework

The CEO Review skill uses the BAT framework for product decisions:

- **Brand** (0-5): Does this strengthen our brand?
- **Attention** (0-5): Will users actually use this?
- **Trust** (0-5): Does this build user trust?

**Scoring:**
- 12-15 ⭐: BUILD - Strong signal
- 10-11 ⭐: BUILD - Good signal
- 8-9 ⭐: CONSIDER - Mixed signal
- 0-7 ⭐: DON'T BUILD - Weak signal

## License

MIT
