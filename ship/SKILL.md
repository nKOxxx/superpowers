---
name: ship
description: One-command release pipeline. Bumps version, generates changelog, creates GitHub release. Use when user wants to release a new version, publish package, or create GitHub release. Triggers on requests like /ship, release new version, publish, create release, or version bump.
---

# Ship - Release Pipeline Skill

Automated semantic versioning and release management.

## Capabilities

- Semantic versioning (patch, minor, major, explicit)
- Conventional commit changelog generation
- Git tag creation and push
- GitHub release creation (via GH_TOKEN)
- Dry-run preview mode

## Usage

```bash
# Patch release (bug fixes)
/ship --version=patch

# Minor release (features)
/ship --version=minor

# Major release (breaking changes)
/ship --version=major

# Explicit version
/ship --version=1.2.3

# Dry run (preview only)
/ship --version=minor --dry-run
```

## Version Bumping

- **patch** - 1.0.0 → 1.0.1 (bug fixes)
- **minor** - 1.0.0 → 1.1.0 (features, backward compatible)
- **major** - 1.0.0 → 2.0.0 (breaking changes)
- **explicit** - Use exact version provided

## Changelog Generation

Parses conventional commits since last tag:
- `feat:` → Features section
- `fix:` → Bug Fixes section
- `docs:` → Documentation section
- `refactor:` → Code Refactoring section
- `test:` → Tests section
- `chore:` → Chores section
- `BREAKING CHANGE:` → Breaking Changes section

## CLI Arguments

- `--version` - patch | minor | major | x.x.x
- `--dry-run` - Preview changes without applying
- `--no-push` - Skip git push
- `--no-release` - Skip GitHub release creation

## Prerequisites

- Git repo with clean working directory
- GH_TOKEN env var for GitHub releases (optional)
- Write access to repository

## Output

- Version bump confirmation
- Changelog preview
- Git tag push status
- GitHub release URL (if created)

## Implementation

Use the bundled CLI in `cli.js`.