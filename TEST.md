# Superpowers Quick Test

## Test Browse (requires Playwright browsers)
```bash
npm run build
node cli.js browse https://example.com --viewport=desktop
```

## Test QA
```bash
node cli.js qa --mode=smoke
```

## Test Ship (dry run)
```bash
node cli.js ship --repo=test/test --version=patch --dry-run
```

## Test CEO Review
```bash
node cli.js plan-ceo-review "Should we add dark mode?"
```

## Direct Script Usage
```bash
node dist/browse/scripts/browse.js https://example.com
node dist/qa/scripts/qa.js --mode=targeted
node dist/ship/scripts/ship.js --repo=test/test --version=patch --dry-run
node dist/plan-ceo-review/scripts/plan-ceo-review.js "Should we add analytics?"
```