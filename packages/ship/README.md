# @superpowers/ship

One-command release pipeline - version bump, changelog, git tag, GitHub release.

## Installation

```bash
npm install @superpowers/ship
```

## Usage

### CLI

```bash
# Release patch version (default)
ship

# Release specific bump type
ship --bump minor
ship --bump major

# Release explicit version
ship --bump 2.0.0

# Dry run (preview changes)
ship --dry-run

# Skip changelog generation
ship --no-changelog

# Skip git push
ship --skip-push

# Skip GitHub release
ship --skip-release
```

### Programmatic

```typescript
import { shipCommand } from '@superpowers/ship';

await shipCommand({
  version: 'minor',
  dryRun: false,
  skipTag: false,
  skipPush: false,
  skipRelease: false,
  changelog: true,
});
```

## Features

- ✅ Automatic version bumping (patch/minor/major)
- ✅ Conventional commit changelog generation
- ✅ Git commit and tag creation
- ✅ Git push to remote
- ✅ GitHub release creation (via gh CLI)
- ✅ Dry-run mode for testing

## Conventional Commits

Ship analyzes commits to generate changelogs and detect bump types:

- `feat:` → New features (minor bump)
- `fix:` → Bug fixes (patch bump)
- `feat!:` or `BREAKING CHANGE:` → Breaking changes (major bump)
- `docs:`, `style:`, `refactor:`, `test:`, `chore:` → Other changes

## CLI Options

```
Usage: ship [options]

Options:
  -b, --bump <type>    Version bump type (patch, minor, major) or explicit version (default: "patch")
  -d, --dry-run        Preview changes without applying (default: false)
  --skip-tag           Skip git tag creation (default: false)
  --skip-push          Skip git push (default: false)
  --skip-release       Skip GitHub release (default: false)
  --no-changelog       Skip changelog generation
  -h, --help          display help for command
```

## Environment Variables

- `GH_TOKEN` or `GITHUB_TOKEN` - Required for GitHub release creation

## Release Process

1. Validates git state (no uncommitted changes)
2. Calculates new version
3. Generates changelog from conventional commits
4. Updates package.json version
5. Updates CHANGELOG.md
6. Creates release commit
7. Creates git tag
8. Pushes to remote
9. Creates GitHub release (if token available)

## License

MIT
