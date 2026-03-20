# QA Framework Configuration

## Framework-Specific Settings

### Jest

Configuration via `jest.config.js`:

```javascript
module.exports = {
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Vitest

Configuration via `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
});
```

### Pytest

Configuration via `pytest.ini`:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
addopts = --cov=src --cov-report=term-missing
```

## Smart Test Selection

The QA skill analyzes dependencies to determine test relevance:

1. Direct mapping: `src/utils.js` → `src/utils.test.js`
2. Import analysis: Tests importing changed modules
3. Integration cascade: Integration tests for modified modules

## Coverage Reports

Available formats:
- `text`: Console output
- `json`: Machine-readable JSON
- `html`: Interactive HTML report
- `lcov`: LCOV format for CI integration

## CI Integration

GitHub Actions example:

```yaml
- name: Run QA
  run: |
    npx @openclaw/superpowers qa run --changed
    npx @openclaw/superpowers qa coverage --threshold 80
```
