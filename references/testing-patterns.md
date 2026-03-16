# Testing Patterns Guide

## Overview

Best practices for testing with the `/qa` skill.

## Test Organization

### Directory Structure

```
project/
├── src/
│   ├── components/       # React/Vue components
│   ├── utils/            # Utility functions
│   └── api/              # API endpoints
├── tests/
│   ├── unit/             # Unit tests (*.test.ts)
│   ├── integration/      # Integration tests (*.integration.test.ts)
│   └── e2e/              # E2E tests (e2e/*.spec.ts)
```

### Test Types

#### Unit Tests

- Test individual functions/components
- Fast execution (< 100ms)
- No external dependencies

```typescript
// sum.test.ts
import { test, expect } from 'vitest';
import { sum } from './sum';

test('adds numbers correctly', () => {
  expect(sum(1, 2)).toBe(3);
});
```

#### Integration Tests

- Test module interactions
- May use test database
- Slower than unit tests

```typescript
// api.integration.test.ts
import { test, expect } from 'vitest';
import { api } from './api';

test('creates user in database', async () => {
  const user = await api.createUser({ name: 'Test' });
  expect(user.id).toBeDefined();
});
```

#### E2E Tests

- Test full user flows
- Browser automation
- Slowest but most realistic

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'user@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Smart Test Selection

The `/qa` skill automatically maps changed files to tests:

| Changed File | Tests Run |
|--------------|-----------|
| `src/**/*.ts` | Related unit tests |
| `src/components/*.tsx` | Component + visual tests |
| `src/api/**/*.ts` | API integration tests |
| `*.test.ts` | Specific test file |

### Custom Mappings

Configure in `superpowers.config.json`:

```json
{
  "qa": {
    "fileToTestMapping": {
      "src/utils/**/*.ts": "unit",
      "src/components/*.tsx": ["unit", "visual"],
      "src/api/**/*.ts": "integration"
    }
  }
}
```

## Coverage Guidelines

- **Unit tests**: 80%+ coverage
- **Integration tests**: Focus on critical paths
- **E2E tests**: Cover happy paths and critical errors

## Test Naming

```typescript
// Good
test('calculates total with tax', () => {});
test('rejects invalid email format', () => {});

// Bad
test('test 1', () => {});
test('it works', () => {});
```

## Smoke Tests

Mark critical tests with "smoke":

```typescript
test('smoke: homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/My App/);
});
```

Run smoke tests only:
```bash
/qa --mode=smoke
```

## CI Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm run browse --if-present  # Install browsers
      - run: pnpm run qa --diff=origin/main
```
