# superpowers

OpenClaw superpowers - opinionated workflow skills for AI agents.

## Available Skills

### /browse
Browser automation for visual testing, QA, and web scraping with Playwright.

**Capabilities:**
- Screenshot capture (full page, elements, viewports)
- Visual regression testing
- Accessibility auditing
- Mobile/tablet emulation
- PDF generation
- Telegram integration

**Usage:**
```
/browse https://example.com --screenshot
/browse https://example.com --mobile --dark --accessibility
/browse https://example.com --compare ./baseline.png --telegram
```

### /qa
Systematic testing based on code changes - intelligent test selection and coverage analysis.

**Capabilities:**
- Diff-based test selection
- Auto-detect test runners (jest, vitest, mocha)
- Coverage analysis
- Intelligent test file mapping
- Telegram notifications

**Usage:**
```
/qa --diff HEAD~1
/qa --diff main --coverage --selective
/qa --diff HEAD~5 --test-runner vitest --telegram
```

### /ship
One-command release pipeline - version bump, changelog, and GitHub release.

**Capabilities:**
- Semantic version bumping
- Changelog generation from conventional commits
- GitHub release creation
- Telegram notifications
- Dry-run mode

**Usage:**
```
/ship patch
/ship minor --message "New features landing"
/ship major --dry-run
/ship 2.1.0 --telegram
```

### /plan-ceo-review
Product strategy evaluation using BAT framework (Brand, Attention, Trust) and 10-star methodology.

**Capabilities:**
- BAT framework scoring
- 10-star methodology analysis
- Build vs buy evaluation
- Structured recommendations
- Telegram integration

**Usage:**
```
/plan-ceo-review "Should we build our own auth system?"
/plan-ceo-review "Build vs buy CRM" --build "6mo, 2eng" --buy "$50k/yr"
/plan-ceo-review "Launch mobile app" --output strategy.md --telegram
```

## Installation

```bash
cd skills/superpowers
npm install
npm run build
```

## Requirements

- Node.js 18+
- Playwright (for /browse)
- Git (for /qa and /ship)
- GitHub CLI (for /ship GitHub releases)

## Configuration

Skills automatically integrate with OpenClaw's messaging for Telegram notifications when `--telegram` flag is used.

## License

MIT
