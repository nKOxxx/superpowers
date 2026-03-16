---
name: qa
description: Systematic testing based on code changes (diff-based testing). Use when the user needs to validate code changes, run tests based on git diffs, identify affected test files, generate test coverage reports, or perform regression testing. Integrates with test runners and provides intelligent test selection.
user-invocable: true
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["git", "node"] },
        "emoji": "🧪",
      },
  }
---

# QA - Intelligent Diff-Based Testing

Systematic testing that analyzes code changes to run only the tests that matter, saving time while ensuring coverage.

## Quick Start

### Run Tests Based on Changes
```bash
/qa [--since=main] [--mode=targeted|smoke|full]
```

### Analyze Test Impact
```bash
/qa analyze [--files=src/components/Button.tsx]
```

### Generate Coverage Report
```bash
/qa coverage [--format=html|json|lcov]
```

## Commands

### `/qa [--mode=targeted]`
Run tests based on code changes (default: targeted).

**Modes:**
- `targeted` - Run tests directly related to changed files (fastest)
- `smoke` - Run smoke tests + targeted tests (balanced)
- `full` - Run complete test suite (most thorough)

**Options:**
- `--since=<ref>` - Compare against git ref (default: HEAD~1)
- `--staged` - Only consider staged changes
- `--unstaged` - Only consider unstaged changes
- `--files=<glob>` - Test specific file patterns
- `--parallel=<n>` - Run tests with n workers
- `--watch` - Watch mode for continuous testing
- `--fail-fast` - Stop on first failure
- `--retry=<n>` - Retry failed tests n times
- `--notify` - Send Telegram notification with results

### `/qa analyze`
Analyze which tests cover specific code files without running them.

**Options:**
- `--files=<paths>` - Comma-separated file paths to analyze
- `--output=<text|json>` - Output format
- `--include-dependents` - Include tests that depend on these files

### `/qa coverage`
Generate and analyze test coverage reports.

**Options:**
- `--format=<html|json|lcov|text>` - Report format (default: html)
- `--diff-coverage` - Show coverage only for changed lines
- `--threshold=<percent>` - Fail if coverage below threshold
- `--open` - Open HTML report in browser
- `--since=<ref>` - Coverage for changes since ref

### `/qa regress <baseline-ref>`
Run regression tests comparing current state against baseline.

**Options:**
- `--baseline=<ref>` - Git ref for baseline (default: main)
- `--report-flaky` - Identify and report flaky tests
- `--rerun-failed` - Rerun failed tests from baseline

### `/qa init`
Initialize QA configuration for the project.

Creates `.qa.config.js` with:
- Test framework detection (Jest, Vitest, Mocha, etc.)
- Source file patterns
- Test file patterns
- Coverage settings

## How It Works

1. **Change Detection**: Uses git diff to identify modified files
2. **Dependency Graph**: Maps relationships between source and test files
3. **Test Selection**: Identifies which tests need to run based on:
   - Direct imports of changed files
   - Indirect dependencies (transitive imports)
   - Historical failure correlation
4. **Execution**: Runs selected tests with optimal parallelization
5. **Reporting**: Generates detailed reports with:
   - Test results
   - Coverage delta
   - Execution time
   - Recommendations

## Test Framework Support

- **Jest** - Full support with --changedSince
- **Vitest** - Native change detection
- **Mocha** - Custom test discovery
- **Cypress** - E2E test selection
- **Playwright** - E2E test selection
- **pytest** - Python test discovery
- **cargo test** - Rust test selection

## Configuration (.qa.config.js)

```javascript
module.exports = {
  // Test framework
  framework: 'jest', // or 'vitest', 'mocha', 'cypress', 'playwright'
  
  // File patterns
  sourceFiles: ['src/**/*.{js,ts,tsx}'],
  testFiles: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}'],
  
  // Ignore patterns
  ignorePatterns: ['node_modules', 'dist', 'build'],
  
  // Coverage settings
  coverage: {
    thresholds: {
      global: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  
  // Test selection
  selection: {
    // Include tests that import these patterns
    includePatterns: ['**/*.test.{js,ts}'],
    // Additional files to always test
    alwaysRun: ['src/critical/**/*'],
    // Files to exclude from change detection
    excludeFromChanges: ['**/*.md', '**/*.json']
  },
  
  // Execution
  execution: {
    parallel: true,
    maxWorkers: 4,
    timeout: 30000
  },
  
  // Notifications
  notifications: {
    telegram: {
      channel: '@channel_id'
    }
  }
};
```

## Smart Test Selection

The QA skill uses multiple strategies to select tests:

### 1. Direct Import Analysis
Finds tests that directly import changed modules.

### 2. Dependency Tree Traversal
Follows import chains to find indirectly affected tests.

```
changed: utils/helpers.ts
  → imports: components/Button.tsx
    → imports: components/Button.test.tsx ✓ SELECTED
```

### 3. Historical Correlation
Uses git history to find tests that often fail together.

### 4. Code Coverage Mapping
Maps coverage reports to identify which tests execute changed code.

## Output Examples

### Targeted Mode
```
Changed Files: 3
  - src/auth/login.ts
  - src/auth/session.ts
  - src/utils/crypto.ts

Selected Tests: 12
  - src/auth/__tests__/login.test.ts
  - src/auth/__tests__/session.test.ts
  - src/utils/__tests__/crypto.test.ts
  - ...

Results: ✅ 12 passed (2.3s)
```

### Smoke Mode
```
Changed Files: 3
Selected Tests: 45 (12 targeted + 33 smoke)

Results: ✅ 43 passed, ⚠️ 2 skipped
```

### Full Mode
```
Test Suite: 1,247 tests
Results: ✅ 1,245 passed, ❌ 2 failed

Failed Tests:
  1. src/api/__tests__/users.test.ts > createUser
     Error: Timeout exceeded
  
  2. src/utils/__tests__/cache.test.ts > eviction
     Error: Assertion failed
```

## Integration with CI/CD

```yaml
# .github/workflows/qa.yml
name: QA
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Run targeted tests
        run: npx /qa --mode=targeted --since=origin/main
```

## Telegram Notifications

Enable notifications to receive formatted test results:

```bash
/qa --mode=targeted --notify
```

Notification includes:
- Test summary (passed/failed/skipped)
- Changed files count
- Execution time
- Direct link to full report (if hosted)
