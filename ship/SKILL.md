---
name: ship
description: "One-command release pipeline - version bumping, changelog generation, and GitHub releases. Use when: (1) creating a new release, (2) managing semantic versioning, (3) automating release workflows, (4) publishing to npm/GitHub."
metadata:
  {
    "openclaw":
      {
        "emoji": "🚀",
        "requires": { "bins": ["npx"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "@nko/superpowers",
              "bins": ["ship"],
              "label": "Install Ship skill (npm)",
            },
          ],
      },
  }
---

# Ship Skill

One-command release pipeline. Version bumping, changelog generation, GitHub releases, and npm publishing - all in one command.

## Quick Start

```bash
# Create a patch release
ship --repo=nKOxxx/app --version=patch

# Create a minor release with dry run
ship --repo=nKOxxx/app --version=minor --dry-run

# Preview what will be released
ship --repo=nKOxxx/app --version=patch --dry-run
```

## Commands

### release

Create a new release.

**Workflow:**
1. Analyze commits since last tag
2. Run tests (unless --skip-tests)
3. Update version in package.json
4. Update CHANGELOG.md
5. Commit changes
6. Create git tag
7. Push to origin
8. Create GitHub release (if token available)
9. Send Telegram notification (if configured)

**Options:**
- `-r, --repo <repo>` - Repository (owner/repo format, required)
- `-v, --version <version>` - Version bump: `patch`, `minor`, `major`, or specific semver
- `-t, --tag <tag>` - Prerelease tag (e.g., `alpha`, `beta`, `rc`)
- `--skip-changelog` - Skip changelog generation
- `--skip-github` - Skip GitHub release creation
- `--skip-git-checks` - Skip git branch/working directory checks
- `--skip-tests` - Skip running tests
- `-n, --dry-run` - Preview changes without making them
- `-f, --force` - Force release even with warnings

**Examples:**
```bash
# Patch release (1.0.0 → 1.0.1)
ship --repo=nKOxxx/app --version=patch

# Minor release (1.0.0 → 1.1.0)
ship --repo=nKOxxx/app --version=minor

# Major release (1.0.0 → 2.0.0)
ship --repo=nKOxxx/app --version=major

# Dry run to preview changes
ship --repo=nKOxxx/app --version=minor --dry-run

# Force release from non-main branch
ship --repo=nKOxxx/app --version=patch --force --skip-git-checks
```

### status

Show current release status and configuration.

**Output:**
- Current version
- Current branch
- Working directory status
- Last tag
- Commits since last tag
- Recommended bump type
- Token availability (GH_TOKEN, NPM_TOKEN)

## Configuration

Configure via `superpowers.config.json`:

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

- `GH_TOKEN` or `GITHUB_TOKEN` - GitHub personal access token with `repo` scope
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)
- `TELEGRAM_CHAT_ID` - Telegram chat ID (optional)

## Conventional Commits

Ship analyzes commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Commit Type | Version Impact | Example |
|-------------|----------------|---------|
| `feat:` | Minor bump | `feat: add login` → 1.0.0 → 1.1.0 |
| `fix:` | Patch bump | `fix: auth bug` → 1.0.0 → 1.0.1 |
| `BREAKING CHANGE:` | Major bump | BREAKING CHANGE in footer |

### Changelog Sections

- ⚠ **BREAKING CHANGES**
- ✨ **Features** (`feat`)
- 🐛 **Bug Fixes** (`fix`)
- 📚 **Documentation** (`docs`)
- ♻️ **Code Refactoring** (`refactor`)
- ⚡ **Performance** (`perf`)
- ✅ **Tests** (`test`)
- 🔧 **Chores** (`chore`)

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Release
  run: npx ship --repo=${{ github.repository }} --version=patch
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

## Safety Features

- **Branch protection** - Only releases from configured branch
- **Clean working directory** - Requires no uncommitted changes
- **Dry run mode** - Preview before executing
- **Force flag** - Override checks when needed
- **Test execution** - Run test suite before release

## Telegram Notifications

When configured, Ship sends a Telegram notification on successful release:

```
🚀 *New Release*

*Repository:* nKOxxx/app
*Version:* `1.2.3`
*Release:* [View on GitHub](https://github.com/...)
```

## Resources

- **scripts/ship.ts** - Main release pipeline script
- **scripts/lib/version.ts** - Version bump utilities
- **scripts/lib/changelog.ts** - Changelog generator
- **scripts/lib/github.ts** - GitHub API integration
- **scripts/lib/telegram.ts** - Telegram notifications
