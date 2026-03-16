---
name: ship
description: One-command release pipeline. Bumps version, generates changelog, creates GitHub release. Use when user wants to release a new version, publish package, or create GitHub release. Triggers on requests like /ship, release new version, publish, create release, or version bump.
metadata:
  openclaw:
    requires:
      bins: ["node", "npx", "git"]
      npm: ["@nko/superpowers"]
    primaryEnv: GH_TOKEN
    modelCompatibility: ["kimi-k2.5", "claude-opus-4", "gpt-4"]
    skillType: "typescript"
    entryPoint: "dist/index.js"
---

# Ship - Release Pipeline Skill

One-command release: version bump, changelog generation, git tag, push, GitHub release, and Telegram notifications.

## Capabilities

- Semantic versioning (patch, minor, major, or explicit version)
- Conventional commit changelog generation
- Git tag creation and push
- GitHub release creation
- Telegram notifications (optional)
- Dry-run preview mode

## Usage

### Release patch version

```bash
superpowers ship patch
```

### Release minor version

```bash
superpowers ship minor
```

### Release major version

```bash
superpowers ship major
```

### Release specific version

```bash
superpowers ship 1.2.3
```

### Preview without executing

```bash
superpowers ship patch --dry-run
```

## Version Types

- `patch` - Bug fixes (1.0.0 → 1.0.1)
- `minor` - New features (1.0.0 → 1.1.0)
- `major` - Breaking changes (1.0.0 → 2.0.0)
- `x.y.z` - Explicit version number

## Options

- `--version=<type>` - Version bump type (required)
- `--dry-run` - Preview changes without executing. Default: false
- `--skip-tests` - Skip test run before release. Default: false
- `--skip-changelog` - Skip changelog update. Default: false
- `--skip-git` - Skip git operations. Default: false
- `--skip-github` - Skip GitHub release. Default: false
- `--prerelease` - Mark as prerelease. Default: false
- `--notes=<text>` - Custom release notes

## Requirements

- Git repository with clean working directory
- `GH_TOKEN` environment variable for GitHub releases (optional)

## Release Steps

1. **Validate**: Check git status and working directory
2. **Tests**: Run test suite (unless --skip-tests)
3. **Version**: Update version in package.json
4. **Changelog**: Generate from conventional commits
5. **Commit**: Create release commit
6. **Tag**: Create git tag (vX.Y.Z)
7. **Push**: Push commit and tag to origin
8. **Release**: Create GitHub release (if GH_TOKEN set)
9. **Notify**: Send Telegram notification (if configured)

## Changelog Generation

Parses conventional commits since last tag:
- `feat:` → ✨ Features section
- `fix:` → 🐛 Bug Fixes section
- `chore:` → 🧹 Chores section
- `BREAKING CHANGE:` → ⚠️ Breaking Changes section

## Environment Variables

- `GH_TOKEN` - GitHub personal access token with `repo` scope (for GitHub releases)
- `TELEGRAM_BOT_TOKEN` - Bot token for Telegram notifications (optional)
- `TELEGRAM_CHAT_ID` - Chat ID for Telegram notifications (optional)

## Telegram Integration

When `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set:

```
🚀 Release Shipped

📦 package-name v1.2.3
✅ Successfully released to production
```
