---
name: qa
description: QA Lead skill for systematic testing and code quality analysis. Automatically selects relevant tests based on code changes, analyzes coverage, runs regression tests, and supports multiple testing frameworks (Jest, Vitest, Mocha, pytest, etc.). Triggers on test commands, coverage analysis, code quality checks, or when asked to run tests.
---

# QA - Systematic Testing & Quality Analysis

Intelligent test runner with smart test selection, coverage analysis, and multi-framework support.

## Quick Start

```bash
# Run all tests
/qa

# Run tests with coverage
/qa --coverage

# Smart test selection (based on changes)
/qa --changed

# Run specific test pattern
/qa --pattern "auth"

# Regression test suite
/qa --regression
```

## Supported Frameworks

Auto-detected from project files:

| Framework | Detection | Command |
|-----------|-----------|---------|
| Jest | `jest.config.*` / `package.json` | `jest` |
| Vitest | `vitest.config.*` | `vitest` |
| Mocha | `mocha` in package.json | `mocha` |
| Cypress | `cypress.config.*` | `cypress run` |
| Playwright | `playwright.config.*` | `playwright test` |
| pytest | `pytest.ini` / `setup.py` | `pytest` |
| unittest | `test_*.py` files | `python -m unittest` |
| Go test | `*_test.go` files | `go test` |
| Rust test | `Cargo.toml` | `cargo test` |

## Smart Test Selection

Automatically selects tests based on:

1. **Git changes** - Tests related to modified files
2. **Import graph** - Tests importing changed modules
3. **Historical failures** - Previously flaky tests
4. **Coverage gaps** - Untested changed code

### Selection Modes

```bash
# Only tests for changed files
/qa --changed

# Changed + dependencies
/qa --related

# Full suite with priority ordering
/qa --prioritized
```

## Coverage Analysis

```bash
# Generate coverage report
/qa --coverage

# Coverage diff against main
/qa --coverage-diff

# Uncovered lines report
/qa --uncovered
```

## Regression Testing

```bash
# Full regression suite
/qa --regression

# Smoke tests only
/qa --smoke

# E2E tests
/qa --e2e
```

## CI/CD Integration

```bash
# Output for GitHub Actions
/qa --format github --output test-results/

# Fail on threshold
/qa --coverage --threshold 80

# Parallel execution
/qa --parallel 4
```
