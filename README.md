# 🦞 Superpowers for OpenClaw

4 TypeScript skills for AI-powered development workflows.

## Skills

| Skill | Description | Command |
|-------|-------------|---------|
| `/browse` | Browser automation with Playwright | `browse <url> --viewport=mobile` |
| `/qa` | Systematic testing as QA Lead | `qa --mode=targeted --coverage` |
| `/ship` | One-command release pipeline | `ship --version=patch` |
| `/plan-ceo-review` | BAT framework product strategy | `plan-ceo-review "Feature" --brand=4` |

## Installation

```bash
npm install -g @nko/superpowers
```

Or install individual skills:

```bash
npm install -g @nko/browse-skill
npm install -g @nko/qa-skill
npm install -g @nko/ship-skill
npm install -g @nko/plan-ceo-review-skill
```

## Usage

### Browse - Browser Automation

```bash
# Screenshot a URL
browse https://example.com

# Mobile viewport
browse https://example.com --viewport=mobile

# With actions (click, type, wait)
browse https://example.com --actions="click:#btn,type:#input:hello,wait:1000"

# Full page screenshot
browse https://example.com --full-page
```

### QA - Testing

```bash
# Run tests based on git diff (default)
qa

# Smoke tests only
qa --mode=smoke

# Full test suite with coverage
qa --mode=full --coverage
```

Auto-detects: vitest → jest → mocha → npm test

### Ship - Release Pipeline

```bash
# Patch release (bug fixes)
ship --version=patch

# Minor release (features)
ship --version=minor

# Major release (breaking changes)
ship --version=major

# Dry run to preview
ship --version=minor --dry-run
```

Features:
- Semantic versioning
- Conventional commit changelog
- Git tag creation
- GitHub releases (with GH_TOKEN)

### Plan CEO Review - BAT Framework

```bash
# Interactive mode
plan-ceo-review "Feature Name"

# With explicit scores
plan-ceo-review "Feature Name" --brand=4 --attention=5 --trust=3

# With description
plan-ceo-review "Feature: Description here" --brand=5
```

**BAT Framework:**
- **Brand** (0-5): Does this strengthen our brand?
- **Attention** (0-5): Will users engage with this?
- **Trust** (0-5): Does this build user confidence?

**10-Star Methodology:**
- 12-15 stars → BUILD
- 8-11 stars → CONSIDER
- 0-7 stars → DON'T BUILD

## Development

```bash
# Install dependencies
npm install

# Build all skills
npm run build

# Package for distribution
npm run package
```

## OpenClaw Integration

Install skills to OpenClaw:

```bash
openclaw skills install browse
openclaw skills install qa
openclaw skills install ship
openclaw skills install plan-ceo-review
```

## License

MIT

## Author

nKO - https://github.com/nKOxxx