---
name: ship
description: One-command release pipeline (version bump, changelog, GitHub release). Use when the user needs to publish a new version of a package, create a GitHub release, generate changelogs, or automate the release workflow. Supports semantic versioning, conventional commits, and multiple package managers.
user-invocable: true
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["git", "node"] },
        "emoji": "🚀",
        "primaryEnv": "GITHUB_TOKEN",
      },
  }
---

# Ship - One-Command Release Pipeline

Automate your entire release workflow with a single command: version bumping, changelog generation, GitHub releases, and package publishing.

## Quick Start

### Release a New Version
```bash
/ship --version=patch   # 1.0.0 → 1.0.1
/ship --version=minor   # 1.0.0 → 1.1.0
/ship --version=major   # 1.0.0 → 2.0.0
/ship --version=1.2.3   # Set explicit version
```

### Dry Run (Preview)
```bash
/ship --version=minor --dry-run
```

## Commands

### `/ship --version=<bump>`
Execute the full release pipeline.

**Version Options:**
- `patch` - Bug fixes (0.0.1)
- `minor` - New features, backward compatible (0.1.0)
- `major` - Breaking changes (1.0.0)
- `prerelease` - Pre-release version (1.0.0-alpha.0)
- `1.2.3` - Explicit version number

**Release Options:**
- `--dry-run` - Preview changes without applying
- `--skip-tests` - Skip running tests before release
- `--skip-build` - Skip build step
- `--skip-publish` - Skip package registry publish
- `--skip-github` - Skip GitHub release creation
- `--skip-changelog` - Skip changelog generation
- `--prerelease-id=<id>` - Pre-release identifier (alpha, beta, rc)
- `--target=<branch>` - Target branch for release (default: current)
- `--message=<msg>` - Custom release message
- `--assets=<glob>` - Additional assets to upload to GitHub release
- `--sign` - Create signed git tag
- `--force` - Skip confirmation prompts

### `/ship changelog`
Generate or update changelog.

**Options:**
- `--from=<ref>` - Start from specific ref
- `--to=<ref>` - End at specific ref (default: HEAD)
- `--output=<path>` - Output file (default: CHANGELOG.md)
- `--format=<markdown|json>` - Output format
- `--unreleased` - Show unreleased changes only

### `/ship version`
Manage version without full release.

**Options:**
- `--bump=<type>` - Bump type: patch, minor, major
- `--set=<version>` - Set explicit version
- `--show` - Show current version
- `--tag` - Create git tag for current version

### `/ship init`
Initialize ship configuration for the project.

Creates `ship.config.js` with:
- Package manager detection (npm, yarn, pnpm)
- Version file locations
- Changelog settings
- GitHub integration
- Pre/post release hooks

### `/ship status`
Check release readiness.

Shows:
- Current version
- Uncommitted changes
- Unpushed commits
- Unreleased commits since last tag
- Test status
- Build status

## Configuration (ship.config.js)

```javascript
module.exports = {
  // Version management
  version: {
    // Files to update with version
    files: ['package.json', 'package-lock.json'],
    // Additional placeholder replacements
    placeholders: [
      { file: 'src/version.ts', pattern: 'VERSION = "(.*)"' }
    ]
  },
  
  // Changelog
  changelog: {
    enabled: true,
    file: 'CHANGELOG.md',
    preset: 'conventional', // or 'angular', 'atom', 'ember'
    includeLinks: true,
    includeContributors: true
  },
  
  // Git
  git: {
    requireCleanWorkingDir: true,
    addFiles: ['package.json', 'CHANGELOG.md'],
    commitMessage: 'chore(release): ${version}',
    tagName: 'v${version}',
    tagAnnotation: 'Release ${version}',
    push: true,
    pushRepo: 'origin'
  },
  
  // GitHub
  github: {
    enabled: true,
    release: true,
    releaseName: 'v${version}',
    releaseNotes: true,
    draft: false,
    prerelease: false,
    assets: ['dist/*', '*.tgz']
  },
  
  // npm/publish
  publish: {
    enabled: true,
    registry: 'https://registry.npmjs.org',
    access: 'public' // or 'restricted'
  },
  
  // Hooks
  hooks: {
    'before:init': ['npm test'],
    'after:bump': ['npm run build'],
    'after:git:release': ['echo "Git release done"'],
    'after:release': ['npm run notify']
  },
  
  // Plugins
  plugins: {
    '@ship/plugin-conventional-changelog': {},
    '@ship/plugin-telegram': {
      channel: '@releases'
    }
  }
};
```

