---
name: qa
description: Systematic testing as QA Lead. Analyzes code changes and runs appropriate tests. Use when user needs code testing, quality assurance, regression testing, or test planning. Triggers on requests like /qa, run tests, check test coverage, QA review, or code quality checks.
metadata:
  openclaw:
    requires:
      bins: ["node", "npx", "git"]
      npm: ["@nko/superpowers"]
    primaryEnv: null
---

# QA - Systematic Testing Skill

Acts as QA Lead to analyze code changes and run appropriate tests. Supports three modes: targeted, smoke, and full.

## Capabilities

- **Targeted mode**: Analyzes git diff and runs only relevant tests
- **Smoke mode**: Quick validation that core functionality works
- **Full mode**: Complete regression test suite
- Coverage reporting
- Test framework auto-detection

## Usage

### Run targeted tests (default)

```bash
superpowers qa
```

### Smoke test - quick validation

```bash
superpowers qa --mode=smoke
```

### Full regression test suite

```bash
superpowers qa --mode=full
```

### With coverage

```bash
superpowers qa --coverage
```

## Modes

### Targeted (Default)
Analyzes git diff to identify changed files, maps them to test files, and runs only those tests.

Best for: Pre-commit validation, CI on PRs, quick feedback loops

### Smoke
Runs quick sanity tests tagged as "smoke", "basic", or "critical".

Best for: Pre-deployment validation, health checks

### Full
Runs the complete test suite.

Best for: Release validation, nightly builds

## Options

- `--mode=<mode>` - Test mode: targeted, smoke, full. Default: targeted
- `--diff=<range>` - Git diff range for targeted mode. Default: HEAD~1
- `--coverage` - Enable coverage reporting. Default: false
- `--parallel` - Run tests in parallel. Default: false

## Requirements

- Git repository
- npm test command configured

## Output Example

```
══════════════════════════════════════════════════
QA Mode: TARGETED
══════════════════════════════════════════════════

Files Changed: 3
  - src/auth/login.ts
  - src/api/users.ts
  - src/components/Button.tsx

Tests Selected: 2
  - tests/auth/login.test.ts
  - tests/components/Button.test.tsx

Results:
  ✓ tests/auth/login.test.ts (245ms)
  ✓ tests/components/Button.test.tsx (112ms)

──────────────────────────────────────────────────
Passed: 2/2 (100%)
Duration: 1.2s
Status: PASSED
```
