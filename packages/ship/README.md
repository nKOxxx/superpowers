# /ship - Release Pipeline Skill

One-command release pipeline with semantic versioning, changelog generation, and GitHub releases.

## Features

- **Semantic versioning**: patch, minor, major, or explicit version
- **Conventional commit changelog**: Auto-generated from commit history
- **Git operations**: Tag creation and push
- **GitHub releases**: Automated release creation via API
- **Dry-run mode**: Preview changes without applying

## Usage

```bash
# Bump patch version (1.0.0 → 1.0.1)
ship --version=patch

# Bump minor version (1.0.0 → 1.1.0)
ship --version=minor

# Bump major version (1.0.0 → 2.0.0)
ship --version=major

# Explicit version
ship --version=1.2.3

# Preview changes
ship --version=patch --dry-run

# Skip git push
ship --version=patch --no-push

# Skip GitHub release
ship --version=patch --no-release
```

## Conventional Commits

The skill parses conventional commits to generate changelogs:

| Prefix | Section |
|--------|---------|
| `feat:` | Added |
| `fix:` | Fixed |
| `docs:` | Documentation |
| `refactor:` | Changed |
| `perf:` | Changed |
| `security:` | Security |
| `deprecated:` | Deprecated |
| `remove:` | Removed |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GH_TOKEN` or `GITHUB_TOKEN` | GitHub personal access token for releases |
| `SHIP_CHANGELOG_FILE` | Changelog filename (default: CHANGELOG.md) |
| `SHIP_TAG_PREFIX` | Git tag prefix (default: v) |
| `SHIP_DEFAULT_BRANCH` | Default git branch (default: main) |

## Workflow

1. Detects current version from package.json
2. Calculates new version based on bump type
3. Generates changelog from conventional commits
4. Updates package.json version
5. Updates/creates CHANGELOG.md
6. Commits changes
7. Creates git tag
8. Pushes to origin
9. Creates GitHub release (if token available)

## Output Example

```
🚀 Released v1.1.0

## [1.1.0] - 2026-03-15

### Added
- New user authentication flow
- Dark mode support

### Fixed
- Login redirect bug
- Mobile layout issues

Release: https://github.com/owner/repo/releases/tag/v1.1.0
```

## Requirements

- Node.js 18+
- Git repository with clean working directory
- GH_TOKEN for GitHub releases (optional)

## GitHub Token Setup

Create a personal access token with `repo` scope:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Set as `GH_TOKEN` environment variable

## Installation

```bash
openclaw skill install ship.skill.tar.gz
```
