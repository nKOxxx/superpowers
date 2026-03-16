---
name: qa
description: Systematic testing as QA Lead. Analyzes code changes and runs appropriate tests. Use when user needs code testing, quality assurance, regression testing, or test planning. Triggers on requests like /qa, run tests, check test coverage, QA review, or code quality checks.
metadata:
  openclaw:
    requires:
      bins: ["node", "npx", "git"]
      npm: ["@nko/superpowers"]
    primaryEnv: null
    modelCompatibility: ["kimi-k2.5", "claude-opus-4", "gpt-4"]
    skillType: "typescript"
    entryPoint: "dist/index.js"
---

# QA - Systematic Testing Skill

Acts as QA Lead to analyze code changes and run appropriate tests. Supports three modes: targeted, smoke, and full.

## Capabilities

- **Targeted mode**: Analyzes git diff and runs only relevant tests
- **Smoke mode**: Quick validation that core functionality works
- **Full mode**: Complete regression test suite
- Coverage reporting
- Test framework auto-detection (vitest, jest, mocha)

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
- `--framework=<framework>` - Force specific framework (vitest, jest, mocha)

## Requirements

- Git repository
- Test framework (vitest, jest, or mocha)
- npm test command configured

## Output Example

```
✔ Framework: vitest
✔ Found 3 relevant tests
✔ Tests passed! (1245ms)
```
