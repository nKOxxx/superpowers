# Testing Best Practices

## Overview

The QA skill supports multiple testing frameworks and modes.

## Supported Frameworks

- **Vitest** - Fast, Vite-native testing
- **Jest** - Popular, feature-rich
- **Playwright** - E2E testing
- **Mocha** - Flexible, minimal

## Test Patterns

```json
{
  "qa": {
    "testPatterns": {
      "unit": ["**/*.test.ts", "**/*.spec.ts"],
      "integration": ["**/*.integration.test.ts"],
      "e2e": ["**/e2e/**/*.spec.ts"]
    }
  }
}
```

## Test Modes

### Targeted (Default)
- Analyzes git diff
- Runs only affected tests
- Fast feedback loop

### Smoke
- Quick validation
- Core functionality only
- ~1-2 minutes

### Full
- Complete regression
- All test suites
- May take 10+ minutes

## Smart Test Selection

The QA skill maps file changes to tests:

| Changed File | Tests to Run |
|--------------|--------------|
| `src/**/*.ts` | Unit tests for affected modules |
| `src/components/*.tsx` | Component + visual tests |
| `src/api/**/*.ts` | API integration tests |
| `*.test.ts` | Those specific tests |
| `package.json` | Full dependency check |

## Best Practices

1. **Write testable code** - Small, pure functions
2. **Mock external dependencies** - API calls, databases
3. **Use descriptive test names** - `it('should calculate tax correctly')`
4. **Maintain test coverage** - Aim for 80%+
5. **Run targeted tests locally** - Before committing
