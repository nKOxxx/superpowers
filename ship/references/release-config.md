# Release Configuration Reference

Configuration options for the release pipeline.

## Version Bumping

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH[-prerelease]`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes
- **prerelease**: alpha, beta, rc

### Conventional Commits

Commit types that trigger version bumps:

| Type | Version Bump | Description |
|------|--------------|-------------|
| `feat:` | minor | New feature |
| `fix:` | patch | Bug fix |
| `feat!:` | major | Breaking change |
| `BREAKING CHANGE:` | major | Breaking change (in body) |
| `chore:` | none | Maintenance |
| `docs:` | none | Documentation |
| `style:` | none | Code style |
| `refactor:` | none | Code refactoring |
| `test:` | none | Tests |

## Changelog Formats

### Keep a Changelog

```markdown
## [1.2.0] - 2024-03-20

### Added
- New feature X
- Support for Y

### Changed
- Improved performance of Z

### Fixed
- Bug in authentication

### Security
- Updated dependency with vulnerability
```

### Conventional Changelog

```markdown
## 1.2.0 (2024-03-20)

### Features
- **auth**: add OAuth2 support
- **api**: new endpoint for users

### Bug Fixes
- **ui**: button not clickable on mobile

### Breaking Changes
- **api**: removed deprecated v1 endpoints
```

## GitHub Release Configuration

### Release Notes Template

```markdown
## What's Changed

### 🚀 Features
* Feature description by @user in #123

### 🐛 Bug Fixes
* Fix description by @user in #124

### 📚 Documentation
* Doc update by @user in #125

**Full Changelog**: v1.0.0...v1.1.0
```

### Release Assets

Common assets to include:

- Source code (zip, tar.gz) - auto-generated
- Compiled binaries
- Documentation PDF
- SBOM (Software Bill of Materials)

## npm Publishing

### .npmrc Configuration

```ini
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
registry=https://registry.npmjs.org/
always-auth=true
```

### Package.json Fields

```json
{
  "name": "@scope/package",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md"],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

## Docker Publishing

### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

### Build and Push

```bash
# Build
docker build -t user/repo:version .

# Tag
docker tag user/repo:version user/repo:latest

# Push
docker push user/repo:version
docker push user/repo:latest
```

## GitHub Actions Workflow

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version bump type'
        required: true
        default: 'patch'
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
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      
      - name: Bump version
        run: |
          npm version ${{ inputs.version }} -m "chore(release): %s"
          git push --follow-tags
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
      
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Monorepo Configuration

### Lerna

```json
{
  "version": "independent",
  "npmClient": "npm",
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    }
  }
}
```

### Changesets

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```
