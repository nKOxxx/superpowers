---
name: qa
description: QA Lead skill for systematic testing with smart test selection, coverage analysis, and support for Jest, Vitest, Mocha, and pytest. Triggers on /qa, run tests, test coverage, regression testing, or quality check commands.
---

# QA Skill

Systematic testing with smart test selection and coverage analysis.

## Commands

### /qa

Run tests with automatic framework detection.

```
/qa [options]
```

**Options:**
- `--changed` - Run tests only for changed files
- `--coverage` - Generate coverage report
- `--watch` - Watch mode
- `--file <path>` - Run specific test file
- `--grep <pattern>` - Filter by pattern
- `--framework <name>` - Force framework (jest, vitest, mocha, pytest)
- `--full` - Run full test suite
- `--security` - Run security-focused tests

## Supported Frameworks

- **Jest** - jest.config.* or jest in package.json
- **Vitest** - vitest.config.* or vitest in package.json
- **Mocha** - .mocharc.* or mocha in package.json
- **pytest** - pytest.ini or pyproject.toml

## Usage Examples

```bash
# Run all tests
/qa

# Run changed tests only
/qa --changed

# Check coverage
/qa --coverage

# Watch mode
/qa --watch

# Specific test file
/qa --file src/utils.test.ts

# Filter by pattern
/qa --grep "auth"
```

## Smart Test Selection

When using `--changed`, the skill:
1. Identifies modified files via git
2. Maps changes to test files
3. Runs only affected tests
4. Falls back to full suite if mapping fails
