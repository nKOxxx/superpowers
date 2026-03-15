# Superpowers for OpenClaw

4 TypeScript skills for AI-powered development workflows:

- **`/browse`** - Browser automation with Playwright
- **`/qa`** - Systematic testing as QA Lead
- **`/ship`** - One-command release pipeline
- **`/plan-ceo-review`** - Product strategy with BAT framework

## Installation

```bash
npm install -g @nko/superpowers
```

## Usage

### Browser Automation

```bash
# Screenshot a website
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page screenshot
superpowers browse https://example.com --full-page

# Custom actions
superpowers browse https://example.com --actions="click:.btn,wait:1000,screenshot"
```

### QA Testing

```bash
# Targeted tests (based on git diff)
superpowers qa

# Smoke tests
superpowers qa --mode=smoke

# Full test suite
superpowers qa --mode=full

# With coverage
superpowers qa --coverage
```

### Release Pipeline

```bash
# Release patch version
superpowers ship --version=patch

# Release minor version
superpowers ship --version=minor

# Dry run
superpowers ship --version=patch --dry-run
```

### Product Strategy (BAT Framework)

```bash
# Evaluate a feature
superpowers ceo-review --feature="AI code review"

# With full context
superpowers ceo-review \
  --feature="mobile app" \
  --goal="Increase engagement 50%" \
  --audience="Power users"

# Manual scoring
superpowers ceo-review \
  --feature="feature name" \
  --brand=5 \
  --attention=4 \
  --trust=3
```

## BAT Framework

**10-Star Methodology:**
- **12-15 ⭐** - BUILD
- **10-11 ⭐** - BUILD (validate first)
- **8-9 ⭐** - CONSIDER
- **0-7 ⭐** - DON'T BUILD

**Dimensions (0-5 each):**
- **Brand** - Strengthens differentiation?
- **Attention** - Users will actually use?
- **Trust** - Builds user trust?

## Requirements

- Node.js >= 18.0.0
- Git (for ship and qa skills)
- GH_TOKEN env var (for GitHub releases)

## License

MIT
