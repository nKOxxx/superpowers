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
              "package": "@superpowers/ship",
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
# Initialize configuration
ship init

# Create a patch release
ship release patch

# Create a minor release with dry run
ship release minor --dry-run

# Preview what will be released
ship preview
```

## Commands

### release [bump]

Create a new release. The bump argument can be `major`, `minor`, `patch`, or `prerelease` (default: `patch`).

**Workflow:**
1. Analyze commits since last tag
2. Run tests (unless --skip-tests)
3. Update version in package.json
4. Update CHANGELOG.md
5. Commit changes
6. Create git tag
7. Push to origin
8. Create GitHub release (if token available)
9. Publish to npm (if token available)

**Options:**
- `-t, --tag <tag>` - Prerelease tag (e.g., `alpha`, `beta`, `rc`)
- `--skip-changelog` - Skip changelog generation
- `--skip-github` - Skip GitHub release creation
- `--skip-npm` - Skip npm publishing
- `--skip-git-checks` - Skip git branch/working directory checks
- `--skip-tests` - Skip running tests
- `-n, --dry-run` - Preview changes without making them
- `-f, --force` - Force release even with warnings
- `-v, --version <version>` - Custom version (overrides bump)

**Examples:**
```bash
# Patch release (1.0.0 → 1.0.1)
ship release patch

# Minor release (1.0.0 → 1.1.0)
ship release minor

# Major release (1.0.0 → 2.0.0)
ship release major

# Prerelease (1.0.0 → 1.0.1-alpha.0)
ship release prerelease --tag alpha

# Dry run to preview changes
ship release minor --dry-run

# Force release from non-main branch
ship release patch --force --skip-git-checks

# Custom version
ship release --version 2.0.0-beta.1
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

**Example:**
```bash
ship status
```

Sample output:
```
📊 Release Status

Current State:
  Version: 1.2.3
  Branch: main
  Working dir: clean
  Last tag: v1.2.3

Commits:
  Since last tag: 5
  Recommended bump: minor

Recent commits:
  feat: add user authentication
  fix: resolve login redirect issue
  docs: update API documentation

Configuration:
  GH_TOKEN: ✓
  NPM_TOKEN: ✗
```

### preview [bump]

Preview what would be included in the next release without making any changes.

**Example:**
```bash
ship preview
ship preview minor
ship preview major
```

Shows:
- Current and new version
- Changelog entry that would be generated
- Commits that will be included

### init

Initialize Ship configuration in the current project.

**Options:**
- `--default-bump <type>` - Set default bump type
- `--changelog-path <path>` - Set changelog file path
- `--release-branch <branch>` - Set release branch name

**Example:**
```bash
ship init
ship init --default-bump minor --release-branch develop
```

## Configuration

Create `.ship.config.json` in your project root:

```json
{
  "defaultBump": "patch",
  "changelogPath": "CHANGELOG.md",
  "packageFiles": ["package.json", "package-lock.json"],
  "tagPrefix": "v",
  "releaseBranch": "main",
  "requireCleanWorkingDir": true,
  "runTests": true,
  "testCommand": "npm test",
  "preReleaseHooks": ["npm run lint"],
  "postReleaseHooks": ["npm run deploy:docs"],
  "githubRepo": "owner/repo",
  "npmRegistry": "https://registry.npmjs.org/",
  "npmAccess": "public",
  "telegram": {
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "chatId": "${TELEGRAM_CHAT_ID}"
  }
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `defaultBump` | `patch` | Default version bump type |
| `changelogPath` | `CHANGELOG.md` | Path to changelog file |
| `packageFiles` | `["package.json"]` | Files to update with new version |
| `tagPrefix` | `v` | Git tag prefix |
| `releaseBranch` | `main` | Required branch for releases |
| `requireCleanWorkingDir` | `true` | Require clean git state |
| `runTests` | `true` | Run tests before release |
| `testCommand` | `npm test` | Test command to run |
| `preReleaseHooks` | `[]` | Commands to run before release |
| `postReleaseHooks` | `[]` | Commands to run after release |
| `githubRepo` | auto | GitHub owner/repo (auto-detected) |
| `npmRegistry` | npmjs | npm registry URL |
| `npmAccess` | `public` | npm package access |
| `telegram` | - | Telegram notification settings |

## Environment Variables

Set these in your environment or CI configuration:

### Required for GitHub releases
- `GH_TOKEN` or `GITHUB_TOKEN` - GitHub personal access token with `repo` scope

### Required for npm publishing
- `NPM_TOKEN` - npm authentication token

### Optional for notifications
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Telegram chat ID

## Conventional Commits

Ship analyzes commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Commit Type | Version Impact | Example |
|-------------|----------------|---------|
| `feat:` | Minor bump | `feat: add login` → 1.0.0 → 1.1.0 |
| `fix:` | Patch bump | `fix: auth bug` → 1.0.0 → 1.0.1 |
| `BREAKING CHANGE:` | Major bump | BREAKING CHANGE in footer |
| `feat!:` | Major bump | Breaking change indicator |

### Changelog Sections

Commits are grouped into changelog sections:

- ⚠ **BREAKING CHANGES**
- ✨ **Features** (`feat`)
- 🐛 **Bug Fixes** (`fix`)
- 📚 **Documentation** (`docs`)
- 💄 **Styles** (`style`)
- ♻️ **Code Refactoring** (`refactor`)
- ⚡ **Performance** (`perf`)
- ✅ **Tests** (`test`)
- 🔧 **Chores** (`chore`)

## CI/CD Integration

### GitHub Actions

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      bump:
        type: choice
        options:
          - patch
          - minor
          - major
        default: patch

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GH_TOKEN }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org/
      
      - run: npm ci
      
      - name: Configure Git
        run: |
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
      
      - name: Release
        run: npx ship release ${{ github.event.inputs.bump }} --ci
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Pre-release Checklist

Before running `ship release`:

1. ✅ All tests passing
2. ✅ Changelog reviewed
3. ✅ Documentation updated
4. ✅ Version bump appropriate
5. ✅ On correct branch
6. ✅ Working directory clean

## Safety Features

- **Branch protection** - Only releases from configured branch
- **Clean working directory** - Requires no uncommitted changes
- **Dry run mode** - Preview before executing
- **Force flag** - Override checks when needed
- **Pre-release hooks** - Run linting, type checks, etc.
- **Test execution** - Run test suite before release
