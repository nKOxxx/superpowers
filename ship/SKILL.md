---
name: ship
description: One-command release pipeline. Bumps version, generates changelog, creates GitHub release. Use when user wants to release a new version, publish package, or create GitHub release. Triggers on requests like /ship, release new version, publish, create release, or version bump.
---

# /ship - Release Pipeline

One-command release: version bump, changelog, GitHub release.

## Quick Start

```bash
/ship --repo=nKOxxx/app --version=patch
/ship --repo=nKOxxx/app --version=minor
/ship --repo=nKOxxx/app --version=1.2.0
/ship --repo=nKOxxx/app --version=major --dry-run
```

## Version Types

### Semantic Versioning
- `patch` - Bug fixes (1.0.0 → 1.0.1)
- `minor` - New features (1.0.0 → 1.1.0)
- `major` - Breaking changes (1.0.0 → 2.0.0)
- `x.y.z` - Explicit version number

## Release Process

1. **Validate** - Check working directory is clean
2. **Test** - Run tests (if configured)
3. **Version** - Bump version in package.json
4. **Changelog** - Generate/update CHANGELOG.md
5. **Commit** - Create release commit
6. **Tag** - Create git tag
7. **Push** - Push to remote
8. **Release** - Create GitHub release
9. **Notify** - Send Telegram notification (if configured)

## Options

```bash
/ship --repo=nKOxxx/app --version=patch --dry-run      # Preview only
/ship --repo=nKOxxx/app --version=minor --skip-tests   # Skip test run
/ship --repo=nKOxxx/app --version=1.0.0 --notes="..."  # Custom release notes
```

## Configuration

```json
{
  "ship": {
    "requireCleanWorkingDir": true,
    "runTestsBeforeRelease": true,
    "testCommand": "npm test",
    "changelog": {
      "preset": "conventional",
      "includeContributors": true
    },
    "github": {
      "defaultOrg": "nKOxxx",
      "token": "${GH_TOKEN}"
    },
    "telegram": {
      "notifyOnShip": true,
      "target": "@nikolin0"
    }
  }
}
```

## Environment Variables

- `GH_TOKEN` - GitHub personal access token (required)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)
- `TELEGRAM_CHAT_ID` - Telegram chat ID (optional)

## Resources

- **scripts/ship.ts** - Main release pipeline script
- **scripts/lib/version.ts** - Version bump utilities
- **scripts/lib/changelog.ts** - Changelog generator
- **scripts/lib/github.ts** - GitHub API integration
- **references/release-checklist.md** - Release best practices

## Safety Checks

Before shipping, the skill validates:
- ✅ Working directory clean (can override with --force)
- ✅ Tests passing (if runTestsBeforeRelease: true)
- ✅ Version valid and incremented
- ✅ GitHub token has release permissions
- ✅ Remote repository accessible