## Release Pipeline

```
1. PRE-RELEASE CHECKS
   └── Verify clean working directory
   └── Run pre-release hooks (tests, lint)
   └── Check GitHub token

2. VERSION BUMP
   └── Calculate new version
   └── Update version in configured files
   └── Run after:bump hooks

3. CHANGELOG GENERATION
   └── Parse conventional commits
   └── Categorize changes (features, fixes, breaking)
   └── Update CHANGELOG.md

4. GIT RELEASE
   └── Stage configured files
   └── Create release commit
   └── Create annotated tag
   └── Push commit and tag

5. GITHUB RELEASE
   └── Create GitHub release
   └── Upload assets
   └── Generate release notes

6. PACKAGE PUBLISH
   └── Build package
   └── Publish to registry
   └── Run after:release hooks

7. NOTIFICATION
   └── Send success notification
```

## Conventional Commits

The ship skill parses conventional commits to generate changelogs:

```
feat: add user authentication
fix: resolve login timeout issue
docs: update API documentation
style: format with prettier
refactor: extract utils module
test: add unit tests for auth
chore: update dependencies
```

**Breaking Changes:**
```
feat!: redesign API response format
feat(api): add pagination

BREAKING CHANGE: response structure changed
```

## GitHub Integration

Requires `GITHUB_TOKEN` environment variable with `repo` scope.

### Token Setup

```bash
# Linux/Mac
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Windows
set GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

Or configure in OpenClaw:
```json
{
  "skills": {
    "entries": {
      "ship": {
        "apiKey": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

## Examples

### Standard Release
```bash
/ship --version=minor
```

### Pre-release
```bash
/ship --version=prerelease --prerelease-id=alpha
# → 1.0.0-alpha.0
```

### With Custom Message
```bash
/ship --version=major --message="Major release with new features"
```

### Dry Run (Preview)
```bash
/ship --version=minor --dry-run
```
Output:
```
📦 Current version: 1.0.0
🚀 New version: 1.1.0

Changes to be made:
  ✓ Update package.json: 1.0.0 → 1.1.0
  ✓ Update CHANGELOG.md
  ✓ Create git commit: "chore(release): 1.1.0"
  ✓ Create git tag: v1.1.0
  ✓ Push to origin
  ✓ Create GitHub release
  ✓ Publish to npm

Run without --dry-run to apply changes.
```

### Release with Assets
```bash
/ship --version=patch --assets="dist/*,docs/*.pdf"
```

## Telegram Notifications

Configure to receive release notifications:

```javascript
// ship.config.js
module.exports = {
  notifications: {
    telegram: {
      channel: '@mychannel',
      template: '🚀 Released {name}@{version}'
    }
  }
};
```

## Error Handling

Common issues and solutions:

| Error | Solution |
|-------|----------|
| Working directory not clean | Commit or stash changes first |
| GITHUB_TOKEN not set | Set env var or configure in OpenClaw |
| Tests failing | Fix tests or use --skip-tests |
| Version already exists | Use different version or delete tag |
| npm publish failed | Check npm auth: `npm whoami` |

## CI/CD Integration

```yaml
# .github/workflows/release.yml
name: Release
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version bump'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx ship --version=${{ github.event.inputs.version }} --force
```
