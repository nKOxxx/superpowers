# Release Checklist

## Pre-Release

- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately

## Version Selection

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fixes | patch | 1.0.0 → 1.0.1 |
| New features | minor | 1.0.0 → 1.1.0 |
| Breaking changes | major | 1.0.0 → 2.0.0 |

## Release Commands

### Dry Run

```bash
/ship --repo=owner/repo --version=patch --dry-run
```

### Standard Release

```bash
/ship --repo=owner/repo --version=minor
```

### Skip Tests (emergency)

```bash
/ship --repo=owner/repo --version=patch --skip-tests
```

## Environment Variables

Required:
- `GH_TOKEN` - GitHub personal access token

Optional:
- `TELEGRAM_BOT_TOKEN` - For notifications
- `TELEGRAM_CHAT_ID` - Target chat for notifications

## GitHub Token Permissions

Required scopes:
- `repo` - Full repository access
- `write:packages` - If publishing packages

## Post-Release

- [ ] Verify GitHub release created
- [ ] Check tag pushed correctly
- [ ] Verify npm package published (if applicable)
- [ ] Send release notes to team
- [ ] Monitor for issues

## Rollback

If release is broken:

```bash
# Revert commit
git revert HEAD

# Delete tag
git push --delete origin v1.0.0
git tag -d v1.0.0

# Push revert
git push
```

## Troubleshooting

### "Working directory not clean"

Commit or stash changes:
```bash
git add .
git commit -m "wip: pre-release"
```

Or force with `--force` (not recommended).

### "GitHub token not found"

Set environment variable:
```bash
export GH_TOKEN=ghp_xxxxxxxxxxxx
```

### Tests fail during release

Fix tests first, then re-run:
```bash
/ship --repo=owner/repo --version=patch
```

Or skip with `--skip-tests` (emergency only).

## Semantic Versioning

Follow [SemVer](https://semver.org/):

- **MAJOR** - Incompatible API changes
- **MINOR** - Backwards-compatible functionality
- **PATCH** - Backwards-compatible bug fixes
