---
name: ship
description: One-command release pipeline - semantic version bumping, changelog generation, GitHub releases, and npm publishing. Use when releasing new versions, generating changelogs, or publishing packages. Triggers on /ship, release, publish, version bump, or changelog commands.
---

# Ship Skill

One-command release pipeline for versioning, changelogs, and publishing.

## Commands

### /ship

Release a new version with automatic changelog generation.

```
/ship <version>
```

**Version types:**
- `patch` - Bug fixes, docs, chores (1.0.0 → 1.0.1)
- `minor` - New features (1.0.0 → 1.1.0)
- `major` - Breaking changes (1.0.0 → 2.0.0)

**Options:**
- `--dry-run` - Preview changes without applying
- `--no-publish` - Skip npm publish
- `--no-github-release` - Skip GitHub release
- `--branch <name>` - Target branch (default: main)
- `--message <msg>` - Custom release message

## Workflow

1. **Validate** - Check working directory is clean
2. **Bump** - Update version in package.json
3. **Changelog** - Generate from conventional commits
4. **Commit** - "chore(release): vX.Y.Z"
5. **Tag** - Create git tag vX.Y.Z
6. **Push** - Push commit and tag
7. **Release** - Create GitHub release
8. **Publish** - npm publish

## Usage Examples

```bash
# Release patch version
/ship patch

# Release minor version
/ship minor

# Dry run to preview
/ship major --dry-run

# Skip npm publish
/ship patch --no-publish

# Custom message
/ship minor --message "Special release"
```

## Changelog Format

Uses conventional commits:
- `feat:` → ### Features
- `fix:` → ### Bug Fixes
- `docs:` → ### Documentation
- `refactor:` → ### Code Refactoring
- `perf:` → ### Performance
- `test:` → ### Tests
- `chore:` → ### Chores

## Requirements

- Git repository
- package.json with version field
- GitHub CLI (`gh`) for releases
- npm authentication for publishing