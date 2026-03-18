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

## Installation

```bash
npm install -g @openclaw/superpowers-ship
```

## Quick Start

```bash
# Patch release (bug fixes)
ship --version=patch

# Minor release (new features)
ship --version=minor

# Major release (breaking changes)
ship --version=major

# Explicit version
ship --version=1.2.3
```

## Release Process

```
Validate → Bump → Changelog → Commit → Tag → Push → Release → Notify
```

## Semantic Versioning

| Version Type | Change | Example |
|--------------|--------|---------|
| `patch` | Bug fixes | 1.0.0 → 1.0.1 |
| `minor` | New features (backward compatible) | 1.0.0 → 1.1.0 |
| `major` | Breaking changes | 1.0.0 → 2.0.0 |
| `x.y.z` | Explicit version | Any valid semver |

## Usage

```bash
# Patch release
ship --version=patch

# With custom notes
ship --version=minor --notes="Added awesome new feature"

# Dry run (preview only)
ship --version=major --dry-run

# Skip tests (not recommended)
ship --version=patch --skip-tests

# Force release with dirty working directory
ship --version=patch --force
```

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

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GH_TOKEN` | Yes | GitHub personal access token |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token |
| `TELEGRAM_CHAT_ID` | No | Telegram chat ID |

## Safety Features

### Dry Run Mode
```bash
ship --version=minor --dry-run
```

### Force Override
```bash
ship --version=patch --force
```

## CI/CD Integration

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

---

**Part of OpenClaw Superpowers** | [GitHub](https://github.com/nKOxxx/superpowers)
