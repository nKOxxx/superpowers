# @superpowers/ship

One-command release pipeline.

## Usage

```bash
superpowers ship <version> [options]
```

## Version Types

- `patch` - Bug fixes (1.0.0 → 1.0.1)
- `minor` - New features (1.0.0 → 1.1.0)
- `major` - Breaking changes (1.0.0 → 2.0.0)
- `x.y.z` - Explicit version

## Options

- `--dry-run` - Preview changes without executing
- `--skip-tests` - Skip test run
- `--skip-changelog` - Skip changelog update
- `--skip-git` - Skip git operations
- `--skip-github` - Skip GitHub release
- `--prerelease` - Mark as prerelease

## Examples

```bash
superpowers ship patch
superpowers ship minor --dry-run
superpowers ship 1.2.3
```
