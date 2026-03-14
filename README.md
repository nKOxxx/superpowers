# Superpowers for OpenClaw

AI-powered workflows for development, testing, and product decisions.

## Skills

### `/browse` - Browser Automation

Visual testing with Playwright. Screenshots, flow testing, and QA reports.

```bash
/browse https://example.com
/browse https://example.com --viewport=mobile --flows=critical,auth
```

**Features:**
- Screenshot capture (full page or viewport)
- Multi-viewport testing (mobile, tablet, desktop)
- Automated flow testing
- Visual regression support

[Browse Skill Docs →](browse/SKILL.md)

### `/qa` - Systematic Testing

Acts as QA Lead. Analyzes code changes and runs appropriate tests.

```bash
/qa                          # Targeted tests for recent changes
/qa --mode=smoke            # Quick smoke tests
/qa --mode=full             # Full regression suite
```

**Features:**
- Smart test selection based on git diff
- Three testing modes: targeted, smoke, full
- Coverage reporting
- Multi-framework support (Vitest, Jest, Playwright)

[QA Skill Docs →](qa/SKILL.md)

### `/ship` - Release Pipeline

One-command releases. Version bump, changelog, GitHub release.

```bash
/ship --repo=nKOxxx/app --version=patch
/ship --repo=nKOxxx/app --version=minor --notes="New feature"
/ship --repo=nKOxxx/app --version=1.2.0 --dry-run
```

**Features:**
- Semantic versioning
- Automatic changelog generation
- GitHub release creation
- Telegram notifications
- Safety checks (clean working directory, passing tests)

[Ship Skill Docs →](ship/SKILL.md)

### `/plan-ceo-review` - Product Strategy

BAT framework + 10-star product methodology for build decisions.

```bash
/plan-ceo-review "Should we add Telegram notifications?"
/plan-ceo-review --feature="mobile app" --goal="increase engagement 50%"
```

**Features:**
- BAT (Brand, Attention, Trust) scoring
- 10-star product methodology
- Market analysis
- Build/don't build recommendations
- Next steps generation

[CEO Review Skill Docs →](plan-ceo-review/SKILL.md)

## Installation

```bash
cd skills/superpowers
./install.sh
```

Requirements:
- Node.js 18+
- Git
- Playwright browsers (auto-installed)

## Configuration

Edit `superpowers.config.json`:

```json
{
  "browser": {
    "flows": {
      "critical": ["/", "/about", "/contact"],
      "auth": ["/login", "/dashboard"]
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
  "github": {
    "defaultOrg": "nKOxxx"
  },
  "telegram": {
    "notifyOnShip": true
  }
}
```

## Environment Variables

```bash
# Required for /ship
export GH_TOKEN=ghp_your_github_token

# Optional - for Telegram notifications
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_CHAT_ID=your_chat_id
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run dev

# Run tests
npm test
```

## Project Structure

```
superpowers/
├── browse/                    # Browser automation skill
│   ├── SKILL.md
│   ├── scripts/
│   │   ├── browse.ts
│   │   └── lib/
│   └── references/
├── qa/                        # Testing skill
│   ├── SKILL.md
│   ├── scripts/
│   └── references/
├── ship/                      # Release pipeline skill
│   ├── SKILL.md
│   ├── scripts/
│   └── references/
├── plan-ceo-review/           # Product strategy skill
│   ├── SKILL.md
│   ├── scripts/
│   └── references/
├── package.json
├── tsconfig.json
└── superpowers.config.json
```

## BAT Framework

The BAT framework evaluates features on three dimensions:

| Dimension | Question | Weight |
|-----------|----------|--------|
| **Brand** | Does this strengthen our brand? | 0-5 stars |
| **Attention** | Will users actually use this? | 0-5 stars |
| **Trust** | Does this build user trust? | 0-5 stars |

**10+ stars = BUILD**

Minimum 2/3 dimensions must be positive.

See [BAT Framework Guide](plan-ceo-review/references/bat-framework.md) for details.

## License

MIT

## Credits

Adapted from Garry Tan's gstack methodology for AI-powered development workflows.
