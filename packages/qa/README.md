# /qa - Systematic Testing Skill

Auto-detects test frameworks and runs relevant tests with targeted, smoke, and full modes.

## Features

- **Auto-framework detection**: Vitest, Jest, Mocha, Node test runner
- **Three test modes**: targeted, smoke, full
- **Git diff analysis**: Run tests for changed files
- **Coverage reporting**: Optional coverage output
- **Test file mapping**: Maps source changes to test files

## Usage

```bash
# Run tests for changed files (default)
qa --mode=targeted

# Quick smoke tests
qa --mode=smoke

# Full test suite
qa --mode=full

# With coverage
qa --coverage

# Specific files
qa --files="src/utils.test.ts,src/api.test.ts"
```

## Test Modes

### Targeted Mode (Default)
- Analyzes git diff to find changed files
- Maps source files to corresponding test files
- Runs only relevant tests for faster feedback

### Smoke Mode
- Runs quick sanity checks
- Tests tagged with "smoke" or in `.smoke.test.` files
- Fast feedback for CI/CD pipelines

### Full Mode
- Runs entire test suite
- Comprehensive testing before releases

## Framework Detection

The skill automatically detects:
1. Vitest (`vitest.config.ts/js`)
2. Jest (`jest.config.js/ts/json`)
3. Mocha (`.mocharc.js/json`)
4. Node test runner (`node --test` in package.json)

## Test File Patterns

Source files are mapped to test files using these patterns:
- `{base}.test.{ext}`
- `{base}.spec.{ext}`
- `{base}_test.{ext}`
- `__tests__/{basename}.test.{ext}`
- `tests/{basename}.test.{ext}`

## Output

```
🧪 QA Results (TARGETED Mode)

Framework: vitest
Tests: 42 run | ✅ 40 passed | ❌ 2 failed | ⏭️ 0 skipped
Duration: 3.45s

📊 Coverage:
  Statements: 87.3%
  Branches: 82.1%
  Functions: 91.0%
  Lines: 88.5%

Files tested:
  • src/utils.test.ts
  • src/api.test.ts
```

## Requirements

- Node.js 18+
- Git repository (for targeted mode)

## Installation

```bash
openclaw skill install qa.skill.tar.gz
```
