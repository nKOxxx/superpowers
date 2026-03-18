# qa

Systematic testing based on code changes - intelligent test selection and coverage analysis.

## Usage

```
/qa [options]
```

## Options

- `--diff <ref>` - Git reference for diff (default: HEAD~1)
- `--test-runner <runner>` - Test runner: jest, vitest, mocha (auto-detect)
- `--selective` - Run only affected tests
- `--coverage` - Generate coverage report
- `--watch` - Watch mode
- `--fail-fast` - Stop on first failure
- `--parallel` - Run tests in parallel
- `--pattern <glob>` - Test file pattern
- `--output <dir>` - Output directory for reports
- `--telegram` - Send results to Telegram

## Examples

```bash
# Test changes in last commit
/qa --diff HEAD~1

# Test changes against main with coverage
/qa --diff main --coverage

# Run only affected tests with vitest
/qa --diff HEAD~5 --test-runner vitest --selective

# Watch mode for affected tests
/qa --diff HEAD~1 --watch --selective
```

## Output

- Test results with pass/fail summary
- Coverage reports (HTML + JSON)
- Affected files list
- Recommendations for missing tests
