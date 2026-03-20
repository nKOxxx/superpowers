# OpenClaw Superpowers 🦾

A collection of TypeScript skills for OpenClaw AI agents, designed for the Kimi K2.5 model.

## Skills

| Command | Skill | Description |
|---------|-------|-------------|
| `/browse` | Browser Automation | Visual testing with Playwright, screenshots, and accessibility audits |
| `/qa` | Systematic Testing | Smart test selection, coverage analysis for Jest/Vitest/Mocha/pytest |
| `/ship` | Release Pipeline | Semantic versioning, changelog generation, GitHub releases |
| `/plan-ceo-review` | Product Strategy | BAT framework (Brand, Attention, Trust) + 10-star methodology |

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Build all skills
npm run build

# Run all tests
npm test
```

## Individual Skills

### Browse (`/browse`)

Browser automation with Playwright for visual testing and accessibility audits.

```bash
# Navigate and screenshot
browse https://example.com --screenshot --mobile

# Accessibility audit
browse https://example.com --audit --viewport 1920x1080

# Visual regression testing
browse https://staging.com --screenshot --compare baseline.png
```

### QA (`/qa`)

Smart test selection with automatic framework detection.

```bash
# Run all tests
qa

# Run only changed tests
qa --changed

# Coverage report
qa --coverage
```

### Ship (`/ship`)

One-command release pipeline.

```bash
# Release patch version
ship patch

# Dry run preview
ship minor --dry-run

# Skip npm publish
ship major --no-publish
```

### Plan CEO Review (`/plan-ceo-review`)

Product strategy evaluation with BAT framework.

```bash
# Review a feature
plan-ceo-review "AI-powered search"

# Build vs buy analysis
plan-ceo-review "Notifications" --build-vs-buy

# Compare features
plan-ceo-review "Feature A" --compare "Feature B"
```

## BAT Framework

Evaluates product opportunities across three dimensions:

| Dimension | Question | Range |
|-----------|----------|-------|
| **Brand** | Does this strengthen our brand? | 0-5 |
| **Attention** | Will users actually use this? | 0-5 |
| **Trust** | Does this build user trust? | 0-5 |

**Scoring:**
- **12-15**: BUILD - Strong signal, prioritize
- **10-11**: BUILD - Good signal, proceed
- **8-9**: CONSIDER - Mixed signal, needs refinement
- **0-7**: DON'T BUILD - Weak signal, reconsider

## 10-Star Methodology

Inspired by Brian Chesky (Airbnb CEO):

| Rating | Description |
|--------|-------------|
| 1★ | Works (barely) |
| 3★ | Meets basic needs |
| 5★ | Meets expectations |
| 7★ | Great - exceeds expectations |
| 10★ | Transforms the category |

## Architecture

```
superpowers/
├── shared/              # Shared utilities and types
│   └── src/
│       ├── index.ts     # Core types, Logger, execAsync
│       └── telegram.ts  # Telegram formatting utilities
├── browse/              # Browser automation skill
├── qa/                  # Testing skill
├── ship/                # Release pipeline skill
└── plan-ceo-review/     # Product strategy skill
```

## Development

```bash
# Watch mode for all skills
npm run watch

# Lint
npm run lint

# Clean
npm run clean
```

## Telegram Integration

All skills include Telegram formatting utilities for optimal display:

```typescript
import { TelegramFormatter } from '@openclaw/superpowers-shared';

// Format results for Telegram
const message = TelegramFormatter.formatQaResult(testResults);
// Returns: { text: "...", parse_mode: "Markdown", media?: [...] }
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.3.0
- Playwright (for browse skill)
- Git (for ship skill)

## License

MIT
