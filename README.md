# Superpowers for OpenClaw

AI-driven development workflows. Four TypeScript skills for the OpenClaw ecosystem.

## Skills

| Skill | Command | Description | Size |
|-------|---------|-------------|------|
| **Browse** | `/browse <url>` | Browser automation with Playwright | ~5KB |
| **QA** | `/qa [--mode=targeted]` | Systematic testing as QA Lead | ~6KB |
| **Ship** | `/ship [--version=patch]` | One-command release pipeline | ~7KB |
| **CEO Review** | `/plan-ceo-review "desc"` | BAT framework for product decisions | ~8KB |

## Quick Start

```bash
# Install
npm install @nko/superpowers

# Or use directly
npx @nko/superpowers <command>
```

## Browse

Browser automation for visual testing and QA.

```bash
# Screenshot a page
/browse https://example.com

# Mobile viewport, full page
/browse https://example.com --viewport=mobile --full-page

# Flow-based testing
/browse https://example.com --actions='[
  {"kind":"click","selector":"#login"},
  {"kind":"type","selector":"#email","text":"user@example.com"},
  {"kind":"click","selector":"#submit"},
  {"kind":"wait","ms":1000}
]'
```

**Actions:** click, type, wait, scroll, hover, screenshot

## QA

Systematic testing with mode-based execution.

```bash
# Targeted - test only changed files (default)
/qa --mode=targeted

# Smoke - quick validation
/qa --mode=smoke

# Full - complete regression
/qa --mode=full --coverage
```

**Auto-detects:** vitest, jest, mocha

## Ship

Release pipeline with semantic versioning.

```bash
# Patch release (default)
/ship

# Minor release
/ship --version=minor

# Dry run
/ship --version=major --dry-run

# Skip tests (not recommended)
/ship --skip-tests
```

**Features:**
- Conventional commit changelog generation
- Git tag + push
- GitHub release creation (requires GH_TOKEN)

## CEO Review

BAT framework for build/don't-build decisions.

```bash
# Auto-score based on description
/plan-ceo-review "MoltStamp: API key escrow service for AI-to-AI collaboration"

# Manual scoring
/plan-ceo-review "Product X" --brand=4 --attention=5 --trust=3
```

**BAT Framework:**
- **Brand** (0-5): Alignment with core identity
- **Attention** (0-5): Market demand capture
- **Trust** (0-5): Delivery capability

**Scoring:**
- 10+ stars: ✅ BUILD
- 7-9 stars: ⚠️ CONSIDER  
- <7 stars: ❌ DON'T BUILD

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Package skills for distribution
npm run package:skills

# Test
npm test
```

## Installation as OpenClaw Skills

Copy `.skill` files to your OpenClaw skills directory:

```bash
cp dist-skills/*.skill ~/.openclaw/skills/
```

Or reference directly in OpenClaw config:

```json
{
  "skills": [
    { "name": "browse", "path": "./dist-skills/browse.skill" },
    { "name": "qa", "path": "./dist-skills/qa.skill" },
    { "name": "ship", "path": "./dist-skills/ship.skill" },
    { "name": "plan-ceo-review", "path": "./dist-skills/plan-ceo-review.skill" }
  ]
}
```

## Requirements

- Node.js 18+
- Playwright (for /browse)
- Git (for /ship)
- Vitest/Jest/Mocha (for /qa)

## License

MIT

## Author

Nikola Kolev (@nKOxxx)
