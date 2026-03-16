---
name: ship
description: One-command release pipeline. Bumps version, generates changelog, creates GitHub release. Use when user wants to release a new version, publish package, or ship code. Triggers on /ship, release, publish, or ship commands.
triggers:
  - /ship
  - release
  - publish
  - ship
  - version bump
  - create release
model: kimi-k2.5
---

# 🚀 /ship - Release Pipeline Superpower

One-command release: version bump, changelog generation, GitHub release creation.

## Philosophy (gstack-inspired)

Following Garry Tan's gstack philosophy:
- **Fast**: One command to ship
- **Simple**: Semantic versioning, no manual steps
- **Reliable**: Pre-release checks, dry-run mode
- **Automated**: Everything from commit to release

## Quick Start

```bash
# Patch release (bug fixes)
/ship --version=patch

# Minor release (new features)
/ship --version=minor

# Major release (breaking changes)
/ship --version=major

# Explicit version
/ship --version=1.2.3
```

## Release Process

The ship skill automates the entire release workflow:

```
┌─────────────┐
│   Validate  │ → Check working directory, tests
└──────┬──────┘
       ▼
┌─────────────┐
│    Bump     │ → Update version in package.json
└──────┬──────┘
       ▼
┌─────────────┐
│  Changelog  │ → Generate/update CHANGELOG.md
└──────┬──────┘
       ▼
┌─────────────┐
│    Commit   │ → Create release commit
└──────┬──────┘
       ▼
┌─────────────┐
│     Tag     │ → Create git tag (vX.Y.Z)
└──────┬──────┘
       ▼
┌─────────────┐
│     Push    │ → Push commit and tags
└──────┬──────┘
       ▼
┌─────────────┐
│   Release   │ → Create GitHub release
└──────┬──────┘
       ▼
┌─────────────┐
│   Notify    │ → Telegram notification
└─────────────┘
```

## Semantic Versioning

| Version Type | Change | Example |
|--------------|--------|---------|
| `patch` | Bug fixes | 1.0.0 → 1.0.1 |
| `minor` | New features (backward compatible) | 1.0.0 → 1.1.0 |
| `major` | Breaking changes | 1.0.0 → 2.0.0 |
| `x.y.z` | Explicit version | Any valid semver |

## Usage

### Basic Commands

```bash
# Patch release
/ship --version=patch

# With custom notes
/ship --version=minor --notes="Added awesome new feature"

# Dry run (preview only)
/ship --version=major --dry-run

# Skip tests (not recommended)
/ship --version=patch --skip-tests

# Force release with dirty working directory
/ship --version=patch --force

# Specify repository
/ship --repo=owner/repo --version=patch

# Send Telegram notification
/ship --version=patch --telegram
```

### Pre-release Checks

Before shipping, the skill validates:

- ✅ Working directory clean (or `--force`)
- ✅ Tests passing (if `runTestsBeforeRelease: true`)
- ✅ Valid version bump
- ✅ GitHub token available
- ✅ Repository accessible

## Configuration

Create `superpowers.config.json`:

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
      "notifyOnShip": true
    }
  },
  "telegram": {
    "enabled": true,
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "chatId": "${TELEGRAM_CHAT_ID}"
  }
}
```

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--version` | `-v` | Version bump (patch/minor/major/x.y.z) | **required** |
| `--repo` | `-r` | Repository (owner/repo) | auto-detect |
| `--dry-run` | `-d` | Preview without making changes | `false` |
| `--skip-tests` | - | Skip test execution | `false` |
| `--notes` | `-n` | Custom release notes | auto-generate |
| `--force` | `-f` | Force even with dirty working directory | `false` |
| `--telegram` | `-t` | Send Telegram notification | `false` |
| `--config` | `-c` | Config file path | - |

## Output

```
🚢 Ship - Release Pipeline Superpower
Repository: nKOxxx/superpowers
Version: 1.0.0 → 1.0.1

✅ Working directory clean
🧪 Running tests...
✓ Tests passed (23.4s)
📦 Bumping version to 1.0.1...
✓ Updated package.json
📝 Generating changelog...
✓ Updated CHANGELOG.md
📋 Creating release commit...
✓ Created commit: chore(release): 1.0.1
🏷 Creating tag v1.0.1...
✓ Created tag v1.0.1
📤 Pushing to remote...
✓ Pushed to remote
🚀 Creating GitHub release v1.0.1...
✓ Created GitHub release: https://github.com/nKOxxx/superpowers/releases/tag/v1.0.1
✓ Telegram notification sent

✅ Release shipped successfully!
Version: v1.0.1
Release: https://github.com/nKOxxx/superpowers/releases/tag/v1.0.1
```

## Changelog Generation

The skill automatically generates changelog entries from git commits:

```markdown
## [1.0.1] - 2024-01-15

- fix(auth): resolve login issue
- docs(readme): update installation guide
- chore(deps): update dependencies
```

### Conventional Commits

For best results, use conventional commits:

- `feat:` → New features
- `fix:` → Bug fixes
- `docs:` → Documentation
- `chore:` → Maintenance
- `refactor:` → Code refactoring
- `test:` → Tests

## GitHub Integration

### Required Permissions

Your `GH_TOKEN` needs:
- `repo` scope for private repositories
- `public_repo` scope for public repositories

### Release Creation

The skill creates GitHub releases with:
- Release notes from changelog
- Link to full changelog
- Associated git tag

## Telegram Integration

When enabled, ship sends:
- Repository name
- New version
- Release URL
- Success/failure status

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GH_TOKEN` | Yes | GitHub personal access token |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token |
| `TELEGRAM_CHAT_ID` | No | Telegram chat ID |

## Safety Features

### Dry Run Mode

Preview the entire release without making changes:

```bash
/ship --version=minor --dry-run
```

Output shows what *would* happen:
```
⚠ DRY RUN - No changes will be made

[DRY RUN] Would update version to 1.1.0
[DRY RUN] Would update CHANGELOG.md
[DRY RUN] Would create commit: chore(release): 1.1.0
[DRY RUN] Would create tag v1.1.0
[DRY RUN] Would push to remote
[DRY RUN] Would create GitHub release
```

### Force Override

Release even with uncommitted changes:

```bash
/ship --version=patch --force
```

⚠️ Use with caution!

## CI/CD Integration

### GitHub Actions

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version bump'
        required: true
        default: 'patch'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx superpowers-ship --version=${{ github.event.inputs.version }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Best Practices

1. **Always test first**: Use `--dry-run` for new projects
2. **Clean working directory**: Commit changes before releasing
3. **Write good commits**: Better commits = better changelog
4. **Tag format**: Use `v` prefix (v1.0.0)
5. **Release notes**: Add context for major changes

## Exit Codes

- `0` - Release successful
- `1` - Validation failed or release error
- `2` - Configuration error

## Dependencies

- `@octokit/rest` - GitHub API
- `commander` - CLI framework
- `chalk` - Terminal colors
- `semver` - Version parsing
- `simple-git` - Git operations

## References

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Releases](references/github-releases.md)

---

**Part of OpenClaw Superpowers** | [GitHub](https://github.com/nKOxxx/superpowers)
