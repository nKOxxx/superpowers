---
name: ship
description: One-command release pipeline - semantic version bumping, changelog generation, GitHub releases, and npm publishing. Triggers on release commands, version bump requests, changelog generation, or when asked to publish/ship a project.
---

# Ship - Release Pipeline

One-command release automation with semantic versioning, changelog generation, and multi-platform publishing.

## Quick Start

```bash
# Create a release (auto-detect bump type)
/ship

# Patch release (1.0.0 -> 1.0.1)
/ship patch

# Minor release (1.0.0 -> 1.1.0)
/ship minor

# Major release (1.0.0 -> 2.0.0)
/ship major

# Dry run
/ship --dry-run
```

## Release Workflow

1. **Version Bump** - Updates version in package files
2. **Changelog** - Generates/updates CHANGELOG.md
3. **Git Tag** - Creates annotated git tag
4. **GitHub Release** - Creates release with notes
5. **Publish** - Publishes to package managers (optional)

## Version Bumping

### Manual Bump Types

```bash
/ship patch   # Bug fixes
/ship minor   # New features (backward compatible)
/ship major   # Breaking changes
```

### Auto-Detect from Commits

```bash
/ship --auto  # Analyzes commits since last tag
```

Uses conventional commits:
- `feat:` → minor bump
- `fix:` → patch bump
- `BREAKING CHANGE:` → major bump

## Changelog Generation

### Formats Supported

- **Keep a Changelog** (default)
- **Conventional Changelog**
- **GitHub Releases** format

### Customization

```bash
# Custom changelog path
/ship --changelog docs/HISTORY.md

# Include commit links
/ship --links

# Exclude specific commits
/ship --exclude "chore,docs"
```

## GitHub Integration

```bash
# Create GitHub release
/ship --github-release

# Generate release notes
/ship --generate-notes

# Pre-release
/ship --prerelease alpha
```

## Package Manager Publishing

### npm/yarn

```bash
# Auto-detect from package.json
/ship --publish

# Specific registry
/ship --publish --registry https://npm.example.com
```

### PyPI

```bash
/ship --publish --pypi
```

### Docker

```bash
/ship --publish --docker user/repo
```

## Monorepo Support

```bash
# Release specific package
/ship packages/ui

# Release all changed packages
/ship --workspaces
```

## CI/CD Integration

```bash
# Non-interactive mode
/ship --ci

# Skip prompts
/ship --yes

# With token
/ship --github-token $GITHUB_TOKEN
```

## Safety Checks

Before releasing:
- ✅ Working directory clean
- ✅ On main/master branch
- ✅ Tests passing
- ✅ No uncommitted changes
- ✅ Version not already tagged

Skip with `--skip-checks` (not recommended).
