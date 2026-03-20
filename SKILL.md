---
name: Superpowers Repo
version: 1.0.0
description: A collection of 4 powerful OpenClaw skills for browser automation, testing, shipping, and product strategy
author: OpenClaw
tags: [automation, testing, release, strategy, devtools]
---

# Superpowers Repo

A curated collection of 4 essential skills that give your development workflow superpowers. Each skill is self-contained, well-documented, and designed to work seamlessly with OpenClaw.

## The Four Superpowers

### 1. 🌐 browse - Browser Automation Skill
**When to use:** Visual testing, accessibility audits, screenshot capture, visual regression testing

The browse skill provides comprehensive browser automation using Playwright. It can:
- Capture screenshots at multiple viewports (mobile, tablet, desktop, 4K)
- Run accessibility audits with axe-core
- Perform visual regression testing
- Send notifications via Telegram

**Quick start:**
```bash
# Screenshot all viewports
/browse --url https://example.com --screenshots

# Accessibility audit
/browse --url https://example.com --accessibility

# Visual regression test
/browse --url https://example.com --baseline --compare
```

---

### 2. 🧪 qa - Systematic Testing Skill
**When to use:** Running tests, detecting frameworks, smart test selection, coverage analysis

The qa skill automatically detects your project's test framework and runs tests intelligently. It can:
- Auto-detect test frameworks (Vitest, Jest, Mocha, Playwright, pytest, Cargo, Go test)
- Select tests based on code changes (changed files, git diff)
- Run specific test patterns
- Analyze test coverage

**Quick start:**
```bash
# Auto-detect and run all tests
/qa

# Run tests for changed files only
/qa --changed

# Run specific test pattern
/qa --pattern "auth"

# Coverage report
/qa --coverage
```

---

### 3. 🚀 ship - Release Pipeline Skill
**When to use:** Version bumping, changelog generation, GitHub releases, npm publishing

The ship skill automates your release workflow with semantic versioning. It can:
- Bump versions (patch/minor/major or specific version)
- Generate changelogs from conventional commits
- Create GitHub releases
- Publish to npm
- Run in dry-run mode for safety

**Quick start:**
```bash
# Dry run to see what would happen
/ship --bump patch --dry-run

# Actually ship a patch release
/ship --bump patch

# Ship minor with custom message
/ship --bump minor --message "New features release"

# Ship specific version
/ship --version 2.1.0
```

---

### 4. 🎯 plan-ceo-review - Product Strategy Skill
**When to use:** Evaluating build vs buy decisions, product strategy, partnership decisions

The plan-ceo-review skill provides structured frameworks for product decisions. It can:
- Apply BAT framework scoring (Brand, Attention, Trust)
- Use 10-star methodology for build vs buy decisions
- Compare multiple options (build/buy/partner)
- Generate executive-ready strategy evaluations

**Quick start:**
```bash
# Evaluate build vs buy for a feature
/plan-ceo-review "auth-system" --options build,buy,partner

# Run BAT framework analysis
/plan-ceo-review --bat --topic "new-market-entry"

# Full strategy evaluation
/plan-ceo-review --evaluate --topic "data-pipeline" --criteria cost,time,risk
```

---

## Skill Selection Guide

| Task | Skill | Command |
|------|-------|---------|
| Need screenshots of your app? | browse | `/browse --screenshots` |
| Accessibility audit? | browse | `/browse --accessibility` |
| Run tests? | qa | `/qa` |
| Tests for changed code only? | qa | `/qa --changed` |
| Release new version? | ship | `/ship --bump patch` |
| Generate changelog? | ship | `/ship --changelog-only` |
| Build vs buy decision? | plan-ceo-review | `/plan-ceo-review "Question"` |
| Strategic evaluation? | plan-ceo-review | `/plan-ceo-review --evaluate` |

## Installation

```bash
# Clone the skills
git clone https://github.com/nKOxxx/superpowers.git /path/to/skills

# Install dependencies for all skills
cd /path/to/skills && npm install

# Or install per-skill
cd browse && npm install
cd ../qa && npm install
cd ../ship && npm install
cd ../plan-ceo-review && npm install
```

## Dependencies

All skills require:
- Node.js 18+
- OpenClaw CLI

Individual skills may require:
- **browse**: Playwright, axe-core
- **qa**: Framework-specific tools (vitest, jest, etc.)
- **ship**: GitHub CLI (gh), npm CLI
- **plan-ceo-review**: No external dependencies

## Configuration

Each skill supports configuration via:
1. Command-line arguments
2. Environment variables
3. `.openclawrc` or `openclaw.config.js` files
4. Project-specific config files

See individual skill documentation for details.

## Contributing

To add a new superpower:
1. Create a new directory under `src/skills/`
2. Follow the SKILL.md format with YAML frontmatter
3. Include scripts/ directory with TypeScript implementations
4. Update this root SKILL.md

---

**Version:** 1.0.0  
**License:** MIT  
**Maintained by:** OpenClaw Community
