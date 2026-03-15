# Superpowers

AI-powered workflows for development, testing, and product decisions.

## Skills

| Skill | Description | Command |
|-------|-------------|---------|
| `/browse` | Browser automation with Playwright | `browse <url>` |
| `/qa` | Systematic testing with auto-detection | `qa [--mode=targeted\|smoke\|full]` |
| `/ship` | One-command release pipeline | `ship [--bump=patch\|minor\|major]` |
| `/plan-ceo-review` | Product strategy review with BAT framework | `plan-ceo-review "Feature: Description"` |

## Quick Start

```bash
# Install dependencies
npm install

# Build all skills
npm run build

# Package skills for distribution
npm run package
```

## Packages Structure

```
packages/
├── browse/           # Browser automation
├── qa/               # Testing automation
├── ship/             # Release pipeline
└── plan-ceo-review/  # Product review
```

## Individual Skill Usage

### Browse

```bash
cd packages/browse
npm install
npm run build
./cli.js https://example.com --viewport mobile
```

### QA

```bash
cd packages/qa
npm install
npm run build
./cli.js --mode full --coverage
```

### Ship

```bash
cd packages/ship
npm install
npm run build
./cli.js --bump minor --dry-run
```

### Plan CEO Review

```bash
cd packages/plan-ceo-review
npm install
npm run build
./cli.js "New Feature: A game-changing product idea" --auto
```

## Distribution

Skills are packaged into `dist-skills/*.skill.tar.gz` files for OpenClaw deployment:

```bash
npm run package
```

Creates:
- `dist-skills/browse.skill.tar.gz`
- `dist-skills/qa.skill.tar.gz`
- `dist-skills/ship.skill.tar.gz`
- `dist-skills/plan-ceo-review.skill.tar.gz`

## Requirements

- Node.js 18+
- TypeScript 5.3+
- Playwright (for browse skill)

## License

MIT
