# OpenClaw Superpowers 🦸

TypeScript skills for OpenClaw providing browser automation, systematic testing, release pipelines, and product strategy reviews.

## Installation

```bash
# Clone the repository
git clone https://github.com/nKOxxx/superpowers.git
cd superpowers

# Install dependencies
pnpm install

# Install Playwright browsers (for /browse)
npx playwright install chromium
```

## Quick Start

### /browse - Browser Automation

```bash
# Take a screenshot
pnpm browse https://example.com

# Mobile viewport
pnpm browse https://example.com --viewport=mobile

# Responsive screenshots at all sizes
pnpm browse https://example.com --responsive

# Run flow tests
pnpm browse https://example.com --flows=critical,auth
```

### /qa - Systematic Testing

```bash
# Analyze changes and run targeted tests
pnpm qa

# Run smoke tests only
pnpm qa --mode=smoke

# Full regression suite
pnpm qa --mode=full

# Dry run - see what would be tested
pnpm qa --dry-run
```

### /ship - Release Pipeline

```bash
# Dry run first
pnpm ship --repo=owner/repo --version=patch --dry-run

# Release patch version
pnpm ship --repo=owner/repo --version=patch

# Release minor version with custom notes
pnpm ship --repo=owner/repo --version=minor --notes="New features..."

# Skip tests (emergency only)
pnpm ship --repo=owner/repo --version=patch --skip-tests
```

### /plan-ceo-review - Product Strategy

```bash
# Interactive mode
pnpm plan-ceo-review --interactive

# Quick evaluation
pnpm plan-ceo-review "Dark Mode" \
  --goal="Reduce eye strain" \
  --brand=3 \
  --attention=4 \
  --trust=3

# With market context
pnpm plan-ceo-review "AI Chat" \
  --goal="Reduce support tickets" \
  --market="SaaS support" \
  --brand=5 \
  --attention=4 \
  --trust=3 \
  --feasibility
```

## Configuration

Create `superpowers.config.json` in your project root:

```json
{
  "browser": {
    "defaultViewport": "desktop",
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
    "testCommand": "npm test"
  },
  "ship": {
    "requireCleanWorkingDir": true,
    "runTestsBeforeRelease": true,
    "github": {
      "defaultOrg": "your-org"
    }
  },
  "ceoReview": {
    "minimumScore": 10,
    "autoGenerateNextSteps": true
  }
}
```

## Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `GH_TOKEN` | `/ship` | GitHub personal access token |
| `TELEGRAM_BOT_TOKEN` | `/ship` | Telegram bot token (optional) |
| `TELEGRAM_CHAT_ID` | `/ship` | Telegram chat ID (optional) |
| `PLAYWRIGHT_BROWSERS_PATH` | `/browse` | Custom browser path (optional) |

## Skills Reference

### /browse

Browser automation and visual testing using Playwright.

**Features:**
- Screenshot capture (full page or element)
- Multiple viewport sizes
- Flow testing (multi-page journeys)
- Responsive comparison reports

**Documentation:** [playwright-config.md](references/playwright-config.md)

### /qa

Smart test selection based on code changes.

**Features:**
- Git diff analysis
- Automatic test mapping
- Coverage checking
- Three modes: targeted, smoke, full

**Documentation:** [testing-patterns.md](references/testing-patterns.md)

### /ship

One-command release pipeline.

**Features:**
- Semantic versioning
- Changelog generation
- GitHub release creation
- Telegram notifications
- Safety checks

**Documentation:** [release-checklist.md](references/release-checklist.md)

### /plan-ceo-review

Product strategy using BAT framework.

**Features:**
- Brand/Attention/Trust scoring
- 10-star methodology
- Feasibility analysis
- Next steps generation

**Documentation:** [bat-framework.md](references/bat-framework.md)

## Development

```bash
# Build TypeScript
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## Project Structure

```
superpowers/
├── scripts/
│   ├── browse.ts              # /browse skill
│   ├── qa.ts                  # /qa skill
│   ├── ship.ts                # /ship skill
│   ├── plan-ceo-review.ts     # /plan-ceo-review skill
│   └── lib/
│       ├── config.ts          # Configuration loader
│       ├── screenshot.ts      # Screenshot utilities
│       ├── flows.ts           # Flow execution
│       ├── analyzer.ts        # Code change analyzer
│       ├── test-runner.ts     # Test execution
│       ├── version.ts         # Version management
│       ├── changelog.ts       # Changelog generation
│       ├── github.ts          # GitHub API integration
│       ├── bat-scoring.ts     # BAT framework
│       └── market-analysis.ts # Market analysis
├── references/                 # Documentation
├── tests/                      # Unit tests
├── package.json
├── tsconfig.json
└── superpowers.config.json
```

## Requirements

- Node.js 18+
- pnpm 8+
- Git
- GitHub CLI (optional, for /ship)

## License

MIT

## Contributing

Contributions welcome! Please read our [contributing guide](CONTRIBUTING.md) first.

## Support

- Issues: https://github.com/nKOxxx/superpowers/issues
- Discussions: https://github.com/nKOxxx/superpowers/discussions
