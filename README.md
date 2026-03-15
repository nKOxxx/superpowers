# Superpowers for OpenClaw

AI-powered workflows for development, testing, and product decisions.

## Installation

```bash
npm install -g @nko/superpowers
```

## Skills

### `/browse` - Browser Automation
Visual testing and UI validation with Playwright.

```bash
superpowers browse https://example.com
superpowers browse https://example.com --viewport=mobile --full-page
```

### `/qa` - Systematic Testing
Acts as QA Lead to analyze code changes and run appropriate tests.

```bash
superpowers qa                    # Targeted mode (default)
superpowers qa --mode=smoke       # Quick validation
superpowers qa --mode=full        # Full regression
superpowers qa --coverage         # With coverage report
```

### `/ship` - Release Pipeline
One-command release: version bump, changelog, git tag, GitHub release.

```bash
superpowers ship --version=patch
superpowers ship --version=minor
superpowers ship --version=major
superpowers ship --version=1.2.3 --dry-run
```

### `/plan-ceo-review` - Product Strategy
BAT framework (Brand, Attention, Trust) for build decisions.

```bash
superpowers ceo-review --feature="AI feature" --goal="Reduce time 50%"
```

## Configuration

Create `superpowers.config.json` in your project root:

```json
{
  "browser": {
    "defaultViewport": "desktop",
    "screenshotDir": "./screenshots"
  },
  "qa": {
    "defaultMode": "targeted",
    "testCommand": "npm test"
  },
  "ship": {
    "requireCleanWorkingDir": true,
    "changelogPath": "CHANGELOG.md"
  }
}
```

## Requirements

- Node.js >= 18.0.0
- Git (for `/ship` and `/qa`)
- `GH_TOKEN` environment variable (for GitHub releases)

## License

MIT