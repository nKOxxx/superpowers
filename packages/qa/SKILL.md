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

## Installation

```bash
npm install -g @openclaw/superpowers-qa
```

## Quick Start

```bash
# Targeted testing (default) - only changed files
qa

# Quick smoke tests
qa --mode=smoke

# Full regression suite
qa --mode=full

# Custom diff range
qa --diff=HEAD~5
```

## Testing Modes

### Targeted (Default)
Analyzes git diff and runs only tests covering changed code.

```bash
qa
qa --mode=targeted
qa --mode=targeted --diff=main...HEAD
```

### Smoke
Quick validation of core functionality.

```bash
qa --mode=smoke
```

### Full
Complete regression test suite.

```bash
qa --mode=full
```

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

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed
- `2` - Configuration error

---

**Part of OpenClaw Superpowers** | [GitHub](https://github.com/nKOxxx/superpowers)
