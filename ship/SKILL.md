---
name: ship
description: One-command release pipeline - semantic version bumping, changelog generation, GitHub releases, and npm publishing. Use when creating releases, managing versions, generating changelogs, or automating release workflows.
---

# Ship Skill

One-command release pipeline. Version bumping, changelog generation, GitHub releases, and npm publishing.

## Capabilities

- **Version Bumping**: Semantic versioning (major, minor, patch)
- **Changelog Generation**: Conventional commits to changelog
- **GitHub Releases**: Automated release creation
- **NPM Publishing**: Package publishing support
- **Dry Run Mode**: Preview changes without executing

## Usage

```bash
# Patch release (1.0.0 → 1.0.1)
ship patch

# Minor release (1.0.0 → 1.1.0)
ship minor

# Major release (1.0.0 → 2.0.0)
ship major

# Dry run to preview
ship minor --dry-run

# Skip tests
ship patch --skip-tests
```

## Version Bumps

| Type | When to Use | Example |
|------|-------------|---------|
| `patch` | Bug fixes | 1.0.0 → 1.0.1 |
| `minor` | New features | 1.0.0 → 1.1.0 |
| `major` | Breaking changes | 1.0.0 → 2.0.0 |

## Conventional Commits

Automatically categorizes commits:
- ✨ **Features** (`feat:`)
- 🐛 **Bug Fixes** (`fix:`)
- 📚 **Documentation** (`docs:`)
- ♻️ **Refactoring** (`refactor:`)
- ⚡ **Performance** (`perf:`)
- 🧪 **Tests** (`test:`)
- 🔧 **Chores** (`chore:`)
- ⚠️ **Breaking Changes** (`BREAKING CHANGE:` or `feat!:`)

## Environment Variables

- `GITHUB_TOKEN` - GitHub personal access token
- `NPM_TOKEN` - npm authentication token

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes only | false |
| `--skip-tests` | Skip running tests | false |
| `--skip-changelog` | Skip changelog update | false |
| `--skip-tag` | Skip git tag creation | false |
| `--skip-push` | Skip git push | false |
| `--message` | Custom commit message | "chore(release): {{version}}" |

## Output

- Updated package.json
- Updated CHANGELOG.md
- Git tag created
- GitHub release (if token available)

## Error Handling

The ship skill will fail gracefully with clear error messages for:
- Non-git repositories
- Unclean working directories
- Failed tests (unless `--skip-tests`)
- Missing permissions

## Reference

See [references/semver.md](references/semver.md) for:
- Semantic versioning guide
- Conventional commits specification
- Pre-release versions
- GitHub releases setup
