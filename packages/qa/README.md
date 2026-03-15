# QA Skill

Systematic testing with auto-detection for OpenClaw.

## Features

- **Auto-detect** test framework (Vitest, Jest, Mocha)
- **Three modes**: targeted, smoke, full
- **Changed file detection** - run only related tests
- **Coverage reporting**
- **Watch mode**

## Usage

```bash
qa [options] [files...]
```

## Options

- `-m, --mode <mode>` - Test mode: targeted, smoke, full (default: targeted)
- `-f, --framework <framework>` - Test framework: vitest, jest, mocha, auto
- `-c, --coverage` - Enable coverage reporting
- `-w, --watch` - Watch mode
- `--changed` - Run tests related to changed files (git)
- `--fail-fast` - Stop on first failure

## Test Modes

### Targeted (default)
Runs tests related to changed files or specific files.

```bash
qa
qa --changed
qa src/utils.test.ts
```

### Smoke
Runs only smoke/basic tests (tests with "smoke" or "basic" in name).

```bash
qa --mode smoke
```

### Full
Runs all tests in the project.

```bash
qa --mode full --coverage
```

## Framework Detection

The skill automatically detects your test framework by:
1. Looking for config files (vitest.config.ts, jest.config.js, etc.)
2. Checking package.json dependencies
3. Scanning for test files

## Examples

```bash
# Run targeted tests (changed files only)
qa --changed

# Run all tests with coverage
qa --mode full --coverage

# Run smoke tests
qa --mode smoke

# Run specific framework
qa --framework vitest --watch

# Run specific test file
qa src/components/Button.test.tsx
```
