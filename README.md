# Superpowers

OpenClaw superpowers - opinionated workflow skills for AI agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Skills

| Skill | Description | Command |
|-------|-------------|---------|
| **browse** | Browser automation with Playwright for visual testing and accessibility audits | `/browse` |
| **qa** | Systematic testing with smart test selection and coverage analysis | `/qa` |
| **ship** | Release pipeline for semantic versioning, changelogs, and publishing | `/ship` |
| **plan-ceo-review** | Product strategy evaluation using BAT framework and 10-star methodology | `/plan-ceo-review` |

## Quick Start

### Installation

```bash
# Install all skills globally
npm install -g @openclaw/skill-browse @openclaw/skill-qa @openclaw/skill-ship @openclaw/skill-plan-ceo-review

# Or install from skill files
openclaw skills install browse.skill
openclaw skills install qa.skill
openclaw skills install ship.skill
openclaw skills install plan-ceo-review.skill
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/nKOxxx/superpowers.git
cd superpowers

# Install dependencies
npm run install:all

# Build all skills
npm run build

# Run tests
npm test
```

## Usage

### Browse Skill

Browser automation for visual testing, accessibility audits, and page navigation.

```bash
# Basic navigation with screenshot
browse https://example.com --screenshot

# Accessibility audit
browse https://example.com --audit --screenshot

# Visual regression testing
browse https://staging.com --screenshot --compare baseline.png

# Mobile emulation
browse https://mobile.app --mobile --dark-mode --screenshot
```

**Features:**
- Screenshot capture (full page or viewport)
- Accessibility audits with axe-core
- Visual regression testing with pixelmatch
- Mobile device emulation
- Dark mode support
- Multiple browser support (Chromium, Firefox, WebKit)

### QA Skill

Smart test runner with framework detection and coverage analysis.

```bash
# Run all tests with auto-detected framework
qa

# Run tests only for changed files
qa --changed

# Generate coverage report
qa --coverage

# Run specific test file
qa --file src/utils.test.ts
```

**Supported Frameworks:**
- Jest
- Vitest
- Mocha
- pytest

**Features:**
- Automatic framework detection
- Smart test selection based on changed files
- Coverage threshold enforcement
- Parallel test execution

### Ship Skill

Release pipeline with semantic versioning and changelog generation.

```bash
# Preview a patch release
ship patch --dry-run

# Perform a minor release
ship minor

# Skip npm publish
ship patch --no-publish

# Custom release message
ship minor --message "feat: new feature release"
```

**Features:**
- Semantic versioning (patch/minor/major)
- Automatic changelog generation from conventional commits
- GitHub release creation
- npm publishing
- Dry-run mode for testing

### Plan CEO Review Skill

Strategic product analysis using the BAT framework and 10-star methodology.

```bash
# Evaluate a feature
plan-ceo-review "AI-powered search"

# Include build vs buy analysis
plan-ceo-review "Mobile app" --build-vs-buy

# Compare two features
plan-ceo-review "Feature A" --compare "Feature B"

# Specify target audience
plan-ceo-review "Enterprise API" --audience=enterprise
```

**BAT Framework:**
- **Brand**: Does this strengthen our brand? (0-5)
- **Attention**: Will users actually use this? (0-5)
- **Trust**: Does this build user trust? (0-5)

**10-Star Methodology:**
- Problem-solution fit
- Usability
- Delight
- Feasibility
- Viability

## Architecture

```
superpowers/
├── shared/              # Shared utilities and types
├── browse/              # Browser automation skill
├── qa/                  # Testing skill
├── ship/                # Release pipeline skill
├── plan-ceo-review/     # Product strategy skill
└── dist-skills/         # Compiled skill packages
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.3.0
- Playwright (for browse skill)

## Kimi K2.5 Compatibility

These skills are designed to be compatible with Kimi K2.5:
- Clean TypeScript interfaces
- Comprehensive error handling
- Detailed logging
- Type-safe implementations

## Telegram Integration

Skills can send results to Telegram when integrated with OpenClaw's messaging system:

```typescript
import { sendTelegramMessage } from '@openclaw/superpowers-shared';

// In your skill implementation
await sendTelegramMessage({
  chatId: process.env.TELEGRAM_CHAT_ID,
  text: `QA Results: ${result.passedTests}/${result.totalTests} passed`
});
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- Issues: [GitHub Issues](https://github.com/nKOxxx/superpowers/issues)
- Discussions: [GitHub Discussions](https://github.com/nKOxxx/superpowers/discussions)
