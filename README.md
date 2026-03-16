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

Or install individual skills:

```bash
npm install -g @nko/superpowers-browse
npm install -g @nko/superpowers-qa
npm install -g @nko/superpowers-ship
npm install -g @nko/superpowers-ceo-review
```

## Requirements

- Node.js >= 18.0.0
- Git (for QA and Ship skills)
- Playwright browsers (auto-installed for Browse skill)

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

## Skills Documentation

### Browse - Browser Automation

Visual testing and browser automation using Playwright.

```bash
# Basic screenshot
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page screenshot
superpowers browse https://example.com --full-page

# With actions
superpowers browse https://example.com --actions='[{"type":"click","selector":".btn"}]'
```

**Features:**
- Multiple viewport presets (mobile, tablet, desktop, wide)
- Full page or element-specific screenshots
- Action sequences (click, type, wait, scroll, hover)
- Base64 output for Telegram integration

### QA - Systematic Testing

Intelligent test execution based on code changes.

```bash
# Run tests based on git diff (default)
superpowers qa

# Smoke tests only
superpowers qa --mode=smoke

# Full test suite
superpowers qa --mode=full

# With coverage
superpowers qa --coverage
```

**Features:**
- Auto-detects test framework (vitest, jest, mocha)
- Three modes: targeted, smoke, full
- Coverage reporting support
- Test file mapping from source changes

### Ship - Release Pipeline

One-command semantic versioning and release management.

```bash
# Patch release (bug fixes)
superpowers ship patch

# Minor release (features)
superpowers ship minor

# Major release (breaking changes)
superpowers ship major

# Explicit version
superpowers ship 1.2.3

# Dry run (preview only)
superpowers ship patch --dry-run
```

**Features:**
- Semantic versioning (patch, minor, major, explicit)
- Conventional commit changelog generation
- Git tag creation and push
- GitHub release creation (via GH_TOKEN)
- Telegram notifications (optional)
- Dry-run preview mode

**Environment Variables:**
- `GH_TOKEN` - GitHub personal access token for releases
- `TELEGRAM_BOT_TOKEN` - Telegram bot token for notifications
- `TELEGRAM_CHAT_ID` - Telegram chat ID for notifications

### CEO Review - Product Strategy

Strategic product evaluation using the BAT framework.

```bash
# Evaluate a feature
superpowers ceo-review "Mobile App: Native iOS and Android apps"

# With explicit scores
superpowers ceo-review "Dark Mode" --brand=3 --attention=5 --trust=2

# JSON output
superpowers ceo-review "Feature Name" --json
```

**BAT Framework:**
- **Brand** (0-5): Does this strengthen our brand?
- **Attention** (0-5): Will users actually use this?
- **Trust** (0-5): Does this build user trust?

**10-Star Methodology:**
- 12-15 ⭐ BUILD - Strong signal
- 10-11 ⭐ BUILD - Good signal
- 8-9 ⭐ CONSIDER - Mixed signal
- 0-7 ⭐ DON'T BUILD - Weak signal

## OpenClaw Integration

These skills are designed for OpenClaw agents. The SKILL.md files in each skill directory follow the OpenClaw skill format and include metadata for automatic tool detection.

### Skill Metadata

Each skill includes OpenClaw-compatible metadata:

```yaml
metadata:
  openclaw:
    requires:
      bins: ["node", "npx", "git"]
      npm: ["@nko/superpowers"]
    primaryEnv: GH_TOKEN
    modelCompatibility: ["kimi-k2.5", "claude-opus-4", "gpt-4"]
    skillType: "typescript"
    entryPoint: "dist/index.js"
```

## Development

```bash
# Clone the repository
git clone https://github.com/nKOxxx/superpowers.git
cd superpowers

# Install dependencies
npm install

# Build all skills
npm run build

# Package skills for distribution
npm run package
```

## Skill Structure

Each skill is a self-contained TypeScript package:

```
skills/<name>/
├── src/
│   └── index.ts          # Main implementation
├── dist/                 # Compiled output
├── cli.js                # CLI entry point
├── skill.json            # Skill metadata
├── SKILL.md              # OpenClaw skill documentation
├── package.json
└── tsconfig.json
```

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines and submit PRs.

## Credits

Built for OpenClaw - AI-powered development workflows.
