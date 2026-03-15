---
name: qa
description: Systematic testing as QA Lead. Analyzes code changes and runs appropriate tests. Use when user needs code testing, quality assurance, regression testing, or test planning. Triggers on requests like /qa, run tests, check test coverage, QA review, or code quality checks.
---

# QA Skill

Systematic testing as QA Lead. Analyzes code changes and runs appropriate tests.

## Usage

```
/qa [options]
```

### Options

- `--mode=<type>` - Test mode: `targeted`, `smoke`, `full` (default: targeted)
- `--files=<pattern>` - Test files matching pattern
- `--coverage` - Generate coverage report
- `--watch` - Watch mode for development
- `--ci` - CI mode (non-interactive)

### Test Modes

| Mode | Description | When to Use |
|------|-------------|-------------|
| targeted | Analyze git diff, run relevant tests | Default, fast feedback |
| smoke | Quick validation of core functionality | Pre-commit, CI gate |
| full | Complete regression suite | Release candidate |

## Examples

### Default Targeted Testing
```
/qa
```

### Smoke Tests
```
/qa --mode=smoke
```

### Full Regression
```
/qa --mode=full
```

### Coverage Report
```
/qa --coverage
```

## Test Detection

Auto-detects test frameworks:
- **Vitest** - `vitest.config.*` or `vite.config.*`
- **Jest** - `jest.config.*` or `package.json` jest field
- **Mocha** - `.mocharc.*` or `test/mocha.opts`
- **Node Test Runner** - `node:test` with `node --test`

## Targeted Testing Logic

1. Get changed files from git diff
2. Map files to related test files
3. Run only affected tests
4. Report results with context

## Output Format

```json
{
  "success": true,
  "mode": "targeted",
  "testsRun": 15,
  "testsPassed": 15,
  "testsFailed": 0,
  "duration": 2340,
  "coverage": {
    "statements": 87.5,
    "branches": 82.1,
    "functions": 91.0,
    "lines": 86.4
  }
}
```

## Handler

**Entry:** `handler.ts`
**Runtime:** Node.js
