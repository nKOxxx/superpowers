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
              "package": "@nko/superpowers",
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
qa

# Run smoke tests
qa --mode=smoke

# Run full test suite
qa --mode=full --coverage
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
qa

# Run with coverage
qa --mode=full --coverage

# Run specific pattern
qa --pattern="auth"

# Watch mode for development
qa --mode=targeted --watch

# CI mode with bail
qa --mode=smoke --ci --bail
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
  Run: qa --mode=smoke
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

## Smart Test Selection

The QA skill maps file changes to tests:

| Changed File Pattern | Tests to Run |
|---------------------|--------------|
| `src/**/*.ts` | Unit tests for affected modules |
| `src/components/*.tsx` | Component tests + visual regression |
| `src/api/**/*.ts` | API integration tests |
| `*.test.ts` | Those specific tests |
| `package.json` | Full dependency check + smoke |

## Configuration

Configure via `superpowers.config.json`:

```json
{
  "qa": {
    "defaultMode": "targeted",
    "coverageThreshold": 80,
    "testCommand": "npm test",
    "testPatterns": {
      "unit": ["**/*.test.ts", "**/*.spec.ts"],
      "integration": ["**/*.integration.test.ts"],
      "e2e": ["**/e2e/**/*.spec.ts"]
    }
  }
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

Exits with code 1 on test failure:

```yaml
# GitHub Actions example
- name: Run targeted tests
  run: qa --mode=targeted

- name: Run smoke tests
  if: github.ref == 'refs/heads/main'
  run: qa --mode=smoke --ci

- name: Run full tests with coverage
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: qa --mode=full --coverage
```

## Supported Test Runners

| Runner | Status | Notes |
|--------|--------|-------|
| Vitest | ✅ Full | Recommended |
| Jest | ✅ Full | Full support |
| Playwright | ✅ Full | E2E testing |
| Mocha | ✅ Basic | Core support |
| Node.js Test | ✅ Basic | Built-in |

## Output Format

```
QA Report - Mode: targeted
============================
Files Changed: 3
  - src/auth/login.ts
  - src/auth/session.ts
  - tests/auth.test.ts

Tests Selected: 5
  ✓ auth/login.test.ts (3 tests)
  ✓ auth/session.test.ts (2 tests)

Results:
  Passed: 5/5 (100%)
  Duration: 2.3s
  Coverage: 87%

Status: ✅ PASSED
```

## Resources

- **scripts/qa.ts** - Main QA orchestration script
- **scripts/lib/analyzer.ts** - Code change analyzer
- **scripts/lib/test-runner.ts** - Test execution engine
