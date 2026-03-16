---
name: qa
description: "Systematic testing - QA Lead persona for code testing with targeted, smoke, and full test modes. Analyzes code changes and runs appropriate tests. Use when: (1) running tests after code changes, (2) analyzing which tests to run, (3) setting up testing workflows."
metadata:
  {
    "openclaw":
      {
        "emoji": "🧪",
        "requires": { "bins": ["npx"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "@superpowers/qa",
              "bins": ["qa"],
              "label": "Install QA skill (npm)",
            },
          ],
      },
  }
---

# QA Skill

Systematic testing with QA Lead intelligence. Automatically analyzes code changes and runs the appropriate tests - from targeted unit tests to full regression suites.

## Quick Start

```bash
# Analyze changes and run targeted tests
qa run

# Run smoke tests
qa run --mode=smoke

# Run full test suite
qa run --mode=full --coverage
```

## Commands

### run

Run tests based on the specified mode.

**Modes:**
- **targeted** (default) - Runs only tests related to changed files
- **smoke** - Runs critical/smoke tests
- **full** - Runs complete test suite

**Options:**
- `-m, --mode <mode>` - Test mode: `targeted`, `smoke`, `full`
- `-r, --runner <runner>` - Test runner: `jest`, `vitest`, `playwright`, `mocha`
- `-w, --watch` - Watch mode
- `-c, --coverage` - Generate coverage report
- `-u, --update-snapshots` - Update snapshots
- `-p, --pattern <pattern>` - Test name pattern to match
- `-b, --bail` - Stop on first failure
- `-v, --verbose` - Verbose output
- `--ci` - CI mode (non-interactive)
- `--workers <n>` - Number of parallel workers
- `-t, --timeout <ms>` - Test timeout in milliseconds

**Examples:**
```bash
# Run targeted tests (default)
qa run

# Run with coverage
qa run --mode=full --coverage

# Run specific pattern
qa run --pattern="auth"

# Watch mode for development
qa run --mode=targeted --watch

# CI mode with bail
qa run --mode=smoke --ci --bail
```

### analyze

Analyze code changes and recommend the appropriate test mode.

**Output:**
- Risk score (0-100)
- Risk factors
- Changed files
- Affected test files
- Recommended test mode

**Example:**
```bash
qa analyze
```

Sample output:
```
🔍 Analyzing code changes...

Risk Assessment:
🔴 Score: 75/100

Risk Factors:
  • Core/shared files modified
  • No tests modified with code changes

Changed Files:
  • src/auth/login.ts
  • src/utils/crypto.ts

Affected Tests:
  ✓ src/auth/login.test.ts

Recommendation:
  Run: qa run --mode=smoke
```

### config

Manage QA configuration.

**Subcommands:**
```bash
# Initialize config file
qa config --init

# Show current config
qa config --show

# Set a config value
qa config --set defaultRunner --value vitest
qa config --set coverageThreshold --value 85
```

**Configuration options:**
- `defaultRunner` - Default test runner (jest, vitest, playwright, mocha)
- `testDirs` - Directories to search for tests
- `testPatterns` - File patterns for test files
- `coverageThreshold` - Minimum coverage percentage
- `smokeTags` - Tags that identify smoke tests
- `timeout` - Default test timeout
- `workers` - Default number of parallel workers

### detect

Detect the test runner used in the current project.

```bash
qa detect
```

## Test Modes

### Targeted Mode

Automatically detects changed files using git and runs only related tests. Fast feedback for development.

**Best for:**
- Local development
- Pre-commit hooks
- Quick feedback loops

**How it works:**
1. Gets changed files from `git diff`
2. Maps changes to related test files
3. Runs only affected tests

### Smoke Mode

Runs critical tests to verify core functionality. Balances speed with coverage.

**Best for:**
- Pre-deployment checks
- Pull request validation
- Continuous integration

**Smoke test detection:**
- Tests with `@smoke` or `@critical` annotations
- Tests in files matching `*.smoke.test.*`
- Configurable via `smokeTags` in config

### Full Mode

Runs the complete test suite with coverage reporting.

**Best for:**
- Release preparation
- Nightly builds
- Coverage validation

## Configuration File

Create `.qa.config.json` in your project root:

```json
{
  "defaultRunner": "vitest",
  "testDirs": ["src", "tests", "__tests__"],
  "testPatterns": [
    "**/*.test.ts",
    "**/*.test.js",
    "**/*.spec.ts",
    "**/*.spec.js"
  ],
  "coverageThreshold": 80,
  "smokeTags": ["smoke", "critical", "sanity"],
  "exclude": ["node_modules/**", "dist/**"],
  "timeout": 30000,
  "workers": 4
}
```

## Risk Assessment

The analyze command calculates a risk score based on:

| Factor | Impact |
|--------|--------|
| Number of files changed | +5 per file (max 30) |
| Core/shared files modified | +20 |
| Files without tests | +15 |
| Tests not updated | +10 |

**Score interpretation:**
- 0-30: 🟢 Low risk - targeted tests recommended
- 31-60: 🟡 Medium risk - consider smoke tests
- 61-100: 🔴 High risk - full test suite recommended

## CI/CD Integration

The `run` command exits with code 1 on test failure:

```yaml
# GitHub Actions example
- name: Run targeted tests
  run: qa run --mode=targeted

- name: Run smoke tests
  if: github.ref == 'refs/heads/main'
  run: qa run --mode=smoke --ci

- name: Run full tests with coverage
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: qa run --mode=full --coverage
```

## Supported Test Runners

| Runner | Status | Notes |
|--------|--------|--------|
| Vitest | ✅ Full | Recommended |
| Jest | ✅ Full | Full support |
| Playwright | ✅ Full | E2E testing |
| Mocha | ✅ Basic | Core support |
| Node.js Test | ✅ Basic | Built-in |

## Environment Variables

Set these in your shell or CI environment:

- `TEST_TIMEOUT` - Override default timeout
- `TEST_WORKERS` - Override default workers
- `COVERAGE_THRESHOLD` - Override coverage threshold
