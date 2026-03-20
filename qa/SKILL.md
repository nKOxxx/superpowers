---
name: qa
description: QA Lead skill for systematic testing and code quality analysis. Automatically selects relevant tests based on code changes, analyzes coverage, runs regression tests, and supports multiple testing frameworks (Jest, Vitest, Mocha, pytest, etc.). Triggers on test commands, coverage analysis, code quality checks, or when asked to run tests.
---

# QA Skill

Systematic testing as QA Lead with smart test selection and coverage analysis.

## Capabilities

- **Smart Test Selection**: Automatically detect and run relevant tests based on changed files
- **Coverage Analysis**: Track and report test coverage with trend analysis
- **Multi-Framework Support**: Jest, Vitest, Mocha, Ava, pytest, go test, cargo test, etc.
- **Regression Testing**: Run full or selective regression suites

## Usage

```bash
# Run all tests
qa run

# Smart test selection based on changes
qa run --changed

# Check coverage
qa coverage

# Watch mode
qa run --watch

# Specific framework
qa run --framework jest

# Run with pattern
qa run --pattern "auth"
```

## Test Framework Detection

Auto-detects frameworks by looking for:

| Framework | Detection |
|-----------|-----------|
| Jest | `jest.config.*`, `package.json` scripts |
| Vitest | `vitest.config.*`, vite projects |
| Mocha | `.mocharc.*`, `mocha.opts` |
| Ava | `ava.config.*` |
| pytest | `pytest.ini`, `setup.py`, `pyproject.toml` |
| unittest | `*test*.py` files |
| go test | `*_test.go` files |
| cargo test | `Cargo.toml` |
| dotnet test | `*.csproj`, `*.sln` |

## Output

- Test results with pass/fail counts
- Coverage reports (when available)
- Failed test details with stack traces
- Suggestions for fixing failures

## Configuration

Create `qa.config.js` to customize:

```javascript
module.exports = {
  testFramework: 'jest', // auto-detected by default
  coverageThreshold: 80,
  ignorePatterns: ['**/*.spec.ts', '**/dist/**'],
  timeout: 30000
};
```

## Smart Test Selection

The QA skill automatically finds affected tests for changed files:
- `src/file.ts` → `src/file.test.ts`
- `src/file.ts` → `src/__tests__/file.test.ts`
- `src/file.ts` → `tests/file.test.ts`

## Reference

See [references/frameworks.md](references/frameworks.md) for:
- Framework-specific configuration
- Vitest, Jest, Playwright, Mocha setup
- Coverage analysis details
- Test pattern matching
