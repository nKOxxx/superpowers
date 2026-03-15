#!/bin/bash

# Package a skill into .skill.tar.gz format for OpenClaw

SKILL_NAME=$1
DIST_DIR="dist-skills"
WORK_DIR="/tmp/skill-build-${SKILL_NAME}"

if [ -z "$SKILL_NAME" ]; then
    echo "Usage: $0 <skill-name>"
    exit 1
fi

# Clean up
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
mkdir -p "$DIST_DIR"

# Copy compiled files
cp "dist/commands/${SKILL_NAME}.js" "$WORK_DIR/" 2>/dev/null || cp "dist/commands/$(echo $SKILL_NAME | tr '-' '_').js" "$WORK_DIR/"
cp -r dist/utils "$WORK_DIR/" 2>/dev/null || true

# Create skill.json
case "$SKILL_NAME" in
    browse)
        cat > "$WORK_DIR/skill.json" << 'EOF'
{
  "id": "browse",
  "name": "Browser Automation",
  "version": "1.0.0",
  "description": "Screenshot capture and browser automation with Playwright",
  "entry": "browse.js",
  "author": "nKOxxx",
  "keywords": ["browser", "screenshot", "playwright", "automation"]
}
EOF
        ;;
    qa)
        cat > "$WORK_DIR/skill.json" << 'EOF'
{
  "id": "qa",
  "name": "Systematic Testing",
  "version": "1.0.0",
  "description": "QA Lead testing based on code changes",
  "entry": "qa.js",
  "author": "nKOxxx",
  "keywords": ["testing", "qa", "vitest", "jest", "coverage"]
}
EOF
        ;;
    ship)
        cat > "$WORK_DIR/skill.json" << 'EOF'
{
  "id": "ship",
  "name": "Release Pipeline",
  "version": "1.0.0",
  "description": "One-command release pipeline with semantic versioning",
  "entry": "ship.js",
  "author": "nKOxxx",
  "keywords": ["release", "semver", "github", "changelog", "git"]
}
EOF
        ;;
    ceo-review)
        cat > "$WORK_DIR/skill.json" << 'EOF'
{
  "id": "ceo-review",
  "name": "Product Strategy (BAT Framework)",
  "version": "1.0.0",
  "description": "Product strategy review using BAT framework",
  "entry": "ceo-review.js",
  "author": "nKOxxx",
  "keywords": ["product", "strategy", "bat", "framework", "decision"]
}
EOF
        ;;
esac

# Create SKILL.md documentation
case "$SKILL_NAME" in
    browse)
        cat > "$WORK_DIR/SKILL.md" << 'EOF'
# /browse - Browser Automation

Screenshot capture and browser automation with Playwright.

## Usage

```bash
superpowers browse <url> [options]
```

## Options

- `--viewport, -v` - Viewport preset (mobile|tablet|desktop) or WxH format
- `--fullPage, -f` - Capture full page screenshot
- `--selector, -s` - Screenshot specific CSS element
- `--actions, -a` - JSON array of actions to perform
- `--output, -o` - Output file path
- `--base64` - Output as base64 for Telegram

## Action Format

Actions are JSON arrays:
```json
[
  {"type": "click", "selector": "#button"},
  {"type": "type", "selector": "#input", "text": "hello"},
  {"type": "wait", "delay": 1000},
  {"type": "scroll"},
  {"type": "hover", "selector": "#tooltip"},
  {"type": "press", "key": "Enter"}
]
```

## Examples

```bash
# Mobile screenshot
superpowers browse https://example.com --viewport=mobile

# Screenshot with actions
superpowers browse https://example.com --actions='[{"type":"click","selector":"#menu"}]'

# Element screenshot to Telegram
superpowers browse https://example.com --selector=".hero" --base64
```
EOF
        ;;
    qa)
        cat > "$WORK_DIR/SKILL.md" << 'EOF'
# /qa - Systematic Testing

QA Lead testing based on code changes.

## Usage

```bash
superpowers qa [options]
```

## Options

- `--mode, -m` - Test mode: targeted (default), smoke, full
- `--coverage, -c` - Generate coverage report
- `--verbose` - Verbose output

## Modes

- **targeted** - Analyze git diff, run only related tests
- **smoke** - Quick validation test suite
- **full** - Complete regression suite

## Examples

```bash
# Run tests for changed files only
superpowers qa

# Full regression with coverage
superpowers qa --mode=full --coverage

# Smoke tests
superpowers qa --mode=smoke --verbose
```

## Supported Frameworks

- Vitest
- Jest
- Mocha
EOF
        ;;
    ship)
        cat > "$WORK_DIR/SKILL.md" << 'EOF'
# /ship - Release Pipeline

One-command release pipeline with semantic versioning.

## Usage

```bash
superpowers ship [options]
```

## Options

- `--version, -v` - Version bump: patch (default), minor, major, or explicit version
- `--dry-run, -d` - Preview changes without applying
- `--skip-github` - Skip GitHub release creation

## Environment Variables

- `GH_TOKEN` or `GITHUB_TOKEN` - Required for GitHub release creation

## Examples

```bash
# Patch release
superpowers ship

# Minor release with preview
superpowers ship --version=minor --dry-run

# Explicit version
superpowers ship --version=2.0.0

# Release without GitHub
superpowers ship --skip-github
```

## Features

- Semantic versioning (patch/minor/major)
- Conventional commit changelog generation
- Git tag creation and push
- GitHub release creation
- Package.json version bumping
EOF
        ;;
    ceo-review)
        cat > "$WORK_DIR/SKILL.md" << 'EOF'
# /plan-ceo-review - Product Strategy (BAT Framework)

Product strategy review using BAT (Brand, Attention, Trust) framework.

## Usage

```bash
superpowers ceo-review --feature="Name" [options]
```

## Options

- `--feature` (required) - Feature name to review
- `--brand` - Brand score (0-5)
- `--attention` - Attention score (0-5)
- `--trust` - Trust score (0-5)
- `--goal` - Feature goal/strategy context
- `--auto` - Auto-calculate scores
- `--output, -o` - Save report to file

## 10-Star Methodology

- **BUILD** (10-15 stars): Strong alignment, prioritize
- **CONSIDER** (6-9 stars): Meets minimum threshold, needs refinement
- **DON'T BUILD** (0-5 stars): Below threshold, deprioritize

Minimum: 6 total stars with at least 2/3 categories at 2+

## Examples

```bash
# Auto-score a feature
superpowers ceo-review --feature="AI Chat Assistant" --auto

# Manual scoring
superpowers ceo-review --feature="Dark Mode" --brand=4 --attention=3 --trust=4

# With goal and output
superpowers ceo-review --feature="Social Share" --goal="Increase viral growth" --output=review.md
```

## Scoring Guide

### Brand (0-5)
- 0-1: No brand impact
- 2-3: Moderate brand alignment
- 4-5: Strong brand differentiator

### Attention (0-5)
- 0-1: Low user engagement
- 2-3: Moderate engagement potential
- 4-5: High virality/engagement

### Trust (0-5)
- 0-1: Potential trust risk
- 2-3: Neutral or standard
- 4-5: Builds significant trust
EOF
        ;;
esac

# Create package
OUTPUT="${DIST_DIR}/${SKILL_NAME}.skill.tar.gz"
tar -czf "$OUTPUT" -C "$WORK_DIR" .

# Clean up
rm -rf "$WORK_DIR"

echo "✓ Packaged: $OUTPUT"
ls -lh "$OUTPUT"
