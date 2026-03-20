# OpenClaw Superpowers

Opinionated workflow skills for AI agents. TypeScript implementation of the OpenClaw superpowers skill suite.

## Quick Reference

| Command | Purpose | Trigger |
|---------|---------|---------|
| `/browse` | Browser automation, screenshots, accessibility audits | screenshot, visual testing |
| `/qa` | Smart test selection, coverage analysis | run tests, test coverage |
| `/ship` | Version bump, changelog, GitHub release | release, publish |
| `/plan-ceo-review` | Strategic analysis with BAT framework | should we build, feature evaluation |

## Installation

```bash
# Install all skills
cd superpowers-ts
npm install
npm run build

# Link for global usage
npm link
```

## Individual Skills

### Browse

Browser automation with Playwright.

```bash
browse https://example.com --screenshot --audit
browse https://mysite.com --viewport 1920x1080 --compare baseline.png
```

### QA

Systematic testing with smart test selection.

```bash
qa --changed --coverage
qa --framework jest --grep "auth"
```

### Ship

One-command release pipeline.

```bash
ship patch --dry-run
ship minor --message "Feature release"
```

### Plan CEO Review

Product strategy evaluation with BAT framework.

```bash
plan-ceo-review "AI feature" --audience enterprise
plan-ceo-review "Mobile app" --build-vs-buy
plan-ceo-review compare "Feature A" "Feature B"
```

## Development

```bash
# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Architecture

```
superpowers-ts/
├── packages/
│   ├── browse/          # Browser automation (Playwright)
│   ├── qa/              # Testing framework integration
│   ├── ship/            # Release pipeline
│   └── plan-ceo-review/ # Product strategy (BAT framework)
├── package.json         # Workspace root
└── README.md
```

## Requirements

- Node.js >= 18.0.0
- Playwright browsers (installed via `npx playwright install`)
- Git
- GitHub CLI (optional, for releases)

## License

MIT
