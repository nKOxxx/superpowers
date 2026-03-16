# 🦸 Superpowers

AI-powered workflows for development, testing, and product decisions. A suite of OpenClaw skills that bring superpowers to your development workflow.

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| **Browse** | `superpowers browse <url>` | Browser automation & screenshots with Playwright |
| **QA** | `superpowers qa` | Systematic testing as QA Lead |
| **Ship** | `superpowers ship <version>` | One-command release pipeline |
| **CEO Review** | `superpowers ceo-review` | Product strategy with BAT framework |

## Installation

```bash
npm install -g @nko/superpowers
```

## Requirements

- Node.js >= 18.0.0
- Git (for QA and Ship skills)
- Playwright browsers (auto-installed)

## Quick Start

```bash
# Screenshot a website
superpowers browse https://example.com

# Run targeted tests
superpowers qa

# Release a patch version
superpowers ship patch

# Evaluate a feature idea
superpowers ceo-review "AI assistant" "Automate support"
```

## Documentation

Each skill has its own documentation:

- [Browse](skills/browse/SKILL.md) - Browser automation
- [QA](skills/qa/SKILL.md) - Testing
- [Ship](skills/ship/SKILL.md) - Release pipeline
- [CEO Review](skills/plan-ceo-review/SKILL.md) - Product strategy

## OpenClaw Integration

These skills are designed for OpenClaw agents. The SKILL.md files in each skill directory follow the OpenClaw skill format and include metadata for automatic tool detection.

## License

MIT
