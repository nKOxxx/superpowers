---
name: qa
description: Systematic testing as QA Lead. Analyzes code changes and runs appropriate tests. Use when user needs code testing, quality assurance, regression testing, or test planning. Triggers on requests like /qa, run tests, check test coverage, QA review, or code quality checks.
---

# /qa - Systematic Testing

Acts as QA Lead to analyze changes and run systematic tests.

## Quick Start

```bash
/qa                          # Run targeted tests for recent changes
/qa --mode=targeted         # Test only changed files
/qa --mode=smoke            # Quick smoke tests
/qa --mode=full             # Full regression suite
/qa --diff=HEAD~3           # Test changes from last 3 commits
```

## Modes

### Targeted (Default)
Analyzes git diff and runs only relevant tests.

```bash
/qa --mode=targeted
/qa --mode=targeted --diff=HEAD~5
```

### Smoke
Quick validation that core functionality works.

```bash
/qa --mode=smoke
```

### Full
Complete regression test suite.

```bash
/qa --mode=full
```

## How It Works

1. **Analyze Changes** - Examines git diff for modified files
2. **Map to Tests** - Identifies which tests cover changed code
3. **Execute** - Runs appropriate test suite
4. **Report** - Provides summary with coverage metrics

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

## Resources

- **scripts/qa.ts** - Main QA orchestration script
- **scripts/lib/analyzer.ts** - Code change analyzer
- **scripts/lib/test-runner.ts** - Test execution engine
- **references/testing-patterns.md** - Testing best practices

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
