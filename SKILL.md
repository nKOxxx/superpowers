# Superpowers Skill Collection

TypeScript-based skill pack for OpenClaw providing development workflow automation.

## Skills Included

1. **browse** - Browser automation with Playwright
2. **qa** - Systematic testing as QA Lead  
3. **ship** - One-command release pipeline
4. **plan-ceo-review** - BAT framework for product decisions

## Installation

```bash
npm install @nko/superpowers
```

## Usage

Each skill can be invoked via OpenClaw or CLI:

```bash
# Via OpenClaw
/browse https://example.com
/qa --mode=full
/ship --version=minor
/plan-ceo-review "Product Name: Description"

# Via CLI
npx @nko/superpowers browse https://example.com
npx @nko/superpowers qa --mode=full
npx @nko/superpowers ship --version=minor
npx @nko/superpowers plan-ceo-review "Product Name: Description"
```

## Configuration

No configuration required. Skills auto-detect:
- Package manager (npm/yarn/pnpm)
- Test framework (vitest/jest/mocha)
- Git repository state

## Environment Variables

| Variable | Skill | Description |
|----------|-------|-------------|
| `GH_TOKEN` | ship | GitHub token for release creation |
| `PLAYWRIGHT_BROWSERS_PATH` | browse | Custom browser path |

## Documentation

See individual skill directories for detailed documentation:
- `src/browse/README.md`
- `src/qa/README.md`
- `src/ship/README.md`
- `src/plan-ceo-review/README.md`

## Compatibility

- OpenClaw 0.9+
- Node.js 18+
- TypeScript 5.0+

## Kimi K2.5 Optimization

These skills are optimized for Kimi K2.5:
- Minimal context window usage
- Structured output formats
- Clear error messages
- No streaming required
