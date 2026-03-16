# OpenClaw Superpowers Monorepo

## Structure

```
superpowers/
├── packages/
│   ├── shared/           # Shared utilities (config, telegram)
│   ├── cli/              # Main CLI entry point
│   ├── browse/           # Browser automation skill
│   ├── qa/               # Testing skill
│   ├── ship/             # Release pipeline skill
│   └── plan-ceo-review/  # BAT framework skill
├── templates/            # Starter templates
├── README.md
├── LICENSE
└── superpowers.config.json.example
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Develop with watch mode
npm run dev

# Test all packages
npm test
```

## Publishing

```bash
# Version bump and publish all
npm version patch
npm publish -ws
```

## Adding a New Skill

1. Create package in `packages/<skill-name>/`
2. Add `package.json` with proper bin entry
3. Implement skill in `src/index.ts`
4. Create CLI in `src/cli.ts`
5. Add to main CLI commands
6. Update README
7. Add to superpowers.config.json.example
