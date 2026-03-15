# Ship Skill

One-command release pipeline with semantic versioning, changelog generation, and GitHub releases.

## Usage

```
/ship [options]
```

### Options

- `--version=<type>` - Version bump: `patch`, `minor`, `major`, or specific version
- `--repo=<name>` - Repository name (auto-detected from git remote)
- `--dry-run` - Simulate release without making changes
- `--no-push` - Skip git push
- `--no-release` - Skip GitHub release creation
- `--changelog-only` - Only generate changelog, skip release
- `--prerelease=<tag>` - Create prerelease (e.g., `alpha`, `beta`)

### Semantic Versioning

| Type | When to use | Example |
|------|-------------|---------|
| patch | Bug fixes | 1.0.0 → 1.0.1 |
| minor | New features, backwards compatible | 1.0.0 → 1.1.0 |
| major | Breaking changes | 1.0.0 → 2.0.0 |

### Conventional Commits

Changelog is generated from conventional commits:

```
feat: new feature → Added section
fix: bug fix → Fixed section
docs: documentation → Documentation section
chore: maintenance → Chores section
refactor: refactoring → Changed section
test: tests → no changelog entry
style: formatting → no changelog entry
```

## Examples

### Patch Release
```
/ship --version=patch
```

### Minor Release with Dry Run
```
/ship --version=minor --dry-run
```

### Major Release
```
/ship --version=major
```

### Specific Version
```
/ship --version=2.5.0
```

### Prerelease (Beta)
```
/ship --version=minor --prerelease=beta
```

### Generate Changelog Only
```
/ship --changelog-only
```

## Release Pipeline

1. **Validate** - Check working directory is clean
2. **Version** - Bump version in package.json
3. **Changelog** - Generate from conventional commits
4. **Commit** - Commit version and changelog changes
5. **Tag** - Create git tag (e.g., `v1.2.3`)
6. **Push** - Push commits and tag to remote
7. **Release** - Create GitHub release with changelog

## Output Format

```json
{
  "version": "1.2.3",
  "previousVersion": "1.2.2",
  "tag": "v1.2.3",
  "changes": {
    "added": ["new feature A", "new feature B"],
    "fixed": ["bug fix C"],
    "changed": ["refactoring D"]
  },
  "commits": 12,
  "filesChanged": 5,
  "releaseUrl": "https://github.com/owner/repo/releases/tag/v1.2.3"
}
```

## GitHub Integration

Requires `GITHUB_TOKEN` environment variable for release creation.

Token permissions needed:
- `repo` - Full repository access
- Or `contents:write` for releases only

## Configuration

Environment variables:
- `GITHUB_TOKEN` - GitHub personal access token
- `SHIP_DEFAULT_BRANCH` - Default branch (default: main)
- `SHIP_CHANGELOG_FILE` - Changelog filename (default: CHANGELOG.md)
- `SHIP_TAG_PREFIX` - Git tag prefix (default: v)

## Dry Run Mode

Preview changes without applying:

```
/ship --version=minor --dry-run
```

Shows:
- New version number
- Changelog entries
- Files that would be modified
- Commands that would run

## Handler

**Entry:** `handler.ts`
**Runtime:** Node.js with git and GitHub API
