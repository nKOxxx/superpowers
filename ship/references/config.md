# Ship Configuration

## .shiprc Configuration File

Create `.shiprc` in your project root:

```json
{
  "versionFile": "package.json",
  "changelogFile": "CHANGELOG.md",
  "tagPrefix": "v",
  "commitMessage": "chore(release): {{version}}",
  "npmPublish": true,
  "githubRelease": true,
  "branches": ["main", "master"],
  "skip": {
    "changelog": false,
    "tag": false,
    "release": false,
    "publish": false
  }
}
```

## Conventional Commits

Ship analyzes commit messages to determine version bumps:

### Commit Types

| Type | Version | Example |
|------|---------|---------|
| feat | minor | `feat: add user authentication` |
| feat! | major | `feat!: redesign API (breaking)` |
| fix | patch | `fix: resolve login issue` |
| docs | - | `docs: update README` |
| refactor | patch | `refactor: simplify auth logic` |
| perf | patch | `perf: optimize query` |
| test | - | `test: add auth tests` |
| chore | - | `chore: update deps` |

### Scopes

Use scopes for organization:

```
feat(auth): add OAuth support
fix(ui): resolve button alignment
refactor(api): extract middleware
```

## Pre-releases

Beta releases:
```bash
/ship --minor --pre-release beta
# Results in: 1.1.0-beta
```

Release candidates:
```bash
/ship --minor --pre-release rc
# Results in: 1.1.0-rc
```

## Dry Run

Preview changes without applying:

```bash
/ship --minor --dry-run
```

Output shows:
- Current version → New version
- Commits that will be included
- Changelog preview
- Files that will be modified
