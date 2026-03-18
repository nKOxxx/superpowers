# ship

One-command release pipeline - version bump, changelog, and GitHub release.

## Usage

```
/ship <bump> [options]
```

## Arguments

- `bump` - Version bump type: major, minor, patch, or specific version

## Options

- `--dry-run` - Preview changes without applying
- `--skip-changelog` - Skip changelog generation
- `--skip-git` - Skip git operations
- `--skip-github` - Skip GitHub release
- `--message <msg>` - Custom release message
- `--tag-prefix <prefix>` - Git tag prefix (default: v)
- `--branch <name>` - Release branch (default: main)
- `--telegram` - Send release notification to Telegram

## Examples

```bash
# Patch release
/ship patch

# Minor release with custom message
/ship minor --message "New features landing"

# Major dry run
/ship major --dry-run

# Specific version
/ship 2.1.0

# Release with Telegram notification
/ship patch --telegram
```

## Conventional Commits

Ship analyzes conventional commits to determine version bumps:
- `fix:` → patch
- `feat:` → minor
- `BREAKING CHANGE:` → major

## Output

- Version bump in package.json
- Updated CHANGELOG.md
- Git tag created
- GitHub release published (if configured)
- Telegram notification (if requested)
