---
name: ship
description: One-command release pipeline. Bumps version, generates changelog, creates GitHub release. Use when user wants to release a new version, publish package, or create GitHub release. Triggers on requests like /ship, release new version, publish, create release, or version bump.
metadata:
  openclaw:
    requires:
      bins: ["node", "npx", "git"]
      npm: ["@nko/superpowers"]
    primaryEnv: GH_TOKEN
---

# Ship - Release Pipeline Skill

One-command release: version bump, changelog generation, git tag, push, and GitHub release.

## Capabilities

- Semantic versioning (patch, minor, major, or explicit version)
- Conventional commit changelog generation
- Git tag creation and push
- GitHub release creation
- Dry-run preview mode

## Usage

### Release patch version

```bash
superpowers ship --version=patch
```

### Release minor version

```bash
superpowers ship --version=minor
```

### Release major version

```bash
superpowers ship --version=major
```

### Release specific version

```bash
superpowers ship --version=1.2.3
```

### Preview without executing

```bash
superpowers ship --version=patch --dry-run
```

## Version Types

- `patch` - Bug fixes (1.0.0 → 1.0.1)
- `minor` - New features (1.0.0 → 1.1.0)
- `major` - Breaking changes (1.0.0 → 2.0.0)
- `x.y.z` - Explicit version number

## Options

- `--version=<type>` - Version bump type (required)
- `--repo=<owner/repo>` - Repository for GitHub release. Default: auto-detect
- `--dry-run` - Preview changes without executing. Default: false
- `--skip-tests` - Skip test run before release. Default: false
- `--notes=<text>` - Custom release notes
- `--prerelease` - Mark as prerelease. Default: false

## Requirements

- Git repository with clean working directory
- `GH_TOKEN` environment variable for GitHub releases

## Release Steps

1. **Validate**: Check git status and working directory
2. **Tests**: Run test suite (unless --skip-tests)
3. **Version**: Update version in package.json
4. **Changelog**: Generate from conventional commits
5. **Commit**: Create release commit
6. **Tag**: Create git tag (vX.Y.Z)
7. **Push**: Push commit and tag to origin
8. **Release**: Create GitHub release (if GH_TOKEN set)

## Changelog Generation

Parses conventional commits since last tag:
- `feat:` → Features section
- `fix:` → Bug Fixes section
- `chore:` → Chores section
- Others → Other changes

## Environment Variables

- `GH_TOKEN` - Personal access token with `repo` scope (required for GitHub releases)
