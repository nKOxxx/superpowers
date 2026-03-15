# @nko/superpowers

AI-powered workflows for development, testing, and product decisions. A collection of 4 TypeScript OpenClaw superpowers skills.

## Installation

```bash
npm install -g @nko/superpowers
```

Or run directly with npx:

```bash
npx @nko/superpowers <command>
```

## Skills

### 1. `/browse` - Browser Automation

Browser automation with Playwright for visual testing and QA.

```bash
# Take a screenshot of a website
superpowers browse https://example.com

# Mobile viewport
superpowers browse https://example.com --viewport=mobile

# Full page screenshot
superpowers browse https://example.com --full-page

# Capture specific element
superpowers browse https://example.com --element="#header"

# Custom viewport dimensions
superpowers browse https://example.com --width=1440 --height=900

# Action sequence (click, type, wait, scroll, hover)
superpowers browse https://example.com --actions='[
  {"type": "click", "selector": "#menu"},
  {"type": "wait", "delay": 1000},
  {"type": "scroll", "y": 500}
]'

# Output as base64 for Telegram
superpowers browse https://example.com --base64
```

**Options:**
- `-f, --full-page` - Capture full page screenshot
- `-e, --element <selector>` - Capture specific element
- `-v, --viewport <preset>` - Viewport preset: mobile (375x667), tablet (768x1024), desktop (1920x1080)
- `-w, --width <pixels>` - Custom viewport width
- `--height <pixels>` - Custom viewport height
- `-a, --actions <json>` - Action sequence as JSON array
- `--wait-for <selector>` - Wait for element before screenshot
- `--base64` - Output as base64 for Telegram
- `-o, --output <path>` - Output file path
- `--timeout <ms>` - Timeout in milliseconds (default: 30000)

### 2. `/qa` - Systematic Testing

Auto-detects test framework and runs systematic testing as a QA Lead.

```bash
# Targeted testing (based on git diff) - default
superpowers qa

# Run all tests
superpowers qa --mode=full

# Run smoke tests only
superpowers qa --mode=smoke

# With coverage
superpowers qa --coverage

# Specify framework
superpowers qa --framework=vitest

# CI mode (non-interactive)
superpowers qa --ci
```

**Options:**
- `-m, --mode <mode>` - Test mode: targeted, smoke, full (default: targeted)
- `-c, --coverage` - Enable coverage reporting
- `-f, --framework <framework>` - Test framework: vitest, jest, mocha
- `--ci` - CI mode (non-interactive)
- `--watch` - Watch mode

### 3. `/ship` - One-Command Release Pipeline

Semantic versioning, changelog generation, git tags, and GitHub releases.

```bash
# Release patch version (default)
superpowers ship

# Release minor version
superpowers ship --version=minor

# Release major version
superpowers ship --version=major

# Explicit version
superpowers ship --version=1.2.3

# Dry run (preview changes)
superpowers ship --dry-run

# Skip GitHub release
superpowers ship --no-release

# Specify repository for GitHub release
superpowers ship --repo=owner/repo
```

**Environment Variables:**
- `GH_TOKEN` or `GITHUB_TOKEN` - Required for GitHub release creation

**Options:**
- `-v, --version <type>` - Version bump: patch, minor, major, or explicit x.y.z
- `-d, --dry-run` - Preview changes without executing
- `--no-changelog` - Skip changelog generation
- `--no-tag` - Skip git tag creation
- `--no-release` - Skip GitHub release creation
- `--repo <repo>` - GitHub repository (owner/repo)

### 4. `/plan-ceo-review` - BAT Framework for Product Decisions

Brand, Attention, Trust scoring with 10-star methodology for product decisions.

```bash
# Basic review
superpowers plan-ceo-review "Feature: Add dark mode"

# With scores
superpowers plan-ceo-review "Feature: Add dark mode" --brand=4 --attention=3 --trust=3

# JSON output
superpowers plan-ceo-review "Feature: Add dark mode" --json
```

**BAT Framework:**
- **Brand** (0-5): Does this strengthen our brand identity?
- **Attention** (0-5): Will this capture user attention?
- **Trust** (0-5): Does this build user trust?

**10-Star Methodology:**
- Minimum 2/3 criteria must score 3+ to recommend building
- Total 15 points possible

**Recommendations:**
- 🟢 **BUILD**: Strong scores, clear value proposition
- 🟡 **CONSIDER**: Below threshold or modest scores
- 🔴 **DON'T BUILD**: Low scores across dimensions

**Options:**
- `-b, --brand <score>` - Brand score (0-5)
- `-a, --attention <score>` - Attention score (0-5)
- `-t, --trust <score>` - Trust score (0-5)
- `--json` - Output as JSON

## Requirements

- Node.js 18+
- TypeScript 5.3+ (for development)
- Playwright (installed automatically with browse skill)

## Development

```bash
# Clone repository
git clone https://github.com/nKOxxx/superpowers.git
cd superpowers

# Install dependencies
npm install

# Build all skills
npm run build

# Package skills for distribution
npm run package

# Test individual skill
cd skills/browse && npm test
```

## Project Structure

```
superpowers/
├── cli.js                    # Main CLI entry point
├── package.json
├── shared/                   # Shared utilities
│   ├── src/
│   │   ├── logger.ts
│   │   ├── cli.ts
│   │   ├── fs.ts
│   │   ├── process.ts
│   │   └── index.ts
│   └── dist/
├── skills/
│   ├── browse/              # Browser automation skill
│   │   ├── src/
│   │   ├── dist/
│   │   ├── skill.json
│   │   └── package.json
│   ├── qa/                  # Testing skill
│   ├── ship/                # Release pipeline skill
│   └── plan-ceo-review/     # Product decision skill
└── dist-skills/             # Packaged .skill.tar.gz files
    ├── browse.skill.tar.gz
    ├── qa.skill.tar.gz
    ├── ship.skill.tar.gz
    └── plan-ceo-review.skill.tar.gz
```

## License

MIT

## Author

nKO