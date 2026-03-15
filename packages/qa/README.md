# @superpowers/qa

Systematic testing as QA Lead - analyzes code changes and runs appropriate tests.

## Installation

```bash
npm install @superpowers/qa
```

## Usage

### CLI

```bash
# Run targeted tests based on changed files
qa

# Run smoke tests (quick sanity check)
qa --mode smoke

# Run full test suite with coverage
qa --mode full --coverage

# Watch mode
qa --watch

# Update snapshots
qa --update

# Compare against different git ref
qa --since origin/main
```

### Programmatic

```typescript
import { qaCommand } from '@superpowers/qa';

await qaCommand({
  mode: 'targeted',
  coverage: true,
  watch: false,
  update: false,
  since: 'HEAD~1',
});
```

## Test Modes

- **targeted** (default) - Analyzes git diff and runs only related tests
- **smoke** - Quick sanity tests with timeouts
- **full** - Complete test suite with coverage

## Supported Frameworks

- **Vitest** - Detects `vitest.config.ts/js` or `vite.config.ts/js`
- **Jest** - Detects `jest.config.ts/js/mjs`
- **Mocha** - Detects `.mocharc.json/js` or `mocha.opts`
- **Playwright** - Detects `playwright.config.ts/js`

## CLI Options

```
Usage: qa [options]

Options:
  -m, --mode <mode>    Test mode (targeted, smoke, full) (default: "targeted")
  -c, --coverage       Enable coverage reporting (default: false)
  -w, --watch          Watch mode (default: false)
  -u, --update         Update snapshots (default: false)
  --since <ref>        Git ref to compare against for targeted mode (default: "HEAD~1")
  -h, --help          display help for command
```

## Test File Mapping

Targeted mode automatically maps changed source files to test files:

- `src/utils/helpers.ts` → `src/utils/helpers.test.ts`
- `lib/auth.js` → `lib/auth.test.js`
- `components/Button.tsx` → `components/__tests__/Button.test.tsx`

## License

MIT
