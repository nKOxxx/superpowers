---
name: qa
description: Systematic testing as QA Lead. Analyzes code changes and runs appropriate tests. Use when user needs code testing, quality assurance, regression testing, or test planning. Triggers on requests like /qa, run tests, check test coverage, QA review, or code quality checks.
---

# QA - Systematic Testing Skill

Intelligent test execution based on code changes and test frameworks.

## Capabilities

- Auto-detects test framework (vitest, jest, mocha)
- Three modes: targeted (git diff), smoke, full
- Coverage reporting support
- Test file mapping from source changes

## Usage

```bash
# Run tests based on git diff (default)
/qa

# Smoke tests only
/qa --mode=smoke

# Full test suite
/qa --mode=full

# With coverage
/qa --coverage

# Targeted mode with specific files
/qa --files=src/utils.ts,src/api.ts
```

## Modes

### targeted (default)
Analyzes git diff to find changed files, maps to relevant test files, runs only affected tests.

### smoke
Quick validation - runs a subset of critical tests (files matching *.smoke.* or *smoke*.test.*).

### full
Complete regression suite - runs all tests.

## Test Framework Detection

Auto-detects in order: vitest > jest > mocha

Uses:
- `vitest` - if vitest.config.* exists
- `jest` - if jest.config.* exists
- `npm test` - fallback

## CLI Arguments

- `--mode` - targeted | smoke | full
- `--coverage` - Enable coverage reporting
- `--files` - Comma-separated file list (overrides git diff)
- `--watch` - Watch mode (if supported)

## Output

- Test execution summary
- Failed test details
- Coverage report (if enabled)
- Recommendations for fixes

## Implementation

Use the bundled CLI in `cli.js`.