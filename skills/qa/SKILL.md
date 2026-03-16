---
name: qa
description: Systematic testing as QA Lead. Analyzes code changes and runs appropriate tests with smart test selection. Use when user needs testing, QA review, coverage checks, or regression testing. Triggers on /qa, run tests, test coverage, or code quality checks.
triggers:
  - /qa
  - run tests
  - test coverage
  - QA review
  - code quality
  - regression testing
  - check tests
model: kimi-k2.5
---

# 🧪 /qa - Systematic Testing Superpower

Acts as QA Lead to analyze changes and run systematic tests with intelligent test selection.

## Philosophy (gstack-inspired)

Following Garry Tan's gstack philosophy:
- **Fast**: Only test what changed - smart diff analysis
- **Simple**: One command, multiple modes
- **Reliable**: Coverage thresholds, clear pass/fail
- **Focused**: Targeted testing, not blanket execution

## Quick Start

```bash
# Targeted testing (default) - only changed files
/qa

# Quick smoke tests
/qa --mode=smoke

# Full regression suite
/qa --mode=full

# Custom diff range
/qa --diff=HEAD~5
```

## Testing Modes

### Targeted (Default)
Analyzes git diff and runs only tests covering changed code.

```bash
/qa
/qa --mode=targeted
/qa --mode=targeted --diff=main...HEAD
```

**Best for:**
- Pre-commit validation
- CI/CD pipelines
- Developer feedback loops

### Smoke
Quick validation of core functionality.

```bash
/qa --mode=smoke
```

**Checks:**
- package.json validity
- TypeScript compilation
- Lint checks
- Basic imports

**Best for:**
- Quick sanity checks
- Pre-push validation
- Fast feedback

### Full
Complete regression test suite.

```bash
/qa --mode=full
```

**Runs:**
- All unit tests
- All integration tests
- Coverage report
- Full validation

**Best for:**
- Release candidates
- Nightly builds
- Major changes

## Smart Test Selection

The QA skill intelligently maps file changes to tests:

| Changed File Pattern | Tests Selected |
|---------------------|----------------|
| `src/**/*.ts` | Unit tests for affected modules |
| `src/components/*.tsx` | Component tests + related |
| `src/api/**/*.ts` | API integration tests |
| `*.test.ts` | Those specific tests |
| `package.json` | Dependency audit + smoke |
| `*.config.*` | Full smoke suite |

### Test Discovery

The skill looks for tests in multiple locations:
```
src/module.ts → src/module.test.ts
src/module.ts → src/__tests__/module.test.ts
src/module.ts → tests/module.test.ts
src/components/Button.tsx → src/components/Button.test.tsx
```

## Usage

### Basic Commands

```bash
# Run targeted tests (default)
/qa

# Specify mode
/qa --mode=smoke
/qa --mode=full
/qa --mode=targeted

# Custom diff range
/qa --diff=HEAD~3
/qa --diff=main...feature-branch

# With coverage
/qa --coverage

# Watch mode
/qa --watch

# Telegram notification
/qa --telegram
```

### Coverage Thresholds

```bash
# Fail if coverage below threshold
/qa --coverage --threshold=80

# Configured in superpowers.config.json:
{
  "qa": {
    "coverageThreshold": 80
  }
}
```

## Configuration

Create `superpowers.config.json`:

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
    },
    "testMapping": {
      "src/api/**": ["tests/api/"],
      "src/components/**": ["tests/components/"]
    }
  },
  "telegram": {
    "enabled": true,
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "chatId": "${TELEGRAM_CHAT_ID}"
  }
}
```

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--mode` | `-m` | Test mode: targeted, smoke, full | `targeted` |
| `--diff` | `-d` | Git ref to compare changes | `HEAD~1` |
| `--coverage` | `-c` | Run with coverage report | `false` |
| `--threshold` | - | Coverage threshold % | `80` |
| `--watch` | `-w` | Watch mode | `false` |
| `--telegram` | `-t` | Send Telegram notification | `false` |
| `--config` | `-C` | Config file path | - |

## Output Format

```
🧪 QA - Systematic Testing
Mode: targeted

Analyzing changes from HEAD~1...
Files changed: 3
  • src/auth/login.ts
  • src/auth/session.ts
  • tests/auth.test.ts

Mapping to tests...
Tests selected: 5
  • tests/auth/login.test.ts
  • tests/auth/session.test.ts

Running tests...
✓ login.test.ts (1.2s)
✓ session.test.ts (0.8s)

==================================================
QA Report - Mode: targeted
==================================================

Files Changed: 3
  • src/auth/login.ts
  • src/auth/session.ts
  • tests/auth.test.ts

Tests Selected: 5
  • tests/auth/login.test.ts
  • tests/auth/session.test.ts

Results:
  ✓ login.test.ts (1.2s)
  ✓ session.test.ts (0.8s)

Summary:
  Passed: 5/5 (100%)
  Duration: 2.3s
  Coverage: 87%

Status: ✅ PASSED
```

## Telegram Integration

When enabled, QA sends:
- Test summary (passed/failed)
- Coverage percentage
- Duration
- List of failed tests (if any)

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Telegram chat ID

## CI/CD Integration

### GitHub Actions
```yaml
- name: QA - Targeted Tests
  run: npx superpowers-qa

- name: QA - Smoke Tests
  run: npx superpowers-qa --mode=smoke

- name: QA - Full Suite
  run: npx superpowers-qa --mode=full
  if: github.ref == 'refs/heads/main'
```

### Pre-commit Hook
```bash
#!/bin/sh
npx superpowers-qa --mode=targeted
```

## Best Practices

1. **Targeted for PRs**: Fast feedback on changes
2. **Smoke for commits**: Quick validation
3. **Full for releases**: Complete confidence
4. **Coverage gates**: Enforce quality standards
5. **Parallel runs**: Use with CI matrix builds

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed
- `2` - Configuration error

## Dependencies

- `commander` - CLI framework
- `chalk` - Terminal colors
- `glob` - File pattern matching
- `simple-git` - Git operations

## References

- [Testing Patterns](references/testing-patterns.md)
- [CI/CD Integration](references/ci-cd.md)
- [Coverage Best Practices](references/coverage.md)

---

**Part of OpenClaw Superpowers** | [GitHub](https://github.com/nKOxxx/superpowers)
