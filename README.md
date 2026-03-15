# 🦞 Superpowers for OpenClaw

A 4-pack of TypeScript skills for OpenClaw - browser automation, testing, releases, and product strategy.

## Skills

### `/browse` - Browser Automation
Visual testing and QA with Playwright.
```bash
/browse https://example.com --viewport mobile --full-page
/browse https://example.com --selector "#hero" --actions '[{"type":"click","selector":"#menu"}]'
```

### `/qa` - Systematic Testing
Analyzes code changes and runs appropriate tests.
```bash
/qa --mode targeted      # Auto-detect changes (default)
/qa --mode smoke         # Quick validation
/qa --mode full          # Complete regression
```

### `/ship` - Release Pipeline
One-command versioning, changelog, and GitHub releases.
```bash
/ship --version patch    # Bug fixes
/ship --version minor    # New features
/ship --version major    # Breaking changes
/ship --dry-run          # Preview only
```

### `/plan-ceo-review` - BAT Framework
Product strategy review using Brand, Attention, Trust scoring.
```bash
/plan-ceo-review "Add AI voice assistant"
/plan-ceo-review "Build a referral program"
```

## Installation

```bash
# Clone and install
git clone https://github.com/nKOxxx/superpowers.git
cd superpowers
npm install

# Build all skills
npm run build
```

## Requirements

- Node.js 18+
- Playwright (for /browse)
- Git + GitHub CLI (for /ship)
- Vitest/Jest/Mocha project (for /qa)

## Architecture

Each skill is self-contained with:
- `SKILL.md` - Documentation
- `src/index.ts` - Implementation
- `dist/` - Compiled output

## License

MIT
